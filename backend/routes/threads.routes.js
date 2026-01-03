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
    params.push(`%${search.toLowerCase()}%`);
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
 POST /api/threads/:id/like
*/
router.post('/:id/like', async (req, res) => {
  try {
    await pool.query(
      'UPDATE threads SET likes = likes + 1 WHERE id = $1',
      [req.params.id]
    );
    res.sendStatus(200);
  } catch (err) {
    res.status(500).json({ error: 'DB error' });
  }
});

/*
 POST /api/threads/:id/dislike
*/
router.post('/:id/dislike', async (req, res) => {
  try {
    await pool.query(
      'UPDATE threads SET dislikes = dislikes + 1 WHERE id = $1',
      [req.params.id]
    );
    res.sendStatus(200);
  } catch (err) {
    res.status(500).json({ error: 'DB error' });
  }
});

export default router;
