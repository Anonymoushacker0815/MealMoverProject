import express from "express";
import { pool } from "../db.js";
import jwt from 'jsonwebtoken';
import { config } from "../config.js";

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
  if ( type !== 'Customer') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};

router.get("/loyalty/:id", authenticateToken, requireModerationRole, async (req,res) => {
    try {
        const {id} = req.params;
        const query = `
        SELECT id, email, username, loyalty_points 
        FROM users
        WHERE id = ${parseInt(id)}
        `;

        const result = await pool.query(query);
        res.json(result.rows);
    }
    catch (err) {
        console.error("Error fetching Loyalty Points: ", err);
        res.status(500).json({ error: "Server Error" });
    }
});

router.patch("/loyalty/:id", authenticateToken, requireModerationRole, async (req,res) => {
    try {
        const { loyalty_points } = req.body;
        const { id } = req.params;

        const query = `
            UPDATE users
            SET loyalty_points = ${loyalty_points}
            WHERE id = ${parseInt(id)}
        `;

        const result = await pool.query(query);
        res.json({ success: true});

    }
    catch (err) {
        console.error("Error updating loyalty points: ", err);
        res.status(500).json({ error: "Server Error" });
    }

});

export default router;