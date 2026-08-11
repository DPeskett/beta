// routes/tasks.js
// Role-aware task routes using shared DB helpers in routes/db.js
const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { withConn, withTransaction } = require('./db');

const router = express.Router();

// Normalize caller info from req.user
function normalizeCaller(req) {
  return {
    callerRank: Number(req.user && req.user.rank),
    callerId: Number(req.user && (req.user.sub || req.user.id))
  };
}

/**
 * GET /
 * Return tasks with owner metadata so client can make UI decisions without extra calls.
 * Response: { tasks: [ { id, title, description, due_by, priority, progress, ownerId, ownerName, ownerRank, assigned_at } ] }
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const sql = `
      SELECT
        t.task_id AS id,
        t.task_title AS title,
        t.task_description AS description,
        t.due_by,
        t.priority,
        t.progress,
        t.assigned_by AS ownerId,
        u.user_name AS ownerName,
        u.rank AS ownerRank,
        t.assigned_at
      FROM tasks t
      LEFT JOIN users u ON u.user_id = t.assigned_by
      ORDER BY t.priority DESC, t.assigned_at DESC
    `;
    const rows = await withConn(conn => conn.query(sql));
    return res.json({ tasks: rows || [] });
  } catch (err) {
    console.error('GET /api/tasks error:', err && (err.message || err));
    return res.status(500).json({ error: 'DB error' });
  }
});

/**
 * POST /
 * Create a task. Allowed for callerRank <= 4 (ranks 1..4).
 * Uses a transaction to ensure atomic create and potential follow-on actions.
 * Request body: { title, description?, due_by?, priority? }
 * Response: 201 { task_id }
 */
router.post('/', requireAuth, async (req, res) => {
  const { callerRank, callerId } = normalizeCaller(req);
  if (!Number.isFinite(callerRank) || callerRank > 4) {
    return res.status(403).json({ error: 'Insufficient role' });
  }

  const title = req.body && req.body.title;
  if (!title || typeof title !== 'string') {
    return res.status(400).json({ error: 'title required' });
  }

  let due_by = req.body.due_by || null;
  if (new Date(due_by) < new Date()) {
    return res.status(400).json({ error: 'due date cannot be before now' });
  }
  due_by = due_by.replace('T', ' ');
  due_by = due_by.replace('Z', '');
  const description = req.body.description || null;
  const priority = Number.isFinite(Number(req.body.priority)) ? Number(req.body.priority) : 0;

  try {
    const result = await withTransaction(async (conn) => {
      const r = await conn.query(
        `INSERT INTO tasks (task_title, task_description, due_by, assigned_by, priority, assigned_at)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [title, description, due_by, callerId, priority]
      );
      // typical driver returns { insertId }
      const task_id = r && (r.insertId || r.insert_id || (typeof r === 'number' ? r : null));
      return { task_id };
    });

    return res.status(201).json(result);
  } catch (err) {
    console.error('POST /api/tasks error:', err && (err.message || err));
    return res.status(500).json({ error: 'Create failed' });
  }
});

/**
 * PUT /:id
 * Update a task. Permission rules:
 *  - rank 1 or 2: can update any task
 *  - rank 3: can update own tasks or tasks owned by rank 4
 *  - rank 4: can update only own tasks
 *
 * Accepts fields: title, description, progress, due_by, priority
 */
router.put('/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Invalid id' });

  const { callerRank, callerId } = normalizeCaller(req);

  try {
    await withTransaction(async (conn) => {
      const rows = await conn.query('SELECT * FROM tasks WHERE task_id = ?', [id]);
      if (!rows || !rows.length) throw { status: 404, message: 'Not found' };
      const task = rows[0];
      const ownerId = Number(task.assigned_by);

      // Permission check
      if (callerRank <= 2) {
        // allowed
      } else if (callerRank === 3) {
        // need owner's rank (checked inside same transaction)
        const ownerRows = await conn.query('SELECT rank FROM users WHERE user_id = ?', [ownerId]);
        const ownerRank = ownerRows && ownerRows[0] ? Number(ownerRows[0].rank) : null;
        if (!(ownerId === callerId || ownerRank === 4)) {
          throw { status: 403, message: 'Insufficient role' };
        }
      } else if (callerRank === 4) {
        if (ownerId !== callerId) throw { status: 403, message: 'Insufficient role' };
      } else {
        throw { status: 403, message: 'Insufficient role' };
      }

      // apply updates (fall back to existing values)
      const updatedTitle = req.body.title != null ? req.body.title : task.task_title;
      const updatedDesc = req.body.description != null ? req.body.description : task.task_description;
      const updatedProgress = req.body.progress != null ? req.body.progress : task.progress;
      const updatedDue = req.body.due_by != null ? req.body.due_by : task.due_by;
      const updatedPriority = req.body.priority != null ? Number(req.body.priority) : task.priority;

      await conn.query(
        `UPDATE tasks SET task_title = ?, task_description = ?, progress = ?, due_by = ?, priority = ? WHERE task_id = ?`,
        [updatedTitle, updatedDesc, updatedProgress, updatedDue, updatedPriority, id]
      );

      return true;
    });

    return res.json({ ok: true });
  } catch (err) {
    if (err && err.status) return res.status(err.status).json({ error: err.message || 'Error' });
    console.error('PUT /api/tasks/:id error:', err && (err.message || err));
    return res.status(500).json({ error: 'Update failed' });
  }
});

/**
 * DELETE /:id
 * Delete a task. Permission rules mirror update.
 */
router.delete('/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Invalid id' });

  const { callerRank, callerId } = normalizeCaller(req);

  try {
    await withTransaction(async (conn) => {
      const rows = await conn.query('SELECT * FROM tasks WHERE task_id = ?', [id]);
      if (!rows || !rows.length) throw { status: 404, message: 'Not found' };
      const task = rows[0];
      const ownerId = Number(task.assigned_by);

      if (callerRank <= 2) {
        // allowed
      } else if (callerRank === 3) {
        const ownerRows = await conn.query('SELECT rank FROM users WHERE user_id = ?', [ownerId]);
        const ownerRank = ownerRows && ownerRows[0] ? Number(ownerRows[0].rank) : null;
        if (!(ownerId === callerId || ownerRank === 4)) {
          throw { status: 403, message: 'Insufficient role' };
        }
      } else if (callerRank === 4) {
        if (ownerId !== callerId) throw { status: 403, message: 'Insufficient role' };
      } else {
        throw { status: 403, message: 'Insufficient role' };
      }

      await conn.query('DELETE FROM tasks WHERE task_id = ?', [id]);
      return true;
    });

    return res.json({ ok: true });
  } catch (err) {
    if (err && err.status) return res.status(err.status).json({ error: err.message || 'Error' });
    console.error('DELETE /api/tasks/:id error:', err && (err.message || err));
    return res.status(500).json({ error: 'Delete failed' });
  }
});

/*
 for getting all tasks data without any auth - for nodes
*/
router.get('/all', async (req, res) => {
  try {
    const tasks = await withConn(async (conn) => {
      return await conn.query('SELECT * FROM tasks  ORDER BY priority DESC');
    });
    res.json(tasks);
    console.log(tasks);
    //console.log(JSON.stringify(tasks))
  } catch (err) {
    console.error('Error fetching tasks:', err && (err.message || err));
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// GET /api/tasks/count
router.get('/count', async (req, res) => {
  try {
    const rows = await withConn(async (conn) => {
      // alias the aggregate to a simple name so driver variations don't matter
      const [resultRows] = await conn.query('SELECT COUNT(*) AS cnt FROM tasks');
      console.log('[DB_DEBUG] COUNT resultRows:', resultRows);
      return resultRows;
    });

    const cnt = Array.isArray(rows) && rows.length > 0 && rows[0].cnt !== undefined
      ? parseInt(rows[0].cnt, 10)
      : 0;

    res.json({ count: Number.isFinite(cnt) ? cnt : 0 });
  } catch (err) {
    console.error('Error fetching tasks count:', err && (err.message || err));
    res.status(500).json({ error: 'Failed to fetch tasks count' });
  }
});

// GET /api/tasks/count  -- diagnostic + robust
router.get('/count2', async (req, res) => {
  try {
    // Run the COUNT and also query the current database name so we can verify connection/schema.
    const result = await withConn(async (conn) => {
      // run two queries so we can inspect everything
      const [countRows] = await conn.query('SELECT COUNT(*) AS cnt FROM tasks');
      const [dbRows] = await conn.query('SELECT DATABASE() AS dbname');
      return { countRows, dbRows };
    });

    // Dump what we actually received (inspect keys / shapes)
    console.log('[COUNT_DEBUG] withConn returned:', JSON.stringify(result, null, 2));

    // Defensive extraction: handle several driver shapes
    const countRows = result && result.countRows;
    let rawRow = Array.isArray(countRows) && countRows.length > 0 ? countRows[0] : countRows;
    // rawRow might be { cnt: '5' } or { 'COUNT(*)': 5 } or [{ 'COUNT(*)': '5' }]
    let cnt = 0;
    if (rawRow) {
      if (rawRow.cnt !== undefined) cnt = parseInt(rawRow.cnt, 10);
      else if (rawRow.count !== undefined) cnt = parseInt(rawRow.count, 10);
      else {
        // try to pick the first numeric property
        for (const k of Object.keys(rawRow)) {
          const v = rawRow[k];
          if (v !== null && v !== undefined && !Number.isNaN(Number(v))) {
            cnt = parseInt(v, 10);
            break;
          }
        }
      }
    }

    // Also log the connected database
    const dbName = result && result.dbRows && Array.isArray(result.dbRows) && result.dbRows[0]
      ? result.dbRows[0].dbname
      : (result && result.dbRows && result.dbRows.dbname) || 'unknown';
    console.log('[COUNT_DEBUG] Connected DB:', dbName, 'Parsed count:', cnt);

    res.json({ count: Number.isFinite(cnt) ? cnt : 0 });
  } catch (err) {
    console.error('Error fetching tasks count:', err && (err.stack || err.message || err));
    res.status(500).json({ error: 'Failed to fetch tasks count' });
  }
});

// Get a batch of limited amount of tasks starting at a specific index
router.get('/batch/:limit/:index', async (req, res) => {
  const limit = parseInt(req.params.limit, 10);
  const index = parseInt(req.params.index, 10);
  try {
    const batchTasks = await withConn(async (conn) => {
      return await conn.query('SELECT * FROM tasks ORDER BY priority DESC LIMIT ? OFFSET ?', [limit, index]);
    });
    res.json(batchTasks);
    console.log(batchTasks);
  } catch (err) {
    console.error('Error fetching batch tasks:', err && (err.message || err));
    res.status(500).json({ error: 'Failed to fetch batch tasks' });
  }
});

module.exports = router;
