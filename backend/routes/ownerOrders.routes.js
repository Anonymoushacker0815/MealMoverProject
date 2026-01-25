import express from "express";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";
import { config } from "../config.js";

const JWT_SECRET = config.JWT_SECRET;

const router = express.Router();

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

// Restaurant-ID vom eingeloggten Restaurant-User holen
const getRestaurantIdForUser = async (userId) => {
  const r = await pool.query("SELECT id FROM restaurants WHERE user_id = $1", [userId]);
  return r.rows.length ? r.rows[0].id : null;
};

// Status-Mapping Frontend -> DB (o_status.name)
const mapUiStatusToDbStatusName = (uiStatus) => {
  // UI: new | preparing | ready | complete
  // DB: placed | preparing | delivering | completed
  switch (uiStatus) {
    case "new":
      return "placed";
    case "preparing":
      return "preparing";
    case "ready":
      return "delivering";
    case "complete":
      return "completed";
    default:
      return null;
  }
};

// Status-Mapping DB -> UI
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
    default:
      return "new";
  }
};

// Orders für Owner (Restaurant) laden (NUR HEUTIGE)
router.get("/owner/orders", authenticateToken, async (req, res) => {
  try {
    if (req.user.user_type !== "Restaurant" && req.user.user_type !== "Admin") {
      return res.status(403).json({ error: "Only Restaurant can view owner orders." });
    }

    const restaurantId = await getRestaurantIdForUser(req.user.id);
    if (!restaurantId) return res.status(404).json({ error: "Restaurant not found for this user." });

    // Orders + Customer + Status + Items (o_dishes -> r_dishes)
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

    // In UI-Format umwandeln
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

// Order-Status updaten (Start Preparing / Ready / Complete)
router.patch("/owner/orders/:orderId/status", authenticateToken, async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  try {
    if (req.user.user_type !== "Restaurant" && req.user.user_type !== "Admin") {
      return res.status(403).json({ error: "Only Restaurant can update orders." });
    }

    const restaurantId = await getRestaurantIdForUser(req.user.id);
    if (!restaurantId) return res.status(404).json({ error: "Restaurant not found for this user." });

    const dbStatusName = mapUiStatusToDbStatusName(status);
    if (!dbStatusName) return res.status(400).json({ error: "Invalid status." });

    // status_id für o_status.name holen
    const s = await pool.query("SELECT id FROM o_status WHERE name = $1", [dbStatusName]);
    if (s.rows.length === 0) return res.status(400).json({ error: "Status not found in DB." });

    const statusId = s.rows[0].id;

    // Update nur wenn Order zu diesem Restaurant gehört
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

    res.json({ success: true });
  } catch (err) {
    console.error("PATCH /owner/orders/:id/status error:", err);
    res.status(500).json({ error: "Update failed" });
  }
});

// Order ablehnen (löscht Order + Items)
router.delete("/owner/orders/:orderId", authenticateToken, async (req, res) => {
  const { orderId } = req.params;

  try {
    if (req.user.user_type !== "Restaurant" && req.user.user_type !== "Admin") {
      return res.status(403).json({ error: "Only Restaurant can reject orders." });
    }

    const restaurantId = await getRestaurantIdForUser(req.user.id);
    if (!restaurantId) return res.status(404).json({ error: "Restaurant not found for this user." });

    // Sicherstellen: Order gehört Restaurant
    const chk = await pool.query("SELECT id FROM orders WHERE id = $1 AND restaurant_id = $2", [
      Number(orderId),
      restaurantId,
    ]);
    if (chk.rows.length === 0) return res.status(404).json({ error: "Order not found for this restaurant." });

    await pool.query("BEGIN");
    await pool.query("DELETE FROM o_dishes WHERE order_id = $1", [Number(orderId)]);
    await pool.query("DELETE FROM orders WHERE id = $1 AND restaurant_id = $2", [Number(orderId), restaurantId]);
    await pool.query("COMMIT");

    res.json({ success: true });
  } catch (err) {
    await pool.query("ROLLBACK").catch(() => {});
    console.error("DELETE /owner/orders/:id error:", err);
    res.status(500).json({ error: "Reject failed" });
  }
});

export default router;
