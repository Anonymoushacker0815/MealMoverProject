import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";


import { pool } from '../db.js';

const router = express.Router();
//TODO Put in enviroment.
const JWT_SECRET = "MealMover";

// Generate Token
const generateToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            user_type: user.user_type,
            location: user.location,
            loyalty_points: user.loyalty_points,
            status_id: user.status_id
        },
        JWT_SECRET,
        { expiresIn: "5h" }
    );
};


// ROUTE: Register
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

        const token = generateToken(newUser);

        res.json({
            success: true,
            message: "User registered successfully",
            data: newUser,
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
        const token = generateToken(user);

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

// Authenticate Token
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

// ROUTE: VERIFY USER
router.get("/verifyuser", authenticateToken, async (req, res) => {
    try {

        const query = "SELECT id, email, user_type, location, loyalty_points, status_id FROM users WHERE id = $1";
        const result = await pool.query(query, [req.user.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({
            success: true,
            user: result.rows[0]
        });

    } catch (err) {
        console.error("Auth Check Error:", err);
        res.status(500).json({ error: "Server Error" });
    }
});



export default router;