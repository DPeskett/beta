// routes/db.js
// Shared database connection and transaction helpers using mariadb
const mariadb = require('mariadb');

const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  connectionLimit: parseInt(process.env.DB_CONN_LIMIT, 10) || 5,
  // optional sensible defaults you can tweak
  connectTimeout: 10000
});

/**
 * withConn(fn)
 * - Provides a connection to fn(conn) and always releases it.
 * - Does NOT start a transaction; use for reads and single-statement queries.
 * - Returns whatever fn returns or throws.
 */
async function withConn(fn) {
  const conn = await pool.getConnection();
  try {
    return await fn(conn);
  } finally {
    try { await conn.release(); } catch (e) { /* ignore release errors */ }
  }
}

/**
 * withTransaction(fn)
 * - Runs fn(conn) inside a transaction (begin/commit).
 * - On error, rolls back and rethrows the original error.
 * - Always releases the connection.
 * - Use for multi-step operations where atomicity is required.
 */
async function withTransaction(fn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    try { await conn.rollback(); } catch (rbErr) { console.error('DB rollback failed:', rbErr && rbErr.message); }
    throw err;
  } finally {
    try { await conn.release(); } catch (e) { /* ignore release errors */ }
  }
}

module.exports = { pool, withConn, withTransaction };