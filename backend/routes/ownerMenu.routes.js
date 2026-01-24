import express from "express";
import { pool } from "../db.js";
import jwt from "jsonwebtoken";
import { config } from "../config.js";

const JWT_SECRET = config.JWT_SECRET;

const router = express.Router();

// Middleware
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

// helper: restaurant_id zu eingeloggtem user
async function getRestaurantIdByUserId(userId) {
  const r = await pool.query(
    "SELECT id FROM restaurants WHERE user_id = $1 LIMIT 1",
    [userId]
  );
  return r.rows.length ? r.rows[0].id : null;
}

// GET /owner/menu
// returns: [{id,name,dishes:[...]}, ...]
router.get("/menu", authenticateToken, async (req, res) => {
  try {
    // nur Restaurant user
    if (req.user.user_type !== "Restaurant") {
      return res.status(403).json({ error: "Not a restaurant account" });
    }

    const restaurantId = await getRestaurantIdByUserId(req.user.id);
    if (!restaurantId) {
      // Owner hat noch kein Restaurant in DB
      return res.json([]);
    }

    const catsRes = await pool.query(
      "SELECT id, name, description FROM categories WHERE restaurant_id = $1 ORDER BY id ASC",
      [restaurantId]
    );

    const dishesRes = await pool.query(
      "SELECT id, name, description, price, category_id FROM r_dishes WHERE restaurant_id = $1 ORDER BY id ASC",
      [restaurantId]
    );

    // category map
    const cats = catsRes.rows.map(c => ({
      id: c.id,
      name: c.name,
      description: c.description,
      dishes: []
    }));

    const byCatId = new Map(cats.map(c => [c.id, c]));

    for (const d of dishesRes.rows) {
      const cat = byCatId.get(d.category_id);
      if (!cat) continue;

      // price ist money -> kann string sein
      const priceNum = Number(String(d.price).replace(/[^\d.,-]/g, "").replace(",", "."));

      cat.dishes.push({
        id: d.id,
        name: d.name,
        description: d.description,
        price: Number.isFinite(priceNum) ? priceNum : 0,
        category_id: d.category_id
      });
    }

    res.json(cats);
  } catch (err) {
    console.error("GET /owner/menu error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /owner/categories
// body: { name, description }
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

    const result = await pool.query(
      `INSERT INTO categories (name, description, restaurant_id)
       VALUES ($1, $2, $3)
       RETURNING id, name, description`,
      [name, description, restaurantId]
    );

    res.status(201).json({ ...result.rows[0], dishes: [] });
  } catch (err) {
    console.error("POST /owner/categories error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /owner/categories/:id
// (löscht auch dishes in der category)
router.delete("/categories/:id", authenticateToken, async (req, res) => {
  try {
    if (req.user.user_type !== "Restaurant") {
      return res.status(403).json({ error: "Not a restaurant account" });
    }

    const restaurantId = await getRestaurantIdByUserId(req.user.id);
    if (!restaurantId) return res.status(404).json({ error: "Restaurant not found" });

    const categoryId = Number(req.params.id);
    if (!Number.isFinite(categoryId)) return res.status(400).json({ error: "Invalid category id" });

    // delete dishes first
    await pool.query(
      "DELETE FROM r_dishes WHERE category_id = $1 AND restaurant_id = $2",
      [categoryId, restaurantId]
    );

    const del = await pool.query(
      "DELETE FROM categories WHERE id = $1 AND restaurant_id = $2 RETURNING id",
      [categoryId, restaurantId]
    );

    if (del.rowCount === 0) return res.status(404).json({ error: "Category not found" });

    res.sendStatus(204);
  } catch (err) {
    console.error("DELETE /owner/categories/:id error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /owner/dishes
// body: { categoryId, name, description, price }
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

    // ensure category belongs to this restaurant
    const catCheck = await pool.query(
      "SELECT id FROM categories WHERE id = $1 AND restaurant_id = $2",
      [categoryId, restaurantId]
    );
    if (catCheck.rowCount === 0) return res.status(404).json({ error: "Category not found" });

    const ins = await pool.query(
      `INSERT INTO r_dishes (name, description, price, restaurant_id, category_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, description, price, category_id`,
      [name, description, price, restaurantId, categoryId]
    );

    const d = ins.rows[0];
    const priceNum = Number(String(d.price).replace(/[^\d.,-]/g, "").replace(",", "."));

    res.status(201).json({
      id: d.id,
      name: d.name,
      description: d.description,
      price: Number.isFinite(priceNum) ? priceNum : price,
      category_id: d.category_id
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

export default router;
