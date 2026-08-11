// routes/images.js
// USB image routes - provides API endpoints for image management
// - Serves static images from USB mount point
// - Provides directory browsing functionality
// - Lists images for frontend gallery display

const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Path to USB mount point with images directory
const imagesRoot = '/mnt/usb';

/**
 * GET /api/images/serve?path=some/image.jpg
 * Serves individual images with proper headers for external consumption
 * Designed for Pi Zero SDL2_image processing
 * Returns raw image data with appropriate MIME type
 */
router.get('/serve', requireAuth, async (req, res) => {
  try {
    const relPath = req.query.path || '';
    if (!relPath) {
      return res.status(400).json({ error: 'Image path required' });
    }

    const usbRoot = '/mnt/usb';
    const absPath = path.resolve(path.join(usbRoot, relPath));
    const resolvedUsbRoot = path.resolve(usbRoot);

    // Security check - ensure path is within USB mount
    if (!absPath.startsWith(resolvedUsbRoot)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if file exists and is an image
    const stats = await fs.stat(absPath);
    if (!stats.isFile()) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (!/\.(jpg|jpeg|png|gif|webp|bmp|tiff)$/i.test(relPath)) {
      return res.status(400).json({ error: 'Not an image file' });
    }

    // Set appropriate MIME type
    const ext = path.extname(relPath).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.bmp': 'image/bmp',
      '.tiff': 'image/tiff'
    };

    const mimeType = mimeTypes[ext] || 'application/octet-stream';
    
    // Set headers for SDL2 consumption
    res.set({
      'Content-Type': mimeType,
      'Content-Length': stats.size,
      'Cache-Control': 'public, max-age=3600',
      'X-Image-Width': 'unknown', // Could add image dimension detection here
      'X-Image-Height': 'unknown',
      'X-Image-Format': ext.slice(1).toUpperCase()
    });

    // Stream the file
    const readStream = require('fs').createReadStream(absPath);
    readStream.pipe(res);
    
  } catch (err) {
    console.error('Error serving image:', err && (err.message || err));
    if (err.code === 'ENOENT') {
      res.status(404).json({ error: 'File not found' });
    } else {
      res.status(500).json({ error: 'Unable to serve image' });
    }
  }
});

/**
 * GET /api/images/browse?path=some/nested/path
 * Browse directories within the USB mount using query parameter
 * Returns JSON with directories and images for frontend rendering
 * Supports nested directory navigation
 */
router.get('/browse', requireAuth, async (req, res) => {
  const relPath = req.query.path || '';
  await browsePath(req, res, relPath);
});

async function browsePath(req, res, relPath) {
  try {
    const usbRoot = '/mnt/usb';
    const absPath = path.join(usbRoot, relPath);

    // Security check - ensure path is within USB mount
    const resolvedUsbRoot = path.resolve(usbRoot);
    const resolvedAbsPath = path.resolve(absPath);
    if (!resolvedAbsPath.startsWith(resolvedUsbRoot)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const items = await fs.readdir(absPath, { withFileTypes: true });
    
    const directories = [];
    const images = [];
    
    items.forEach(item => {
      if (item.isDirectory()) {
        directories.push({
          name: item.name,
          type: 'directory',
          path: path.join(relPath, item.name).replace(/\\/g, '/')
        });
      } else if (/\.(jpg|jpeg|png)$/i.test(item.name)) {
        images.push({
          name: item.name,
          type: 'image',
          path: path.join(relPath, item.name).replace(/\\/g, '/'),
          url: `/usb/${path.join(relPath, item.name).replace(/\\/g, '/')}`
        });
      } else if (/\.(txt)$/i.test(item.name)) {
        // handle .txt files so they can be an easy add for employees.
      }
    });
    
    // Sort directories first, then images, both alphabetically
    directories.sort((a, b) => a.name.localeCompare(b.name));
    images.sort((a, b) => a.name.localeCompare(b.name));
    
    const parentPath = relPath ? path.dirname(relPath).replace(/\\/g, '/') : null;
    
    res.json({
      currentPath: relPath,
      parentPath: parentPath === '.' ? '' : parentPath,
      directories,
      images,
      totalItems: directories.length + images.length
    });
  } catch (err) {
    console.error('Error browsing directory:', err && (err.message || err));
    res.status(500).json({ error: 'Unable to read directory' });
  }
}



//https://www.geeksforgeeks.org/node-js/node-js-fs-stat-method/
//https://www.geeksforgeeks.org/web-tech/express-js-res-sendfile-function/
// Helper function to grab image from file system
async function grabImage(imagePath) {
  try {
    // Check if file exists and get stats
    const stats = await fs.stat(imagePath);
    if (!stats.isFile()) {
      throw new Error('File not found or is not a regular file');
    }

    // Validate it's an image file
    //if (!/\.(jpg|jpeg|png)$/i.test(imagePath)) {
    if (!/\.(jpg)$/i.test(imagePath)) {
      throw new Error('File is not a supported image format');
    }

    return {
      success: true,
      stats: stats,
      path: imagePath,
      size: stats.size,
      extension: path.extname(imagePath).toLowerCase()
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
      code: err.code
    };
  }
}

// Helper function to process image for delivery
function processImageForDelivery(imageInfo, res) {
  try {
    // Set appropriate MIME type based on extension
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      //'.jpeg': 'image/jpeg',
      //'.png': 'image/png',
    };

    const mimeType = mimeTypes[imageInfo.extension] || 'application/octet-stream';
    
    // Set headers optimized for Pi Zero consumption
    res.set({
      'Content-Type': mimeType,
      'Content-Length': imageInfo.size,
      'Cache-Control': 'public, max-age=3600',
      'X-Image-Size': imageInfo.size,
      'X-Image-Format': imageInfo.extension.slice(1).toUpperCase(),
      'X-Delivery-Source': 'NTTB-Pi5-Server'
    });

    return {
      success: true,
      mimeType: mimeType
    };
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
}

//get a single image across to the zero here for proof of concept
router.get('/test', async (req, res) => {
  try {
    const testImagePath = path.join(imagesRoot, 'test_images', 'image_001.jpg');
    
    // Use helper function to grab image
    const imageResult = await grabImage(testImagePath);
    
    if (!imageResult.success) {
      console.error('Failed to grab image:', imageResult.error);
      return res.status(404).json({ 
        error: 'Test image not found',
        details: imageResult.error 
      });
    }

    // Use helper function to process image for delivery
    const processResult = processImageForDelivery(imageResult, res);
    
    if (!processResult.success) {
      console.error('Failed to process image:', processResult.error);
      return res.status(500).json({ 
        error: 'Failed to process image for delivery',
        details: processResult.error 
      });
    }

    console.log(`Serving test image: ${testImagePath} (${imageResult.size} bytes, ${processResult.mimeType})`);
    
    // Send the file with processed headers
    res.sendFile(testImagePath);
    
  } catch (err) {
    console.error('Error in test endpoint:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

//get list of .jpg file names in test_images directory
router.get('/test-list',  async (req, res) => {
  try {
    const testImagesDir = path.join(imagesRoot, 'images', 'test_images');
    
    // Read directory contents
    const items = await fs.readdir(testImagesDir, { withFileTypes: true });
    
    // Filter for .jpg files only
    const jpgFiles = items
      .filter(item => item.isFile() && /\.jpg$/i.test(item.name))
      .map(item => item.name);
    
    // Sort alphabetically
    jpgFiles.sort((a, b) => a.localeCompare(b));
    
    console.log(`Found ${jpgFiles.length} .jpg files in test_images directory`);
    
    res.json({
      directory: 'test_images',
      totalFiles: jpgFiles.length,
      files: jpgFiles,
      timestamp: new Date().toISOString()
    });
    
  } catch (err) {
    console.error('Error listing test images:', err);
    if (err.code === 'ENOENT') {
      res.status(404).json({ 
        error: 'Test images directory not found',
        directory: 'test_images'
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to read test images directory',
        details: err.message 
      });
    }
  }
});


module.exports = router;