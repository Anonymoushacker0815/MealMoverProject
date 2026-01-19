import express from "express";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";

const router = express.Router();
const JWT_SECRET = "MealMover";

// Middleware: Bearer Token akzeptieren
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;

  if (!token) return res.status(401).json({ error: "No Token." });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Token not valid." });
    req.user = user;
    next();
  });
};

// helper: restaurant id vom eingeloggten user
async function getRestaurantIdByUserId(userId) {
  const r = await pool.query("SELECT id FROM restaurants WHERE user_id = $1 LIMIT 1", [userId]);
  return r.rows.length ? r.rows[0].id : null;
}

// default opening hours
const DEFAULT_OPENING_HOURS = {
  mon: { label: "Mon", closed: false, open: "09:00", close: "18:00" },
  tue: { label: "Tue", closed: false, open: "09:00", close: "18:00" },
  wed: { label: "Wed", closed: false, open: "09:00", close: "18:00" },
  thu: { label: "Thu", closed: false, open: "09:00", close: "18:00" },
  fri: { label: "Fri", closed: false, open: "09:00", close: "20:00" },
  sat: { label: "Sat", closed: false, open: "10:00", close: "20:00" },
  sun: { label: "Sun", closed: true, open: "00:00", close: "00:00" },
};

// GET /owner/profile
// returns restaurant profile for logged-in Restaurant user
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    if (req.user.user_type !== "Restaurant") {
      return res.status(403).json({ error: "Not a restaurant account" });
    }

    const restaurantId = await getRestaurantIdByUserId(req.user.id);
    if (!restaurantId) return res.status(404).json({ error: "Restaurant not found" });

    const result = await pool.query(
      `SELECT id, name, email, phone, delivery_zone, opening_hours
       FROM restaurants
       WHERE id = $1
       LIMIT 1`,
      [restaurantId]
    );

    const r = result.rows[0];

    res.json({
      id: r.id,
      name: r.name ?? "",
      email: r.email ?? "",
      phone: r.phone ?? "",
      delivery_zone: r.delivery_zone ?? "",
      opening_hours: r.opening_hours ?? DEFAULT_OPENING_HOURS,
    });
  } catch (err) {
    console.error("GET /owner/profile error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /owner/profile
// body: { name, email, phone, delivery_zone, opening_hours }
router.put("/profile", authenticateToken, async (req, res) => {
  try {
    if (req.user.user_type !== "Restaurant") {
      return res.status(403).json({ error: "Not a restaurant account" });
    }

    const restaurantId = await getRestaurantIdByUserId(req.user.id);
    if (!restaurantId) return res.status(404).json({ error: "Restaurant not found" });

    const name = String(req.body.name ?? "").trim();
    const email = String(req.body.email ?? "").trim();
    const phone = String(req.body.phone ?? "").trim();
    const deliveryZone = String(req.body.delivery_zone ?? "").trim();
    const openingHours = req.body.opening_hours ?? DEFAULT_OPENING_HOURS;

    if (!name) return res.status(400).json({ error: "Restaurant name required" });

    const upd = await pool.query(
      `UPDATE restaurants
       SET name = $1,
           email = $2,
           phone = $3,
           delivery_zone = $4,
           opening_hours = $5
       WHERE id = $6
       RETURNING id, name, email, phone, delivery_zone, opening_hours`,
      [name, email, phone, deliveryZone, openingHours, restaurantId]
    );

    res.json(upd.rows[0]);
  } catch (err) {
    console.error("PUT /owner/profile error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
