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

export default router;
