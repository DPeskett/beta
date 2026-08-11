// public/js/browse_images.js
// Frontend JavaScript for USB directory browser and image viewer
// Requires: authClient.js for authenticated API calls

let currentPath = '';

// Check authentication on page load
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/index.html';
        return false;
    }
    return true;
}

async function loadDirectory(path = '') {
    try {
        currentPath = path;
        const endpoint = path ? `/api/images/browse?path=${encodeURIComponent(path)}` : '/api/images/browse';
        const response = await api(endpoint);
        
        if (!response.ok) {
            if (response.status === 401) {
                requireAuthRedirect();
                return;
            }
            throw new Error(`HTTP ${response.status}: ${response.body.error || 'Unknown error'}`);
        }
        
        renderDirectory(response.body);
    } catch (error) {
        console.error('Error loading directory:', error);
        const container = document.getElementById('image-gallery');
        container.innerHTML = `<div class="error">Error loading directory: ${error.message}</div>`;
    }
}

function renderDirectory(data) {
    const container = document.getElementById('image-gallery');
    
    let html = `
        <div class="directory-header">
            <h2>USB Drive: /${data.currentPath || ''}</h2>
            <div class="breadcrumb">
                <a href="#" data-path="">USB Root</a>
    `;
    
    // Build breadcrumb navigation
    if (data.currentPath) {
        const pathParts = data.currentPath.split('/');
        let buildPath = '';
        pathParts.forEach(part => {
            buildPath += (buildPath ? '/' : '') + part;
            html += ` / <a href="#" data-path="${buildPath}">${part}</a>`;
        });
    }
    
    html += `
            </div>
        </div>
        <div class="directory-content">
    `;
    
    // Parent directory link
    if (data.parentPath !== null) {
        const parentPath = data.parentPath || '';
        html += `
            <div class="item directory" data-path="${parentPath}">
                <div class="icon">📁</div>
                <div class="name">..</div>
                <div class="type">Parent Directory</div>
            </div>
        `;
    }
    
    // Directories
    data.directories.forEach(dir => {
        html += `
            <div class="item directory" data-path="${dir.path}">
                <div class="icon">📁</div>
                <div class="name">${dir.name}</div>
                <div class="type">Directory</div>
            </div>
        `;
    });
    
    // Images
    data.images.forEach(image => {
        html += `
            <div class="item image" data-url="${image.url}" data-name="${image.name}">
                <div class="icon">
                    <img src="${image.url}" alt="${image.name}" style="max-width: 100px; max-height: 100px; cursor: pointer;">
                </div>
                <div class="name" style="cursor: pointer;">${image.name}</div>
                <div class="type">Image</div>
            </div>
        `;
    });
    
    if (data.totalItems === 0) {
        html += '<div class="empty">This directory is empty</div>';
    }
    
    html += '</div>';
    container.innerHTML = html;
    
    // Add event listeners after DOM is updated
    addEventListeners();
}

function addEventListeners() {
    // Breadcrumb navigation
    document.querySelectorAll('.breadcrumb a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const path = e.target.getAttribute('data-path');
            loadDirectory(path);
        });
    });
    
    // Directory navigation
    document.querySelectorAll('.item.directory').forEach(item => {
        item.addEventListener('click', () => {
            const path = item.getAttribute('data-path');
            loadDirectory(path);
        });
    });
    
    // Image viewing
    document.querySelectorAll('.item.image').forEach(item => {
        item.addEventListener('click', () => {
            const url = item.getAttribute('data-url');
            const name = item.getAttribute('data-name');
            openImage(url, name);
        });
    });
}

function openImage(imageUrl, imageName) {
    const newWindow = window.open('', '_blank');
    newWindow.document.write(`
        <html>
            <head>
                <title>${imageName}</title>
                <style>
                    body { 
                        margin: 0; 
                        padding: 20px; 
                        background: #f0f0f0; 
                        display: flex; 
                        flex-direction: column; 
                        align-items: center; 
                    }
                    h1 { 
                        color: #333; 
                        margin-bottom: 20px; 
                    }
                    img { 
                        max-width: 90vw; 
                        max-height: 80vh; 
                        object-fit: contain; 
                        border: 1px solid #ddd; 
                        box-shadow: 0 4px 8px rgba(0,0,0,0.1); 
                    }
                </style>
            </head>
            <body>
                <h1>${imageName}</h1>
                <img src="${imageUrl}" alt="${imageName}">
            </body>
        </html>
    `);
}

// Initialize on page load
window.onload = () => {
    if (checkAuth()) {
        loadDirectory('');
    }
};