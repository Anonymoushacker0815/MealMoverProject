import express from "express";
import { pool } from "../db.js";
import jwt from "jsonwebtoken";
import { config } from "../config.js";

const JWT_SECRET = config.JWT_SECRET;
const router = express.Router();

// Token Middleware
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

// Restaurant-ID zu eingeloggtem User
async function getRestaurantIdByUserId(userId) {
  const r = await pool.query("SELECT id FROM restaurants WHERE user_id = $1 LIMIT 1", [userId]);
  return r.rows.length ? r.rows[0].id : null;
}

// Money -> number helper
function moneyToNumber(m) {
  const s = String(m ?? "");
  const n = Number(s.replace(/[^\d.,-]/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

// GET /owner/menu
router.get("/menu", authenticateToken, async (req, res) => {
  try {
    if (req.user.user_type !== "Restaurant") {
      return res.status(403).json({ error: "Not a restaurant account" });
    }

    const restaurantId = await getRestaurantIdByUserId(req.user.id);
    if (!restaurantId) return res.json([]);

    const catsRes = await pool.query(
      "SELECT id, name, description FROM categories WHERE restaurant_id = $1 ORDER BY sort_index ASC, id ASC",
      [restaurantId]
    );

    // Dishes laden (nach sort_index)
    const dishesRes = await pool.query(
      "SELECT id, name, description, price, category_id FROM r_dishes WHERE restaurant_id = $1 ORDER BY sort_index ASC, id ASC",
      [restaurantId]
    );

    const cats = catsRes.rows.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      dishes: [],
    }));

    const byCatId = new Map(cats.map((c) => [c.id, c]));

    for (const d of dishesRes.rows) {
      const cat = byCatId.get(d.category_id);
      if (!cat) continue;

      cat.dishes.push({
        id: d.id,
        name: d.name,
        description: d.description,
        price: moneyToNumber(d.price),
      });
    }

    res.json(cats);
  } catch (err) {
    console.error("GET /owner/menu error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /owner/categories
router.post("/categories", authenticateToken, async (req, res) => {
  try {
    if (req.user.user_type !== "Restaurant") {
      return res.status(403).json({ error: "Not a restaurant account" });
    }

    const restaurantId = await getRestaurantIdByUserId(req.user.id);
    if (!restaurantId) return res.status(404).json({ error: "Restaurant not found" });

    const name = String(req.body.name || "").trim();
    const description = String(req.body.description || "").trim();
    if (!name) return res.status(400).json({ error: "Category name required" });

    const maxR = await pool.query(
      "SELECT COALESCE(MAX(sort_index), -1) AS max FROM categories WHERE restaurant_id = $1",
      [restaurantId]
    );
    const nextIndex = Number(maxR.rows[0].max) + 1;

    const result = await pool.query(
      `INSERT INTO categories (name, description, restaurant_id, sort_index)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, description`,
      [name, description, restaurantId, nextIndex]
    );

    res.status(201).json({ ...result.rows[0], dishes: [] });
  } catch (err) {
    console.error("POST /owner/categories error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /owner/categories/:id
router.delete("/categories/:id", authenticateToken, async (req, res) => {
  try {
    if (req.user.user_type !== "Restaurant") {
      return res.status(403).json({ error: "Not a restaurant account" });
    }

    const restaurantId = await getRestaurantIdByUserId(req.user.id);
    if (!restaurantId) return res.status(404).json({ error: "Restaurant not found" });

    const categoryId = Number(req.params.id);
    if (!Number.isFinite(categoryId)) return res.status(400).json({ error: "Invalid category id" });

    await pool.query("BEGIN");
    await pool.query("DELETE FROM r_dishes WHERE category_id = $1 AND restaurant_id = $2", [
      categoryId,
      restaurantId,
    ]);

    const del = await pool.query(
      "DELETE FROM categories WHERE id = $1 AND restaurant_id = $2 RETURNING id",
      [categoryId, restaurantId]
    );

    await pool.query("COMMIT");

    if (del.rowCount === 0) return res.status(404).json({ error: "Category not found" });

    res.sendStatus(204);
  } catch (err) {
    await pool.query("ROLLBACK").catch(() => {});
    console.error("DELETE /owner/categories/:id error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /owner/dishes
router.post("/dishes", authenticateToken, async (req, res) => {
  try {
    if (req.user.user_type !== "Restaurant") {
      return res.status(403).json({ error: "Not a restaurant account" });
    }

    const restaurantId = await getRestaurantIdByUserId(req.user.id);
    if (!restaurantId) return res.status(404).json({ error: "Restaurant not found" });

    const categoryId = Number(req.body.categoryId);
    const name = String(req.body.name || "").trim();
    const description = String(req.body.description || "").trim();
    const price = Number(req.body.price);

    if (!Number.isFinite(categoryId)) return res.status(400).json({ error: "Invalid categoryId" });
    if (!name) return res.status(400).json({ error: "Dish name required" });
    if (!description) return res.status(400).json({ error: "Dish description required" });
    if (!Number.isFinite(price)) return res.status(400).json({ error: "Invalid price" });

    // check category belongs to restaurant
    const catCheck = await pool.query(
      "SELECT id FROM categories WHERE id = $1 AND restaurant_id = $2",
      [categoryId, restaurantId]
    );
    if (catCheck.rowCount === 0) return res.status(404).json({ error: "Category not found" });

    // dish ans Ende in dieser category
    const maxR = await pool.query(
      "SELECT COALESCE(MAX(sort_index), -1) AS max FROM r_dishes WHERE restaurant_id = $1 AND category_id = $2",
      [restaurantId, categoryId]
    );
    const nextIndex = Number(maxR.rows[0].max) + 1;

    const ins = await pool.query(
      `INSERT INTO r_dishes (name, description, price, restaurant_id, category_id, sort_index)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, description, price, category_id`,
      [name, description, price, restaurantId, categoryId, nextIndex]
    );

    const d = ins.rows[0];

    res.status(201).json({
      id: d.id,
      name: d.name,
      description: d.description,
      price: moneyToNumber(d.price),
      category_id: d.category_id,
    });
  } catch (err) {
    console.error("POST /owner/dishes error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /owner/dishes/:id
router.delete("/dishes/:id", authenticateToken, async (req, res) => {
  try {
    if (req.user.user_type !== "Restaurant") {
      return res.status(403).json({ error: "Not a restaurant account" });
    }

    const restaurantId = await getRestaurantIdByUserId(req.user.id);
    if (!restaurantId) return res.status(404).json({ error: "Restaurant not found" });

    const dishId = Number(req.params.id);
    if (!Number.isFinite(dishId)) return res.status(400).json({ error: "Invalid dish id" });

    const del = await pool.query(
      "DELETE FROM r_dishes WHERE id = $1 AND restaurant_id = $2 RETURNING id",
      [dishId, restaurantId]
    );

    if (del.rowCount === 0) return res.status(404).json({ error: "Dish not found" });

    res.sendStatus(204);
  } catch (err) {
    console.error("DELETE /owner/dishes/:id error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PATCH /owner/categories/reorder
router.patch("/categories/reorder", authenticateToken, async (req, res) => {
  try {
    if (req.user.user_type !== "Restaurant") {
      return res.status(403).json({ error: "Not a restaurant account" });
    }

    const restaurantId = await getRestaurantIdByUserId(req.user.id);
    if (!restaurantId) return res.status(404).json({ error: "Restaurant not found" });

    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return res.status(400).json({ error: "orderedIds must be a non-empty array" });
    }

    await pool.query("BEGIN");
    for (let i = 0; i < orderedIds.length; i++) {
      const id = Number(orderedIds[i]);
      await pool.query(
        "UPDATE categories SET sort_index = $1 WHERE id = $2 AND restaurant_id = $3",
        [i, id, restaurantId]
      );
    }
    await pool.query("COMMIT");

    res.json({ success: true });
  } catch (err) {
    await pool.query("ROLLBACK").catch(() => {});
    console.error("PATCH /owner/categories/reorder error:", err);
    res.status(500).json({ error: "Reorder failed" });
  }
});

// PATCH /owner/categories/:categoryId/dishes/reorder
router.patch("/categories/:categoryId/dishes/reorder", authenticateToken, async (req, res) => {
  try {
    if (req.user.user_type !== "Restaurant") {
      return res.status(403).json({ error: "Not a restaurant account" });
    }

    const restaurantId = await getRestaurantIdByUserId(req.user.id);
    if (!restaurantId) return res.status(404).json({ error: "Restaurant not found" });

    const categoryId = Number(req.params.categoryId);
    const { orderedDishIds } = req.body;

    if (!Number.isFinite(categoryId)) return res.status(400).json({ error: "Invalid categoryId" });
    if (!Array.isArray(orderedDishIds) || orderedDishIds.length === 0) {
      return res.status(400).json({ error: "orderedDishIds must be a non-empty array" });
    }

    const catCheck = await pool.query(
      "SELECT id FROM categories WHERE id = $1 AND restaurant_id = $2",
      [categoryId, restaurantId]
    );
    if (catCheck.rowCount === 0) return res.status(404).json({ error: "Category not found" });

    await pool.query("BEGIN");
    for (let i = 0; i < orderedDishIds.length; i++) {
      const dishId = Number(orderedDishIds[i]);
      await pool.query(
        "UPDATE r_dishes SET sort_index = $1 WHERE id = $2 AND restaurant_id = $3 AND category_id = $4",
        [i, dishId, restaurantId, categoryId]
      );
    }
    await pool.query("COMMIT");

    res.json({ success: true });
  } catch (err) {
    await pool.query("ROLLBACK").catch(() => {});
    console.error("PATCH /owner/categories/:categoryId/dishes/reorder error:", err);
    res.status(500).json({ error: "Reorder failed" });
  }
});

export default router;
