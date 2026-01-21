import express from "express";
import { pool } from '../db.js';

const router = express.Router();

// GET: All restaurants
router.get("/", async (req, res) => {
    try {
        const query = `
            SELECT
                r.id,
                r.name,
                r.delivery_zone,
                COUNT(rev.id) as review_count,
                COALESCE(AVG(rev.rating), 0)::numeric(10,1) as average_rating
            FROM restaurants r
                     LEFT JOIN reviews rev ON r.id = rev.restaurant_id
            GROUP BY r.id
            ORDER BY average_rating DESC
        `;

        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching restaurants:", err);
        res.status(500).json({ error: "Server error" });
    }
});



// GET: distinct categories
router.get("/categories", async (req, res) => {
    try {
        const query = `
            SELECT DISTINCT name 
            FROM categories 
            ORDER BY name ASC
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching categories:", err);
        res.status(500).json({ error: "Server error" });
    }
});

export default router;