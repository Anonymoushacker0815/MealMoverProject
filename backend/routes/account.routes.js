// Express Router
import express from "express";

// Security & Auth
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Database
import { pool } from "../db.js";

const router = express.Router();

// JWT Secret
const JWT_SECRET = "MealMover";

// Token-Authentifizierung (Authorization: <token>)
const authenticateToken = (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) return res.status(401).json({ error: "No Token." });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Token Found to be not valid ." });
    req.user = user;
    next();
  });
};

// Account anzeigen (User aus DB laden)
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const q =
      "SELECT id, email, username, user_type, location, loyalty_points, status_id FROM users WHERE id = $1";
    const r = await pool.query(q, [req.user.id]);

    if (r.rows.length === 0)
      return res.status(404).json({ error: "User not found" });

    res.json({ success: true, user: r.rows[0] });
  } catch (err) {
    console.error("GET /me error:", err);
    res.status(500).json({ error: "Server Error" });
  }
});

// Profildaten ändern (email, username, location)
router.patch("/me", authenticateToken, async (req, res) => {
  const { email, username, location } = req.body;

  try {
    const fields = [];
    const values = [];
    let i = 1;

    if (email !== undefined) {
      fields.push(`email = $${i++}`);
      values.push(email);
    }
    if (username !== undefined) {
      fields.push(`username = $${i++}`);
      values.push(username);
    }
    if (location !== undefined) {
      fields.push(`location = $${i++}`);
      values.push(location);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    values.push(req.user.id);

    const q = `
      UPDATE users
      SET ${fields.join(", ")}
      WHERE id = $${i}
      RETURNING id, email, username, user_type, location, loyalty_points, status_id;
    `;

    const r = await pool.query(q, values);
    res.json({ success: true, user: r.rows[0] });
  } catch (err) {
    console.error("PATCH /me error:", err);
    if (err.code === "23505") {
      return res.status(409).json({ error: "Email or username already exists" });
    }
    res.status(500).json({ error: "Update failed" });
  }
});

// Passwort ändern
router.patch("/me/password", authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Missing currentPassword or newPassword" });
  }

  try {
    const r = await pool.query(
      "SELECT password FROM users WHERE id = $1",
      [req.user.id]
    );

    if (r.rows.length === 0)
      return res.status(404).json({ error: "User not found" });

    const ok = await bcrypt.compare(currentPassword, r.rows[0].password);
    if (!ok)
      return res.status(401).json({ error: "Current password is wrong" });

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query(
      "UPDATE users SET password = $1 WHERE id = $2",
      [hashed, req.user.id]
    );

    res.json({ success: true, message: "Password changed" });
  } catch (err) {
    console.error("PATCH /me/password error:", err);
    res.status(500).json({ error: "Password change failed" });
  }
});

// Export Router
export default router;
