import express from "express";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";

const router = express.Router();
const JWT_SECRET = "MealMover";

// Auth bleibt GENAU gleich: Authorization: <token>
const authenticateToken = (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) return res.status(401).json({ error: "No Token." });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Token Found to be not valid ." });
    req.user = user;
    next();
  });
};

// Restaurant-ID für eingeloggten User holen
const getRestaurantIdForUser = async (userId) => {
  const r = await pool.query("SELECT id FROM restaurants WHERE user_id = $1", [userId]);
  return r.rows.length ? r.rows[0].id : null;
};

// GET: Analytics fürs eigene Restaurant (mit month switch + 0-days)
router.get("/analytics", authenticateToken, async (req, res) => {
  try {
    const restaurantId = await getRestaurantIdForUser(req.user.id);
    if (!restaurantId) return res.status(404).json({ error: "Restaurant not found for this user." });

    const now = new Date();
    const year = Number.parseInt(req.query.year) || now.getFullYear();
    const month = Number.parseInt(req.query.month) || (now.getMonth() + 1); // 1..12

    // Order Counts (Tag/Woche/Monat)
    const countsQ = `
      SELECT
        (SELECT COUNT(*) FROM orders WHERE restaurant_id = $1 AND order_time >= NOW() - INTERVAL '1 day')::int AS day,
        (SELECT COUNT(*) FROM orders WHERE restaurant_id = $1 AND order_time >= NOW() - INTERVAL '7 days')::int AS week,
        (SELECT COUNT(*) FROM orders WHERE restaurant_id = $1 AND order_time >= NOW() - INTERVAL '30 days')::int AS month
    `;
    const countsR = await pool.query(countsQ, [restaurantId]);

    // Monthly Overview (gewählter Monat) - inkl. 0 Tage
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

    // Popular Items
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

    // Reviews fürs Restaurant (Liste; Details holen wir extra über /owner/reviews/:id)
    const reviewsQ = `
      SELECT id, rating
      FROM reviews
      WHERE restaurant_id = $1
      ORDER BY id ASC;
    `;
    const reviewsR = await pool.query(reviewsQ, [restaurantId]);

    res.json({
      success: true,
      selected: { year, month },
      orderCounts: countsR.rows[0],
      monthly: monthlyR.rows,
      items: itemsR.rows,
      reviews: reviewsR.rows.map((r) => ({
        id: r.id,                 // <-- wichtig für View-Details
        orderId: `Review-${r.id}`, // Anzeige
        date: "",
        rating: r.rating,
      })),
    });
  } catch (err) {
    console.error("GET /owner/analytics error:", err);
    res.status(500).json({ error: "Server Error" });
  }
});

// GET: Review-Details fürs Modal
router.get("/reviews/:id", authenticateToken, async (req, res) => {
  try {
    const restaurantId = await getRestaurantIdForUser(req.user.id);
    if (!restaurantId) return res.status(404).json({ error: "Restaurant not found for this user." });

    const reviewId = Number.parseInt(req.params.id);
    if (!reviewId) return res.status(400).json({ error: "Invalid review id" });

    // Review nur erlauben, wenn sie zu diesem Restaurant gehört
    // Dish ist optional (LEFT JOIN), User-Email optional (JOIN users)
    const q = `
      SELECT
        r.id,
        r.rating,
        r.details,
        r.user_id,
        u.username,
        r.dish_id,
        d.name AS dish_name
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

export default router;
