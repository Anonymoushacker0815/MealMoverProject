import express from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';
import { config } from "../config.js";

const JWT_SECRET = config.JWT_SECRET;
const router = express.Router();
router.use(express.json());


const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(401).json({ error: "No Token." });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Token Found to be not valid ." });
    }
    req.user = user;
    next();
  });
};

/*
 GET /api/threads
 GET /api/threads?search=&sort=
*/
router.get('/', async (req, res) => {
  const { search, sort } = req.query;

  let query = 'SELECT * FROM threads';
  const params = [];

  if (search) {
    params.push(`%${String(search).toLowerCase()}%`);
    query += ` WHERE LOWER(title) LIKE $${params.length}`;
  }

  query += ' ORDER BY created_at DESC';

  try {
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

/*
 POST /api/threads
 body: { title: string, content: string, author_name?: string }
*/
router.post('/', authenticateToken, async (req, res) => {
  const { title, content } = req.body;
  const author_name = `User#${req.user.id}`;

  if (!title || !content) {
    return res.status(400).json({ error: 'title and content are required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO threads (title, content, author_name, author_id, likes, dislikes, views, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 0, 0, 0, NOW(), NOW())
       RETURNING *`,
      [title, content, author_name, req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

/*
 POST /api/threads/:id/report
 body: { reason?: string }
*/
router.post('/:id/report', authenticateToken, async (req, res) => {
  const threadId = req.params.id;
  const reporterId = req.user.id;
  const rawReason = req.body?.reason;
  const reason =
    typeof rawReason === 'string' && rawReason.trim().length > 0
      ? rawReason.trim()
      : null;

  try {
    console.log('REPORT req.body =', req.body);
    const result = await pool.query(
      `INSERT INTO moderation_thread_reports (thread_id, reporter_id, reason, status, created_at)
       VALUES ($1, $2, $3, 'open', NOW())
       RETURNING *`,
      [threadId, reporterId, reason]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err?.code === '23505') {
      if (err?.constraint === 'uq_moderation_thread_reports_reporter_thread') {
        return res.status(409).json({ error: 'Already reported by this user' });
      }
      return res.status(409).json({ error: 'Duplicate report' });
    }
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

/*
 GET /api/threads/:id
*/
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM threads WHERE id = $1', [
      req.params.id,
    ]);

    if (result.rowCount === 0) {
      return res.sendStatus(404);
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

/*
 GET /api/threads/:id/replies
*/
router.get('/:id/replies', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM replies WHERE thread_id = $1 ORDER BY created_at DESC',
      [req.params.id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

/*
 POST /api/threads/:id/replies
 body: { content: string, author_name?: string }
*/
router.post('/:id/replies', authenticateToken, async (req, res) => {
  const { content } = req.body;
  const author_name = `User#${req.user.id}`;

  if (!content) {
    return res.status(400).json({ error: 'content is required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO replies (thread_id, content, author_name, author_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING *`,
      [req.params.id, content, author_name, req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

/*
 POST /api/threads/:id/like
*/
router.post('/:id/like', authenticateToken, async (req, res) => {
  const threadId = req.params.id;
  const userId = req.user.id;

  try {
    await pool.query('BEGIN');

    const existing = await pool.query(
      'SELECT vote_type FROM thread_votes WHERE user_id = $1 AND thread_id = $2 FOR UPDATE',
      [userId, threadId]
    );

    if (existing.rowCount === 0) {
      await pool.query(
        'INSERT INTO thread_votes (user_id, thread_id, vote_type) VALUES ($1, $2, $3)',
        [userId, threadId, 'like']
      );

      const updated = await pool.query(
        `UPDATE threads
         SET likes = likes + 1, updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [threadId]
      );

      await pool.query('COMMIT');
      if (updated.rowCount === 0) return res.sendStatus(404);
      return res.status(200).json(updated.rows[0]);
    }

    const prev = existing.rows[0].vote_type;

    if (prev === 'like') {
      const current = await pool.query('SELECT * FROM threads WHERE id = $1', [threadId]);
      await pool.query('COMMIT');
      if (current.rowCount === 0) return res.sendStatus(404);
      return res.status(200).json(current.rows[0]);
    }

    await pool.query(
      'UPDATE thread_votes SET vote_type = $1, updated_at = NOW() WHERE user_id = $2 AND thread_id = $3',
      ['like', userId, threadId]
    );

    const updated = await pool.query(
      `UPDATE threads
       SET likes = likes + 1,
           dislikes = GREATEST(dislikes - 1, 0),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [threadId]
    );

    await pool.query('COMMIT');
    if (updated.rowCount === 0) return res.sendStatus(404);
    return res.status(200).json(updated.rows[0]);
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});


/*
 POST /api/threads/:id/dislike
*/
router.post('/:id/dislike', authenticateToken, async (req, res) => {
  const threadId = req.params.id;
  const userId = req.user.id;

  try {
    await pool.query('BEGIN');

    const existing = await pool.query(
      'SELECT vote_type FROM thread_votes WHERE user_id = $1 AND thread_id = $2 FOR UPDATE',
      [userId, threadId]
    );

    if (existing.rowCount === 0) {
      await pool.query(
        'INSERT INTO thread_votes (user_id, thread_id, vote_type) VALUES ($1, $2, $3)',
        [userId, threadId, 'dislike']
      );

      const updated = await pool.query(
        `UPDATE threads
         SET dislikes = dislikes + 1, updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [threadId]
      );

      await pool.query('COMMIT');
      if (updated.rowCount === 0) return res.sendStatus(404);
      return res.status(200).json(updated.rows[0]);
    }

    const prev = existing.rows[0].vote_type;

    if (prev === 'dislike') {
      const current = await pool.query('SELECT * FROM threads WHERE id = $1', [threadId]);
      await pool.query('COMMIT');
      if (current.rowCount === 0) return res.sendStatus(404);
      return res.status(200).json(current.rows[0]);
    }

    await pool.query(
      'UPDATE thread_votes SET vote_type = $1, updated_at = NOW() WHERE user_id = $2 AND thread_id = $3',
      ['dislike', userId, threadId]
    );

    const updated = await pool.query(
      `UPDATE threads
       SET dislikes = dislikes + 1,
           likes = GREATEST(likes - 1, 0),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [threadId]
    );

    await pool.query('COMMIT');
    if (updated.rowCount === 0) return res.sendStatus(404);
    return res.status(200).json(updated.rows[0]);
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

export default router;
