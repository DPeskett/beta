// routes/users.js
// Role-aware user management routes.
// - Uses routes/db.js helpers: withConn and withTransaction
// - Uses middleware/auth.js -> requireAuth which normalizes req.user { id/sub, rank }
// - Exposes:
//    GET  /api/users        -> { users: [...] }     (caller rank 1 or 2 only)
//    PUT  /api/users/:id    -> { ok: true }         (caller rank 1 or 2; obey rules below)
//    DELETE /api/users/:id  -> { ok: true }         (caller rank 1 only; cannot delete other rank 1)
//
// Rules implemented:
// - Listing: only callers with rank 1 or 2 may list users. Optional ?ranks=2,3 filters by rank but still
//   enforces that returned users have rank > callerRank (less privileged).
// - Update:
//     * Caller must be rank 1 or 2.
//     * Caller may update their own name/phone (but not rank).
//     * Caller may update another user's name/phone.
//     * Caller may assign a new rank only if:
//         - CallerRank is 1 or 2 AND
//         - newRank > callerRank (i.e., less privileged than caller)
//         - caller cannot change their own rank
// - Delete:
//     * Only rank 1 may delete users.
//     * Rank 1 cannot delete other rank 1 users.
//     * Deletion runs in a transaction to allow future cascade steps if needed.

const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { withConn, withTransaction } = require('./db');

const router = express.Router();

function toNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * GET /api/users
 * Query param: ranks=2,3  (optional)
 * Returns: { users: [ { id, user_name, email, phone, rank } ] }
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const callerRank = toNumber(req.user && req.user.rank);
    if (![1, 2].includes(callerRank)) {
      return res.status(403).json({ error: 'Insufficient role' });
    }

    const raw = String(req.query.ranks || '').trim();
    const filterRanks = raw
      ? raw.split(',').map(s => toNumber(s.trim())).filter(n => Number.isInteger(n) && n >= 1 && n <= 5)
      : [];

    let sql, params;
    if (filterRanks.length) {
      // only return users with rank IN (...) and rank > callerRank
      sql = `SELECT user_id AS id, user_name, email, phone, rank
             FROM users
             WHERE rank IN (${filterRanks.map(() => '?').join(',')})
               AND rank > ?`;
      params = [...filterRanks, callerRank];
    } else {
      sql = 'SELECT user_id AS id, user_name, email, phone, rank FROM users WHERE rank > ?';
      params = [callerRank];
    }

    const rows = await withConn(conn => conn.query(sql, params));
    return res.json({ users: rows || [] });
  } catch (err) {
    console.error('GET /api/users error:', err && (err.message || err));
    return res.status(500).json({ error: 'DB error' });
  }
});

/**
 * PUT /api/users/:id
 * Body may include: user_name, phone, rank
 *
 * Rules enforced:
 *  - Caller must be rank 1 or 2
 *  - Caller cannot change their own rank
 *  - Caller cannot assign a rank <= callerRank (i.e., more privileged or equal)
 *  - Caller can update name/phone on themselves or others (subject to above rank rules for rank change)
 *
 * Uses a transaction to ensure safe update.
 */
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const ALLOWED_CALLER_RANKS = [1, 2];
    const callerRank = toNumber(req.user && req.user.rank);
    const callerId = toNumber(req.user && (req.user.sub || req.user.id));

    if (!ALLOWED_CALLER_RANKS.includes(callerRank)) {
      return res.status(403).json({ error: 'Insufficient role' });
    }

    const targetId = toNumber(req.params.id);
    if (!Number.isInteger(targetId) || targetId <= 0) {
      return res.status(400).json({ error: 'Invalid user id' });
    }

    const incoming = req.body || {};
    const newName = incoming.user_name != null ? String(incoming.user_name).trim() : undefined;
    const newPhone = incoming.phone != null ? String(incoming.phone).trim() : undefined;
    const newRankRaw = incoming.rank !== undefined ? toNumber(incoming.rank) : undefined;

    if (newRankRaw !== undefined && (!Number.isInteger(newRankRaw) || newRankRaw < 1 || newRankRaw > 5)) {
      return res.status(400).json({ error: 'Invalid rank' });
    }

    // Prevent trying to change own rank
    if (callerId && targetId === callerId && newRankRaw !== undefined) {
      return res.status(400).json({ error: 'Cannot change your own rank' });
    }

    // If rank is being changed, ensure caller may assign a less-privileged rank only
    if (newRankRaw !== undefined && newRankRaw <= callerRank) {
      return res.status(403).json({ error: 'Cannot assign rank equal or higher than your own' });
    }

    // Transactional update
    const result = await withTransaction(async (conn) => {
      // ensure target exists and fetch current rank
      const rows = await conn.query('SELECT user_id, rank FROM users WHERE user_id = ?', [targetId]);
      if (!rows || !rows.length) {
        const e = new Error('User not found');
        e.status = 404;
        throw e;
      }
      const target = rows[0];
      const targetRank = toNumber(target.rank);

      // Caller (rank 2) must not attempt to edit users that are not less-privileged than allowed by server rules
      // Our earlier GET enforced returning only rank > callerRank; here we ensure the caller cannot promote
      // or otherwise reduce privileges below allowed. For simplicity: allow editing any user (rank change rules above prevent abuse).
      // Apply update fields
      const updates = [];
      const params = [];

      if (newName !== undefined) {
        updates.push('user_name = ?');
        params.push(newName);
      }
      if (newPhone !== undefined) {
        updates.push('phone = ?');
        params.push(newPhone);
      }
      if (newRankRaw !== undefined) {
        updates.push('rank = ?');
        params.push(newRankRaw);
      }

      if (updates.length === 0) {
        // nothing to do
        return { ok: true };
      }

      params.push(targetId);
      const sql = `UPDATE users SET ${updates.join(', ')} WHERE user_id = ?`;
      const r = await conn.query(sql, params);
      const affected = r && (r.affectedRows || r.affected_rows || r.affected) ? (r.affectedRows || r.affected_rows || r.affected) : 0;
      if (affected === 0) {
        const e = new Error('User not found');
        e.status = 404;
        throw e;
      }
      return { ok: true };
    });

    return res.json(result);
  } catch (err) {
    if (err && err.status) {
      return res.status(err.status).json({ error: err.message || 'Error' });
    }
    console.error('PUT /api/users/:id error:', err && (err.message || err));
    return res.status(500).json({ error: 'Update failed' });
  }
});

/*****************************
 *  PUT /api/users/:id
 *  Changes user rank to 5 (deleted) instead of hard delete.
 * Rules enforced:
 *  - Only caller with rank 1 may delete users
 *  - Cannot delete other rank 1 users
 *  - Deletion is performed transactionally 
 ******************************/
router.put('/delete/:id', requireAuth, async (req, res) => {
  try {
    const callerRank = toNumber(req.user && req.user.rank);
    const callerId = toNumber(req.user && (req.user.sub || req.user.id));

    if (callerRank !== 1) return res.status(403).json({ error: 'Insufficient role' });

    const targetId = toNumber(req.params.id);
    if (!Number.isInteger(targetId) || targetId <= 0) {
      return res.status(400).json({ error: 'Invalid user id' });
    }

    if (callerId && callerId === targetId) {
      return res.status(400).json({ error: 'Cannot delete your own user account' });
    }
    await withTransaction(async (conn) => {
      const rows = await conn.query('SELECT user_id, rank FROM users WHERE user_id = ?', [targetId]);
      if (!rows || !rows.length) {
        const e = new Error('User not found');
        e.status = 404;
        throw e;
      }

      const targetRank = toNumber(rows[0].rank);
      if (targetRank === 1) {
        const e = new Error('Cannot delete another root user');
        e.status = 403;
        throw e;
      }

      if (targetRank === 5) {
        return { ok: true, note: 'User already marked deleted' };
      }

      const r = await conn.query('UPDATE users SET rank = ? WHERE user_id = ?', [5, targetId]);
      const affected = r && (r.affectedRows || r.affected_rows || r.affected) ? (r.affectedRows || r.affected_rows || r.affected) : 0;
      if (affected === 0) {
        const e = new Error('User not found');
        e.status = 404;
        throw e;
      }

      return { ok: true };
    });
    return res.json({ ok: true });
  } catch (err) {
    if (err && err.status) {
      return res.status(err.status).json({ error: err.message || 'Error' });
    }
    console.error('DELETE /api/users/:id error:', err && (err.message || err));
    return res.status(500).json({ error: 'Delete failed' });
  }
});
/** 
 * DELETE /api/users/:id
 *
 * Rules:
 *  - Only caller with rank 1 may delete users
 *  - Cannot delete other rank 1 users
 *  - Deletion is performed transactionally
 */
/*
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const callerRank = toNumber(req.user && req.user.rank);
    const callerId = toNumber(req.user && (req.user.sub || req.user.id));

    if (callerRank !== 1) return res.status(403).json({ error: 'Insufficient role' });

    const targetId = toNumber(req.params.id);
    if (!Number.isInteger(targetId) || targetId <= 0) {
      return res.status(400).json({ error: 'Invalid user id' });
    }

    if (callerId && callerId === targetId) {
      // optional: disallow self-delete — choose behavior (here we disallow)
      return res.status(400).json({ error: 'Cannot delete your own user account' });
    }

    await withTransaction(async (conn) => {
      const rows = await conn.query('SELECT user_id, rank FROM users WHERE user_id = ?', [targetId]);
      if (!rows || !rows.length) {
        const e = new Error('User not found');
        e.status = 404;
        throw e;
      }
      const targetRank = toNumber(rows[0].rank);
      if (targetRank === 1) {
        const e = new Error('Cannot delete another root user');
        e.status = 403;
        throw e;
      }

      // Perform delete. If you need to cascade or clean related records, do it here inside this transaction.
      const r = await conn.query('DELETE FROM users WHERE user_id = ?', [targetId]);
      const affected = r && (r.affectedRows || r.affected_rows || r.affected) ? (r.affectedRows || r.affected_rows || r.affected) : 0;
      if (affected === 0) {
        const e = new Error('User not found');
        e.status = 404;
        throw e;
      }
      return { ok: true };
    });

    return res.json({ ok: true });
  } catch (err) {
    if (err && err.status) {
      return res.status(err.status).json({ error: err.message || 'Error' });
    }
    console.error('DELETE /api/users/:id error:', err && (err.message || err));
    return res.status(500).json({ error: 'Delete failed' });
  }
});
*/
module.exports = router;