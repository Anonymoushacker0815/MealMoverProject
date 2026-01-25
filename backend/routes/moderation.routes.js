import express from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';
import { config } from '../config.js';

const router = express.Router();
const JWT_SECRET = config.JWT_SECRET;

const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ error: 'No Token.' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token Found to be not valid .' });
    req.user = user;
    next();
  });
};

const requireModerationRole = (req, res, next) => {
  const type = req.user?.user_type;
  if (type !== 'Admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};

/*
GET /moderation/thread-reports?status=open
Returns list of reports (default status=open)
*/
router.get('/thread-reports', authenticateToken, requireModerationRole, async (req, res) => {
  const status = String(req.query.status ?? 'open');

  try {
    const result = await pool.query(
      `
      SELECT
        r.*,
        t.title AS thread_title,
        t.author_name AS thread_author_name
      FROM moderation_thread_reports r
      JOIN threads t ON t.id = r.thread_id
      WHERE r.status = $1
      ORDER BY r.created_at DESC
      `,
      [status]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

/*
PATCH /moderation/thread-reports/:id
body: { status: 'reviewed'|'dismissed'|'actioned', resolution_note?: string }
*/
router.patch('/thread-reports/:id', authenticateToken, requireModerationRole, async (req, res) => {
  const reportId = req.params.id;
  const { status, resolution_note } = req.body ?? {};

  const allowed = new Set(['reviewed', 'dismissed', 'actioned']);
  if (!allowed.has(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const result = await pool.query(
      `
      UPDATE moderation_thread_reports
      SET
        status = $1,
        reviewed_at = NOW(),
        reviewed_by = $2,
        resolution_note = $3
      WHERE id = $4
      RETURNING *
      `,
      [status, req.user.id, resolution_note ?? null, reportId]
    );

    if (result.rowCount === 0) return res.sendStatus(404);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

/*
GET /moderation/users
List users + status name
*/
router.get('/users', authenticateToken, requireModerationRole, async (req, res) => {
  try {
    const q = `
      SELECT
        u.id,
        u.email,
        u.username,
        u.user_type,
        COALESCE(s.name, 'Unknown') AS status
      FROM users u
      LEFT JOIN u_status s ON s.id = u.status_id
      ORDER BY u.id ASC
    `;
    const result = await pool.query(q);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

/*
PATCH /moderation/users/:id/status
Body: { status: "Active" | "Suspended" | "Pending" }
*/
router.patch('/users/:id/status', authenticateToken, requireModerationRole, async (req, res) => {
  const userId = Number(req.params.id);
  const { status } = req.body;

  if (!userId || !status) {
    return res.status(400).json({ error: 'Missing user id or status.' });
  }

  const allowed = new Set(['Active', 'Suspended', 'Pending']);
  if (!allowed.has(status)) {
    return res.status(400).json({ error: 'Invalid status. Allowed: Active, Suspended, Pending.' });
  }

  try {
    const userRow = await pool.query(`SELECT user_type FROM users WHERE id = $1`, [userId]);
    if (userRow.rowCount === 0) return res.status(404).json({ error: 'User not found.' });
    if (userRow.rows[0].user_type === 'Admin') {
      return res.status(403).json({ error: 'Cannot change Admin status.' });
    }

    const s = await pool.query(`SELECT id FROM u_status WHERE name = $1`, [status]);
    if (s.rowCount === 0) return res.status(400).json({ error: 'Status not found in u_status.' });

    await pool.query(`UPDATE users SET status_id = $1 WHERE id = $2`, [s.rows[0].id, userId]);

    res.json({ ok: true, userId, status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update status.' });
  }
});


export default router;
