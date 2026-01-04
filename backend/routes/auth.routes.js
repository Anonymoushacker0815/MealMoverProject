import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";


import { pool } from '../db.js';

const router = express.Router();
const JWT_SECRET = "MealMover";

// Register
router.post("/register", async (req, res) => {
    const { email, password, user_type } = req.body;

    const allowedTypes = ['Customer', 'Restaurant'];
    const typeToSave = allowedTypes.includes(user_type) ? user_type : 'Customer';


    //Password Hashing
    const hashRounds = 10;
    const hashedPassword = await bcrypt.hash(password, hashRounds);


    // temp local
    const defaultLocation = {
        type: "Point",
        coordinates: [-74.006, 40.7128]
    };

    // temp status
    const defaultStatus = 1;

    try {
        const query = `
      INSERT INTO users (email, password, location, user_type, status_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;

        const values = [email, hashedPassword, defaultLocation, typeToSave, defaultStatus];

        const result = await pool.query(query, values);
        const newUser = result.rows[0];

        delete result.rows[0].password;

        console.log("New User Created:", result.rows[0]);

        const token = jwt.sign(
            {
                id: newUser.id,
                email: newUser.email,
                type: newUser.user_type
            },
            JWT_SECRET,
            { expiresIn: "1h" }
        );


        res.json({
            success: true,
            message: "User registered successfully",
            data: result.rows[0],
            token: token
        });

    } catch (err) {
        console.error("Database Insert Error:", err);

        //  duplicate email error (Postgres Error 23505)
        if (err.code === '23505') {
            return res.status(409).json({ error: "Email already exists" });
        }

        res.status(500).json({ error: "Database insertion failed" });
    }
});


// ROUTE: LOGIN
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const query = "SELECT * FROM users WHERE email = $1";
        const result = await pool.query(query, [email]);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: "Invalid Email" });
        }

        const user = result.rows[0];

        // Compare password with encoded hash
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ error: "Invalid Password" });
        }

        // 3. Generate JSON Web Token
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                type: user.user_type
            },
            JWT_SECRET,
            { expiresIn: "5h" } // Token expires in 5 hours
        );

        //Dont store password
        delete user.password;

        res.json({
            success: true,
            message: "Login successful",
            token: token,
            user: user
        });

    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ error: "Server error during login" });
    }
});



export default router;