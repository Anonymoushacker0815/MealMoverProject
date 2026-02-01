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
  if (type !== 'Admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};

//global income
router.get("/income", authenticateToken, requireModerationRole, async (req, res) => {
    try{
        const query = `
        SELECT SUM(price) AS amount
        FROM orders
        `;
        
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching income: ", err);
        res.json(500).json({ error: "Server Error "});
    }
});

//user count
router.get("/usercount", authenticateToken, requireModerationRole, async (req, res) => {
    try {
        const query = `
        SELECT s.name, COUNT(u.id) AS amount
        FROM u_status s 
        LEFT JOIN users u ON u.status_id = s.id
        GROUP BY s.name 
        `;

        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching user count: ", err);
        res.status(500).json({ error: "Server Error" });
    }
});

//pending registrations
router.get("/pendingRegistrations", authenticateToken, requireModerationRole, async (req, res) => {
    try { 
        const query = `
        SELECT r.name, r.email, r.phone
        FROM restaurants r
        LEFT JOIN r_status s ON r.status_id = s.id
        WHERE s.name = 'Pending'
        `;

        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching oending registrations: ", err);
        res.status(500).json({ error: "Server Error" });
    }
});

// order count per restaurant + income
router.get("/orders", authenticateToken, requireModerationRole, async (req, res) => {
    try {
        const query = `
        SELECT restaurant_id AS id, COUNT(id) AS amount, SUM(price) AS income
        FROM orders
        GROUP BY restaurant_id
        `;

        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching order counts: ", err);
        res.status(500).json({ error: "Server Error" });
    }
});

//all restaurants
router.get("/restaurants", authenticateToken, requireModerationRole, async (req, res) => {
    try {
        const query = `
        SELECT r.id, r.name, r.email, r.phone, delivery_zone, opening_hours, s.name
        FROM restaurants r
        LEFT JOIN r_status s ON r.status_id = s.id;
        `;

        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching restaurants: ", err);
        res.status(500).json({ error: "Server Error" });
    }
});

export default router;