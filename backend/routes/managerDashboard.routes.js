import express from "express";
import { pool } from "../db.js";

const router = express.Router();

//global income
router.get("/income", async (req, res) => {
    try{
        const query = `
        SELECT SUM(price)
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
router.get("/usercount", async (req, res) => {
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
router.get("/pendingRegistrations", async (req, res) => {
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
router.get("/orders", async (req, res) => {
    try {
        const query = `
        SELECT restaurant_id, COUNT(id) AS amount, SUM(price) AS income
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
router.get("/restaurants", async (req, res) => {
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

