import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

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

  if (sort === 'likes') {
    query += ' ORDER BY likes DESC';
  } else if (sort === 'dislikes') {
    query += ' ORDER BY dislikes DESC';
  } else {
    query += ' ORDER BY created_at DESC';
  }

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
router.post('/', async (req, res) => {
  const { title, content, author_name } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'title and content are required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO threads (title, content, author_name, likes, dislikes, views, created_at, updated_at)
       VALUES ($1, $2, $3, 0, 0, 0, NOW(), NOW())
       RETURNING *`,
      [title, content, author_name ?? 'Anonymous']
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
router.post('/:id/like', async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE threads SET likes = likes + 1, updated_at = NOW() WHERE id = $1 RETURNING *',
      [req.params.id]
    );

    if (result.rowCount === 0) return res.sendStatus(404);
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'DB error' });
  }
});

/*
 POST /api/threads/:id/dislike
*/
router.post('/:id/dislike', async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE threads SET dislikes = dislikes + 1, updated_at = NOW() WHERE id = $1 RETURNING *',
      [req.params.id]
    );

    if (result.rowCount === 0) return res.sendStatus(404);
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'DB error' });
  }
});

export default router;
