import express from "express";
import { pool } from "../db.js";

const router = express.Router();

//get settings
router.get("/settings", async (req, res) => {
    try{
        const query = `
        SELECT *
        FROM settings
        `;
        
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching settings: ", err);
        res.json(500).json({ error: "Server Error "});
    }
});

//update settings
router.put("/settings", async (req, res) => {
    try {
        const query = `
        UPDATE settings 
        SET delivery_distance = $1,
        discount = $2,
        service_fee = $3;
        `;
        const result = await pool.query(query);
        res.json({ ...result.rows[0]});
    } catch (err) {
        console.error("error updating settings: ", err);
        res.status(500).json({ error: "server Error" });
    }
});

//get discount codes
router.get("/discountCodes", async (req, res) => {
    try{
        const query = `
        SELECT *
        FROM discount_codes
        `;
        
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching discounts: ", err);
        res.json(500).json({ error: "Server Error "});
    }
});

//remove code
//router.put("/discounts/:id", authenticateToken, async (req, res) => {
router.put("/discountCodes/:id", async (req, res) => {
    try {
        if (req.user.user_type !== "Admin") {
        return res.status(403).json({ error: "Wrong Account" });
        }

        const id = req.params.get('id');
        const query = `
        DELETE FROM discount_codes
        WHERE code = ${id}
        `;
        const del = await pool.query(query);

        if (del.rowCount === 0) return res.status(404).json({ error: "Code not found" });

        res.sendStatus(204);
    } catch (err) {
        console.error("Error deleting discounts: ", err);
        res.json(500).json({ error: "Server Error "});
    }
});

export default router;