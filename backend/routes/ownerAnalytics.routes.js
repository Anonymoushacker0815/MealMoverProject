// CORE DEPENDENCIES
import express from "express";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";
import { config } from "../config.js";

// ROUTER SETUP
// Erstellt Router-Instanz für alle Analytics-Endpunkte
const router = express.Router();

// JWT CONFIG
// JWT Secret wird aus zentraler Konfiguration geladen
const JWT_SECRET = config.JWT_SECRET;

// AUTHENTICATION MIDDLEWARE
// Prüft ob ein Token vorhanden ist und setzt den User in req.user
const authenticateToken = (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) return res.status(401).json({ error: "No Token." });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Token Found to be not valid ." });
    req.user = user;
    next();
  });
};


// RESTAURANT LOOKUP HELPER
// Holt die Restaurant-ID, die zum eingeloggten User gehört
const getRestaurantIdForUser = async (userId) => {
  const r = await pool.query("SELECT id FROM restaurants WHERE user_id = $1", [userId]);
  return r.rows.length ? r.rows[0].id : null;
};


// ANALYTICS OVERVIEW
// Liefert Order-Counts, Monatsübersicht, beliebte Gerichte und Reviews für das eigene Restaurant
router.get("/analytics", authenticateToken, async (req, res) => {
  try {
    const restaurantId = await getRestaurantIdForUser(req.user.id);
    if (!restaurantId) return res.status(404).json({ error: "Restaurant not found for this user." });

    const now = new Date();
    const year = Number.parseInt(req.query.year) || now.getFullYear();
    const month = Number.parseInt(req.query.month) || (now.getMonth() + 1);

    // ORDER COUNTS QUERY
    // Zählt Bestellungen der letzten 1, 7 und 30 Tage
    const countsQ = `
      SELECT
        (SELECT COUNT(*) FROM orders WHERE restaurant_id = $1 AND order_time >= NOW() - INTERVAL '1 day')::int AS day,
        (SELECT COUNT(*) FROM orders WHERE restaurant_id = $1 AND order_time >= NOW() - INTERVAL '7 days')::int AS week,
        (SELECT COUNT(*) FROM orders WHERE restaurant_id = $1 AND order_time >= NOW() - INTERVAL '30 days')::int AS month
    `;
    const countsR = await pool.query(countsQ, [restaurantId]);

    // MONTHLY OVERVIEW QUERY
    // Erstellt eine Tagesliste für den Monat und zählt Orders pro Tag
    const monthlyQ = `
      WITH days AS (
        SELECT generate_series(
          date_trunc('month', make_date($2, $3, 1)),
          date_trunc('month', make_date($2, $3, 1)) + interval '1 month' - interval '1 day',
          interval '1 day'
        )::date AS day
      )
      SELECT
        EXTRACT(DAY FROM d.day)::int AS day,
        COUNT(o.id)::int AS value
      FROM days d
      LEFT JOIN orders o
        ON DATE(o.order_time) = d.day
        AND o.restaurant_id = $1
      GROUP BY d.day
      ORDER BY d.day;
    `;
    const monthlyR = await pool.query(monthlyQ, [restaurantId, year, month]);

    // POPULAR ITEMS QUERY
    // Aggregiert verkaufte Mengen und Umsatz pro Gericht
    const itemsQ = `
      SELECT
        d.name AS name,
        SUM(od.ammount)::int AS sold,
        COALESCE(SUM(od.ammount * (d.price::numeric)), 0)::numeric(12,2) AS revenue
      FROM orders o
      JOIN o_dishes od ON od.order_id = o.id
      JOIN r_dishes d ON d.id = od.dish_id
      WHERE o.restaurant_id = $1
      GROUP BY d.name
      ORDER BY sold DESC;
    `;
    const itemsR = await pool.query(itemsQ, [restaurantId]);

    // REVIEWS LIST QUERY
    // Lädt alle Reviews des Restaurants für die Anzeige in einer Liste
    const reviewsQ = `
      SELECT id, rating, created_at
      FROM reviews
      WHERE restaurant_id = $1
      ORDER BY created_at DESC, id DESC;
    `;
    const reviewsR = await pool.query(reviewsQ, [restaurantId]);

    // RESPONSE MAPPING
    // Formatiert Daten für das Frontend inklusive vereinfachter Review-Darstellung
    res.json({
      success: true,
      selected: { year, month },
      orderCounts: countsR.rows[0],
      monthly: monthlyR.rows,
      items: itemsR.rows,
      reviews: reviewsR.rows.map((r) => ({
        id: r.id,
        orderId: `Review-${r.id}`,
        date: r.created_at ? new Date(r.created_at).toISOString().slice(0, 10) : "",
        rating: r.rating,
      })),
    });
  } catch (err) {
    console.error("GET /owner/analytics error:", err);
    res.status(500).json({ error: "Server Error" });
  }
});


// REVIEW DETAILS
// Liefert vollständige Review-Details für ein bestimmtes Review
router.get("/reviews/:id", authenticateToken, async (req, res) => {
  try {
    const restaurantId = await getRestaurantIdForUser(req.user.id);
    if (!restaurantId) return res.status(404).json({ error: "Restaurant not found for this user." });

    const reviewId = Number.parseInt(req.params.id);
    if (!reviewId) return res.status(400).json({ error: "Invalid review id" });

    // REVIEW DETAILS QUERY
    // Lädt Review-Daten inklusive Username und optionalem Dish-Namen
    const q = `
      SELECT
        r.id,
        r.rating,
        r.details,
        r.user_id,
        u.username,
        r.dish_id,
        d.name AS dish_name,
        r.created_at
      FROM reviews r
      JOIN users u ON u.id = r.user_id
      LEFT JOIN r_dishes d ON d.id = r.dish_id
      WHERE r.id = $1 AND r.restaurant_id = $2
      LIMIT 1;
    `;
    const result = await pool.query(q, [reviewId, restaurantId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Review not found" });
    }

    res.json({ success: true, review: result.rows[0] });
  } catch (err) {
    console.error("GET /owner/reviews/:id error:", err);
    res.status(500).json({ error: "Server Error" });
  }
});


// REVIEW REPORT
// Erstellt einen Report für ein Review, damit es später moderiert werden kann
router.post("/reviews/:id/report", authenticateToken, async (req, res) => {
  try {
    const restaurantId = await getRestaurantIdForUser(req.user.id);
    if (!restaurantId) return res.status(404).json({ error: "Restaurant not found for this user." });

    const reviewId = Number.parseInt(req.params.id);
    if (!reviewId) return res.status(400).json({ error: "Invalid review id" });

    const reason = String(req.body?.reason ?? "").trim();
    if (!reason) return res.status(400).json({ error: "Reason is required." });
    if (reason.length > 1000) return res.status(400).json({ error: "Reason too long (max 1000 chars)." });

    // REVIEW OWNERSHIP CHECK
    // Stellt sicher, dass das Review zu diesem Restaurant gehört
    const chk = await pool.query(
      "SELECT id FROM reviews WHERE id = $1 AND restaurant_id = $2 LIMIT 1",
      [reviewId, restaurantId]
    );
    if (chk.rows.length === 0) {
      return res.status(404).json({ error: "Review not found for this restaurant." });
    }

    // REPORT INSERT
    // Speichert den Report in review_reports mit dem Grund und dem meldenden User
    const ins = await pool.query(
      `
      INSERT INTO review_reports (review_id, restaurant_id, reported_by_user_id, reason)
      VALUES ($1, $2, $3, $4)
      RETURNING id, created_at;
      `,
      [reviewId, restaurantId, req.user.id, reason]
    );

    res.status(201).json({ success: true, report: ins.rows[0] });
  } catch (err) {
    if (err?.code === "23505") {
      return res.status(409).json({ error: "You already reported this review." });
    }
    console.error("POST /owner/reviews/:id/report error:", err);
    res.status(500).json({ error: "Server Error" });
  }
});


// ROUTER EXPORT
// Exportiert den Router für die Einbindung in server.js
export default router;
