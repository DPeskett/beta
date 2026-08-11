// server.js
// Professional, production-minded Express server using MariaDB pool,
// JWT authentication, bcrypt password hashing, and a safe connection helper.
// No images, only code and comments.

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mariadb = require('mariadb');
const cors = require('cors');
const helmet = require('helmet'); // lightweight security headers
require('dotenv').config();
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// ----------------------------
// Configuration
// ----------------------------
const JWT_SECRET = process.env.JWT_SECRET || 'replace_this_with_a_strong_secret';
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'hackysack',
  database: process.env.DB_NAME || 'mockdb',
  connectionLimit: parseInt(process.env.DB_CONN_LIMIT, 10) || 5
};

// ----------------------------
// Middleware
// ----------------------------
app.use(express.json());        // parse JSON bodies
app.use(cors());                // enable CORS; configure origin in production
app.use(helmet());              // basic security headers
app.use(express.static('public')); // serve frontend from public/

// ----------------------------
// MariaDB pool
// ----------------------------
const pool = mariadb.createPool(DB_CONFIG);

// withConnection helper: acquires a connection, invokes user function, ensures release.
// This prevents leaked connections and centralizes lifecycle handling.
async function withConnection(fn) {
  const conn = await pool.getConnection();
  try {
    return await fn(conn);
  } finally {
    // always release connection back to pool
    conn.release();
  }
}

// ----------------------------
// Utility: sign JWT (keeps payload consistent)
// ----------------------------
function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

// ----------------------------
// Middleware: verify JWT token
// - attaches decoded token to req.user
// ----------------------------
function verifyToken(req, res, next) {
  const auth = req.headers['authorization'];
  if (!auth) return res.status(403).json({ error: 'No token provided' });

  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(400).json({ error: 'Malformed authorization header' });
  }

  const token = parts[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    console.error('Token verification failed:', err);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// ----------------------------
// Route: Register
// - first non-root user becomes admin
// - uses a single connection for multiple queries
// - hashes password before insert
// ----------------------------
app.post('/api/register', async (req, res) => {
  const { user_name, email, password, phone } = req.body;

  // Input validation
  if (!email || !email.includes('@')) return res.status(400).json({ error: 'Invalid email format' });
  if (!password || password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  if (!user_name || user_name.trim() === '') return res.status(400).json({ error: 'user_name is required' });

  try {
    const result = await withConnection(async (conn) => {
      // Determine rank for this new user
      const countRows = await conn.query("SELECT COUNT(*) AS count FROM users WHERE user_id > 1");
      const isFirstUser = (countRows[0] && countRows[0].count === 0);
      const rank = isFirstUser ? 'admin' : 'user';

      const hashed = await bcrypt.hash(password, 10);

      // Insert and return last insert id in one connection
      await conn.query(
        'INSERT INTO users (user_name, email, password, phone, rank) VALUES (?, ?, ?, ?, ?)',
        [user_name, email, hashed, phone || null, rank]
      );

      const idRows = await conn.query('SELECT LAST_INSERT_ID() AS id');
      const user_id = Number(idRows[0].id);

      return { user_id, rank };
    });

    return res.status(201).json({ message: 'User registered', user_id: result.user_id, rank: result.rank });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Registration failed' });
  }
});

// ----------------------------
// Route: Login
// - authenticates, issues JWT including rank
// ----------------------------
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const user = await withConnection(async (conn) => {
      const rows = await conn.query('SELECT * FROM users WHERE email = ?', [email]);
      return rows[0];
    });

    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken({ user_id: user.user_id, email: user.email, rank: user.rank });
    return res.json({ token, user_id: user.user_id, rank: user.rank });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Login failed' });
  }
});

// ----------------------------
// Route: Logout (stateless)
// - frontend clears token; endpoint provided for UX parity
// ----------------------------
app.post('/api/logout', (req, res) => {
  return res.json({ message: 'Logged out' });
});

// ----------------------------
// Route: Get profile (protected)
// ----------------------------
app.get('/api/profile', verifyToken, (req, res) => {
  return res.json({ user_id: req.user.user_id, email: req.user.email, rank: req.user.rank });
});

// ----------------------------
// Route: Update user (protected)
// - prevents modification of root admin (user_id = 0)
// - validates email if provided
// ----------------------------
app.put('/api/update-user/:id', verifyToken, async (req, res) => {
  const id = Number(req.params.id);
  const { user_name, email, phone } = req.body;

  if (isNaN(id)) return res.status(400).json({ error: 'Invalid user id' });
  if (id === 1) return res.status(403).json({ error: 'Cannot modify root admin' });
  if (email && !email.includes('@')) return res.status(400).json({ error: 'Invalid email format' });

  try {
    await withConnection(async (conn) => {
      await conn.query(
        'UPDATE users SET user_name = ?, email = ?, phone = ? WHERE user_id = ?',
        [user_name, email, phone, id]
      );
    });

    console.log(`User ${id} updated by ${req.user.email}`);
    return res.json({ message: 'User updated' });
  } catch (err) {
    console.error('Update user error:', err);
    return res.status(500).json({ error: 'Update failed' });
  }
});

// ----------------------------
// Route: Delete user (protected)
// - prevents deletion of root admin (user_id = 0)
// ----------------------------
app.delete('/api/delete-user/:id', verifyToken, async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid user id' });
  if (id === 1) return res.status(403).json({ error: 'Cannot delete root admin' });

  try {
    await withConnection(async (conn) => {
      await conn.query('DELETE FROM users WHERE user_id = ?', [id]);
    });

    console.log(`User ${id} deleted by ${req.user.email}`);
    return res.json({ message: 'User deleted' });
  } catch (err) {
    console.error('Delete user error:', err);
    return res.status(500).json({ error: 'Delete failed' });
  }
});

// ----------------------------
// Route: Update rank (protected)
// - prevents changing rank to/from 'root' and protects root record
// ----------------------------
app.put('/api/update-rank/:id', verifyToken, async (req, res) => {
  const id = Number(req.params.id);
  const { rank } = req.body;
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid user id' });
  if (!rank) return res.status(400).json({ error: 'Rank is required' });
  if (id === 1 || rank === 'root') return res.status(403).json({ error: 'Cannot modify root rank' });

  try {
    await withConnection(async (conn) => {
      await conn.query('UPDATE users SET rank = ? WHERE user_id = ?', [rank, id]);
    });

    console.log(`User ${id} rank updated to ${rank} by ${req.user.email}`);
    return res.json({ message: 'Rank updated' });
  } catch (err) {
    console.error('Update rank error:', err);
    return res.status(500).json({ error: 'Rank update failed' });
  }
});

// ----------------------------
// Route: Get all users (admin-only)
// - returns full user rows; consider pagination for large sets
// ----------------------------
app.get('/api/users', verifyToken, async (req, res) => {
  if (req.user.rank !== 'admin' && req.user.rank !== 'root') {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    const rows = await withConnection(async (conn) => {
      return await conn.query('SELECT user_id, user_name, email, phone, rank, created_at FROM users ORDER BY user_id ASC');
    });

    return res.json(rows);
  } catch (err) {
    console.error('Get users error:', err);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// ----------------------------
// Route: Get current user info (from token)
// ----------------------------
app.get('/api/me', verifyToken, (req, res) => {
  return res.json({ user_id: req.user.user_id, email: req.user.email, rank: req.user.rank });
});

// ----------------------------
// Serve index explicitly (optional; static already serves it)
// ----------------------------
app.get('/', (req, res) => {
  return res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ----------------------------
// Start server
// ----------------------------
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});