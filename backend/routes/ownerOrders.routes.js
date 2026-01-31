// CORE DEPENDENCIES
import express from "express";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";
import { config } from "../config.js";

// ROUTER & JWT CONFIG
// Initialisiert Router und lädt JWT Secret aus zentraler Konfiguration
const JWT_SECRET = config.JWT_SECRET;
const router = express.Router();


// AUTHENTICATION MIDDLEWARE
// Prüft Token aus dem Authorization Header und setzt req.user
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


// STATUS MAPPING UI -> DB
// Übersetzt Frontend Statuswerte in die passenden DB Status-Namen
const mapUiStatusToDbStatusName = (uiStatus) => {
  switch (uiStatus) {
    case "new":
      return "placed";
    case "preparing":
      return "preparing";
    case "ready":
      return "delivering";
    case "complete":
      return "completed";
    case "rejected":
      return "rejected";
    default:
      return null;
  }
};


// STATUS MAPPING DB -> UI
// Übersetzt DB Status-Namen in die passenden Frontend Statuswerte
const mapDbStatusToUiStatus = (dbStatus) => {
  switch (dbStatus) {
    case "placed":
      return "new";
    case "preparing":
      return "preparing";
    case "delivering":
      return "ready";
    case "completed":
      return "complete";
    case "rejected":
      return "rejected";
    default:
      return "new";
  }
};


// OWNER ORDERS READ
// Lädt alle Bestellungen des Restaurants für den aktuellen Tag inklusive Items
router.get("/owner/orders", authenticateToken, async (req, res) => {
  try {
    if (req.user.user_type !== "Restaurant" && req.user.user_type !== "Admin") {
      return res.status(403).json({ error: "Only Restaurant can view owner orders." });
    }

    const restaurantId = await getRestaurantIdForUser(req.user.id);
    if (!restaurantId) {
      return res.status(404).json({ error: "Restaurant not found for this user." });
    }

    const q = `
      SELECT
        o.id AS order_id,
        o.order_time,
        os.name AS status_name,
        u.username AS customer_username,
        u.email AS customer_email,
        u.location AS customer_location,
        COALESCE(
          json_agg(
            json_build_object(
              'name', d.name,
              'quantity', od.ammount
            )
          ) FILTER (WHERE d.id IS NOT NULL),
          '[]'::json
        ) AS items
      FROM orders o
      JOIN o_status os ON os.id = o.status_id
      JOIN users u ON u.id = o.customer_id
      LEFT JOIN o_dishes od ON od.order_id = o.id
      LEFT JOIN r_dishes d ON d.id = od.dish_id
      WHERE o.restaurant_id = $1
        AND o.order_time >= CURRENT_DATE
        AND o.order_time < CURRENT_DATE + INTERVAL '1 day'
      GROUP BY o.id, os.name, u.username, u.email, u.location
      ORDER BY o.order_time ASC, o.id ASC;
    `;

    const r = await pool.query(q, [restaurantId]);

    const orders = r.rows.map((row) => {
      const displayId = `ORDER-${String(row.order_id).padStart(4, "0")}`;
      const uiStatus = mapDbStatusToUiStatus(row.status_name);

      let address = "";
      const loc = row.customer_location;
      if (loc?.coordinates?.length === 2) {
        address = `${loc.coordinates[1]}, ${loc.coordinates[0]}`;
      }

      return {
        _id: row.order_id,
        id: displayId,
        customerName: row.customer_username || row.customer_email,
        address,
        location: row.customer_location,
        status: uiStatus,
        items: row.items,
      };
    });

    res.json({ success: true, orders });
  } catch (err) {
    console.error("GET /owner/orders error:", err);
    res.status(500).json({ error: "Server Error" });
  }
});


// OWNER ORDER STATUS UPDATE
// Aktualisiert den Status einer Bestellung anhand des UI-Statuswertes
router.patch("/owner/orders/:orderId/status", authenticateToken, async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  try {
    if (req.user.user_type !== "Restaurant" && req.user.user_type !== "Admin") {
      return res.status(403).json({ error: "Only Restaurant can update orders." });
    }

    const restaurantId = await getRestaurantIdForUser(req.user.id);
    if (!restaurantId) {
      return res.status(404).json({ error: "Restaurant not found for this user." });
    }

    const dbStatusName = mapUiStatusToDbStatusName(status);
    if (!dbStatusName) return res.status(400).json({ error: "Invalid status." });

    const s = await pool.query("SELECT id FROM o_status WHERE name = $1", [dbStatusName]);
    if (s.rows.length === 0) {
      return res.status(400).json({ error: "Status not found in DB." });
    }

    const statusId = s.rows[0].id;

    const upd = await pool.query(
      `
      UPDATE orders
      SET status_id = $1
      WHERE id = $2 AND restaurant_id = $3
      RETURNING id;
      `,
      [statusId, Number(orderId), restaurantId]
    );

    if (upd.rows.length === 0) {
      return res.status(404).json({ error: "Order not found for this restaurant." });
    }

    // broadcast status update to both customer + restaurant
    const io = req.app.get("io");
    if (io) {
      io.to(`order:${Number(orderId)}`).emit("order:status", {
        orderId: Number(orderId),
        status, 
        updatedAt: new Date().toISOString(),
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("PATCH /owner/orders/:id/status error:", err);
    res.status(500).json({ error: "Update failed" });
  }
});


// OWNER ORDER REJECT
// Setzt eine Bestellung auf rejected statt sie zu löschen
router.delete("/owner/orders/:orderId", authenticateToken, async (req, res) => {
  const { orderId } = req.params;

  try {
    if (req.user.user_type !== "Restaurant" && req.user.user_type !== "Admin") {
      return res.status(403).json({ error: "Only Restaurant can reject orders." });
    }

    const restaurantId = await getRestaurantIdForUser(req.user.id);
    if (!restaurantId) {
      return res.status(404).json({ error: "Restaurant not found for this user." });
    }

    const s = await pool.query("SELECT id FROM o_status WHERE name = 'rejected' LIMIT 1");
    if (s.rows.length === 0) {
      return res.status(400).json({ error: "Rejected status not found in DB." });
    }

    const rejectedStatusId = s.rows[0].id;

    const upd = await pool.query(
      `
      UPDATE orders
      SET status_id = $1
      WHERE id = $2 AND restaurant_id = $3
      RETURNING id;
      `,
      [rejectedStatusId, Number(orderId), restaurantId]
    );

    if (upd.rows.length === 0) {
      return res.status(404).json({ error: "Order not found for this restaurant." });
    }

    res.json({ success: true, rejected: true });
  } catch (err) {
    console.error("DELETE (REJECT) /owner/orders/:id error:", err);
    res.status(500).json({ error: "Reject failed" });
  }
});


// ROUTER EXPORT
// Exportiert den Router für die Einbindung in server.js
export default router;
