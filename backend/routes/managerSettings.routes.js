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

//get settings
router.get("/settings", authenticateToken, requireModerationRole, async (req, res) => {
    try{
        const query = `
        SELECT *
        FROM settings
        `;
        
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching settings: ", err);
        res.status(500).json({ error: "Server Error "});
    }
});

//update settings
router.patch("/settings", authenticateToken, requireModerationRole, async (req, res) => {
    const { delivery_distance, discount, service_fee } = req.body;
    console.log(req.body);
    try {
        const fields = [];
        const values = [];
        let i = 1; // für variablen im SQL statement

        if ( delivery_distance !== undefined && delivery_distance !== -1) {
            fields.push(`delivery_distance = $${i++}`);
            values.push(delivery_distance);
        }
        if(discount !== undefined && discount !== -1) {
            fields.push(`discount = $${i++}`);
            values.push(discount);
        }
        if(service_fee !== undefined && service_fee !== -1) {
            fields.push(`service_fee = $${i++}`);
            values.push(service_fee);
        }

        if(fields.length === 0 ) {
            return res.status(400).json({ error: "Fields already up-to-date"});
        }

        const query = `
        UPDATE settings 
        SET ${fields.join(", ")}
        WHERE id = 0
        RETURNING id, delivery_distance,  discount, service_fee
        `;
        console.log(fields);
        console.log(values);

        const result = await pool.query(query, values);
        res.json({ success: true, result});
    } catch (err) {
        console.error("error updating settings: ", err);
        res.status(500).json({ error: "server Error" });
    }
});

//get discount codes
router.get("/discountCodes", authenticateToken, requireModerationRole, async (req, res) => {
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

//update code
router.patch("/discountCodes/:id", authenticateToken, requireModerationRole, async (req, res) => {
    const { id, code, amount, percent } = req.body;
    console.log(req.body);
    try {
        const fields = [];
        const values = [];
        let i = 1; // für variablen im SQL statement
        if(code !== undefined && code !== "-1") {
            fields.push(`code = $${i++}`);
            values.push(code);
        }
        if(amount !== undefined && amount !== -1) {
            fields.push(`amount = $${i++}`);
            values.push(amount);
            
        }
        if(percent !== undefined && percent !== -1) {
            fields.push(`percent = $${i++}`);
            values.push(percent);
           
        }

        if(fields.length === 0 ) {
            return res.status(400).json({ error: "Fields already up-to-date"});
        }

        const query = `
        UPDATE discount_codes 
        SET ${fields.join(", ")}
        WHERE id = ${id}
        RETURNING id, code, amount,  percent
        `;
        console.log("fields: "+fields);
        console.log("values: " +values);

        const result = await pool.query(query, values);
        res.json({ success: true, result});
    } catch (err) {
        console.error("error updating settings: ", err);
        res.status(500).json({ error: "server Error" });
    }
});

//add code
router.post("/discountCodes", authenticateToken, requireModerationRole, async (req, res) => {
    const { code, percent, amount } = req.body;
    console.log(code +"; "+ percent + "; " + amount);
    try {
        const query = `
        INSERT INTO discount_codes (code, percent, amount) 
        VALUES ($1, $2, $3)
        RETURNING id, code, percent, amount
        `;

        const result = await pool.query(query, [code, percent, amount]);

        res.status(201).json({...result.rows[0]});
    }
    catch (err) {
        console.error("Couldn't create new discount code", err);
        res.status(500).json({error: "Server error"});
    }
});

//remove code
//router.put("/discounts/:id", authenticateToken, async (req, res) => {
router.delete("/discountCodes/:id", authenticateToken, requireModerationRole, async (req, res) => {
    try {

        const {id} = req.params;
        const query = `
        DELETE FROM discount_codes
        WHERE id = ${parseInt(id)}
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