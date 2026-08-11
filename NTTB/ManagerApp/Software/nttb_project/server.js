/**
 I used plenty of support from google searches and copilot suggestions but
 I used https://www.w3schools.com/nodejs/ and the official docs (https://nodejs.org/api/all.html)
 for most libraries as references.
server.js
 documented Express server for Rasp Pi 5
  - loads .env
  - Serves static public files
  - provides /health
  - provides simple /api/register and /api/login using bcrypt.js + jwt
  - uses a mariadb connection pool (prepared statements)
  - includes basic security middleware (helmet, cors, rate limiting)
  - provides error handling and logging
  - implements request validation and sanitization
*/

// Enviroment
require('dotenv').config();

// Core Dependencies
//const morgan = require('morgan');
//const cookieParser = require('cookie-parser');

const express = require('express'); // https://www.geeksforgeeks.org/node-js/express-js/  &&  https://www.w3schools.com/nodejs/nodejs_express.asp
const helmet = require('helmet'); // https://www.geeksforgeeks.org/node-js/node-js-securing-apps-with-helmet-js/
const cors = require('cors');  // https://www.geeksforgeeks.org/node-js/use-of-cors-in-node-js/
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs'); // https://www.geeksforgeeks.org/node-js/password-encryption-in-node-js-using-bcryptjs-module/
const jwt = require('jsonwebtoken'); // https://www.geeksforgeeks.org/node-js/how-to-use-json-web-tokens-with-node-js/
const path = require('path');
const mariadb = require('mariadb');
const { requireAuth } = require('./middleware/auth');

// configuration
const app = express();
const PORT = parseInt(process.env.PORT, 10) || 3000;

const REQUIRED_ENVS = ['DB_HOST', 'DB_USER', 'DB_PASS', 'DB_NAME', 'JWT_SECRET'];
const missing = REQUIRED_ENVS.filter(k => !process.env[k]);
if (missing.length) {
  console.error('Missing required env vars:', missing.join(', '));
  process.exit(1);
}

const JWT_SECRET = process.env.JWT_SECRET;

/* Options for future use update in .env as needed
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS, 10) || 10;
*/

// MariaDB connection pool
const pool = mariadb.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  connectionLimit: parseInt(process.env.DB_CONN_LIMIT, 10) || 5
});

async function withConnection(fn) {
  const conn = await pool.getConnection();
  try {
    return await fn(conn);
  } finally {
    try { conn.release(); } catch (e) {
      console.warn('DB release failed:', e.message);
    }
  }
}

// basic security and observability middleware
app.use(helmet());  // secure headers
//app.use(morgan('dev'));
app.use(cors({ origin: 'http://localhost:3000', credentials: true })); // restrict to frontend origin
app.use(express.json());
//app.use(cookieParser());

// rate limiter - pretect auth endpoints and general abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  limit: 2000, 		    // 100 request per window
  standardHeaders: 'draft-8',
  legacyHeaders: false,
});
app.use(limiter);

// server static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve USB images from mount point
app.use('/usb', express.static('/mnt/usb'));

// Routes
const tasksRouter = require('./routes/tasks');
const usersRouter = require('./routes/users');
const imagesRouter = require('./routes/images');
app.use('/api/tasks', tasksRouter);
app.use('/api/users', usersRouter);
app.use('/api/images', imagesRouter);


//BigInt serialization fix
BigInt.prototype.toJSON = function() { return this.toString(); };

// Health check
app.get('/health', async (req, res) => {
  try {
    await withConnection(async (conn) => { await conn.query('SELECT 1') });
    res.json({ ok: true, node: process.version, db: 'ok!', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ ok: false, node: process.version, db: 'error', error: error.message });
  }
});

// register
// POST /api/register
app.post('/api/register', async (req, res) => {
  let conn;
  try {
    const { user_name, email, password, phone } = req.body || {};
    console.log(phone);

    // Validation (do this before touching DB)
    if (!email || typeof email !== 'string' || !email.includes('@') || !email.includes('.')) {
      return res.status(400).json({ error: 'Invalid email' });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Invalid password, minimum 6 characters.' });
    }
    if (!user_name || typeof user_name !== 'string' || user_name.length < 3 || user_name.length > 50) {
      return res.status(400).json({ error: 'Invalid username' });
    }

    // Normalize phone (store digits only)
    const normalizedPhone = phone.replace(/-/g, '');

    conn = await pool.getConnection();
    await conn.beginTransaction();

    // Defensive check for existing email
    const existing = await conn.query('SELECT user_id FROM users WHERE email = ?', [email]);
    if (existing && existing.length) {
      await conn.rollback();
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    // Insert user
    const result = await conn.query(
      'INSERT INTO users (user_name, email, password, phone) VALUES (?, ?, ?, ?)',
      [user_name, email, hashed, normalizedPhone]
    );
    console.log(result);
    await conn.commit();

    // Most MariaDB/MySQL drivers return an object with insertId
    let insertedId = null;
    if (result && typeof result === 'object' && 'insertId' in result) {
      insertedId = result.insertId;
    } else if (typeof result === 'number') {
      insertedId = result;
    }

    const userId = insertedId != null ? String(insertedId) : null;
    return res.status(201).json({ success: true, userId });
  } catch (err) {
    try { if (conn) await conn.rollback(); } catch (e) { /* ignore */ }
    if (err && (err.code === 'ER_DUP_ENTRY' || err.code === 'ER_DUP_ENTRY_LOCAL')) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    console.error('Registration failed:', err && (err.message || err));
    return res.status(500).json({ error: 'Registration failed. Please try again.' });
  } finally {
    try { if (conn) conn.release(); } catch (e) { /* ignore release errors */ }
  }
});

// login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  try {
    const user = await withConnection(async (conn) => {
      const rows = await conn.query('SELECT user_id, email, password, rank FROM users WHERE email = ?', [email]);
      return rows && rows.length ? rows[0] : null;
    });
    console.log('user info:\n', user);
    if (!user) return res.status(401).json({ error: 'Invalid Credentials' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'invalid credentials' });
    const payload = { sub: user.user_id, email: user.email, rank: user.rank };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
    // const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN }); // to replace above linewhen JWT_EXPIRES_IN env is implemented
    return res.json({ token, user: { id: user.user_id, email: user.email, rank: user.rank } });
  } catch (err) {
    console.error('Login error:', err && (err.message || err));
    return res.status(500).json({ error: 'Login failed' });
  }
});

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'missing token' });
  const token = auth.slice(7);
  try {
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ error: 'invalid token' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'invalid token' });
  }
}



app.post('/api/logout', (req, res) => res.json({ message: 'Logged out' }));

app.get('/api/me', requireAuth, async (req, res) => {
  console.log('auth payload on /api/me', req.user);
  const user = await withConnection(conn =>
    conn.query('SELECT user_id, email, rank FROM users WHERE user_id = ?', [req.user.sub])
  );
  if (!user || !user.length) return res.status(401).json({ error: 'User Not found' });
  const u = user[0];
  res.json({ ok: true, user: { id: u.user_id, email: u.email, rank: u.rank } });
});

// global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err && (err.message || err));
  res.status(500).json({ error: 'internal_server_error' });
});

// start server
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

// Graceful shutdown to close db pool
process.on('SIGINT', async () => {
  console.log('shutting down, closing DB pool');
  try { await pool.end(); } catch (e) {/* ignore */ }
  process.exit(0);
});


//getting a address of sender
app.get('/hadaday', async (req, res) => {
  //console.log(req.rawHeaders);
  console.log(req.rawHeaders[5], req.rawHeaders[7]);
  res.json({ ok: true, message: 'hadaday!' });
});