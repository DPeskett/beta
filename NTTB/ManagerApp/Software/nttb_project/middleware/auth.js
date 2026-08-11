// middleware/auth.js
/**
 * Lightweight auth middleware
 * - Verifies JWT from Authorization: Bearer <token>
 * - Normalizes req.user: { id, email, rank, sub }
 * - No DB calls here; keep it fast and compatible with existing routes
 *
 * Requires: process.env.JWT_SECRET
 * Exports: requireAuth
 */

const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('JWT_SECRET is required for auth middleware');
}

function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' });
  }

  const token = auth.slice(7);
  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // Normalize fields and coerce rank to Number when possible
  const sub = payload.sub || payload.id || null;
  const email = payload.email || null;
  const rawRank = payload.rank !== undefined ? payload.rank : payload.role || null;
  const rank = rawRank !== null ? Number(rawRank) : null;

  req.user = {
    id: sub,
    sub,
    email,
    rank: Number.isFinite(rank) ? rank : null,
    // keep original payload available for anything else
    _raw: payload
  };

  return next();
}

module.exports = { requireAuth };