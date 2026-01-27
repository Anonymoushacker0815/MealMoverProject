// CORE DEPENDENCIES
// Express Router, Datenbankverbindung, JWT und App-Konfiguration
import express from "express";
import { pool } from "../db.js";
import jwt from "jsonwebtoken";
import { config } from "../config.js";

// FILE UPLOAD & FILE SYSTEM
// Benötigt für Bild-Uploads und Dateiverwaltung
import multer from "multer";
import path from "path";
import fs from "fs";

// ROUTER & CONFIG
// Initialisiert Router und JWT Secret
const JWT_SECRET = config.JWT_SECRET;
const router = express.Router();


// AUTHENTICATION MIDDLEWARE
// Prüft JWT Token und hängt eingeloggten User an req.user
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : authHeader;

  if (!token) return res.status(401).json({ error: "No Token." });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Token not valid." });
    req.user = user;
    next();
  });
};


// DATABASE HELPERS
// Holt die Restaurant-ID zum eingeloggten User
async function getRestaurantIdByUserId(userId) {
  const r = await pool.query(
    "SELECT id FROM restaurants WHERE user_id = $1 LIMIT 1",
    [userId]
  );
  return r.rows.length ? r.rows[0].id : null;
}


// DATA TRANSFORMATION HELPERS
// Wandelt money-Datentyp in number um
function moneyToNumber(m) {
  const s = String(m ?? "");
  const n = Number(s.replace(/[^\d.,-]/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}


// FILE SYSTEM HELPERS
// Wandelt eine /uploads URL in einen absoluten Dateipfad um
function absPathFromUploadsUrl(uploadUrl) {
  const local = String(uploadUrl || "").replace(/^\/uploads\//, "uploads/");
  return path.join(process.cwd(), local);
}

// Löscht eine Bilddatei anhand der gespeicherten uploads-URL
function safeUnlinkByUploadsUrl(uploadUrl) {
  if (!uploadUrl) return;
  const abs = absPathFromUploadsUrl(uploadUrl);
  fs.unlink(abs, () => {});
}


// FILE UPLOAD CONFIGURATION
// Konfiguration für Dish-Bilder Upload mit Multer
const uploadDir = path.join(process.cwd(), "uploads", "dishes");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase() || ".jpg";
    cb(null, `dish_${req.params.id}_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only images allowed"));
    }
    cb(null, true);
  },
});


// MENU READ
// Lädt Kategorien und Gerichte für das Restaurant des Owners inklusive picture_path
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

    const dishesRes = await pool.query(
      "SELECT id, name, description, price, category_id, picture_path FROM r_dishes WHERE restaurant_id = $1 ORDER BY sort_index ASC, id ASC",
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
        picture_path: d.picture_path ?? null,
      });
    }

    res.json(cats);
  } catch (err) {
    console.error("GET /owner/menu error:", err);
    res.status(500).json({ error: "Server error" });
  }
});


// CATEGORY CREATE
// Erstellt eine neue Kategorie für das Restaurant
router.post("/categories", authenticateToken, async (req, res) => {
  try {
    if (req.user.user_type !== "Restaurant") {
      return res.status(403).json({ error: "Not a restaurant account" });
    }

    const restaurantId = await getRestaurantIdByUserId(req.user.id);
    if (!restaurantId) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    const name = String(req.body.name || "").trim();
    const description = String(req.body.description || "").trim();
    if (!name) {
      return res.status(400).json({ error: "Category name required" });
    }

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


// CATEGORY DELETE
// Löscht Kategorie, alle enthaltenen Gerichte und deren Bilder
router.delete("/categories/:id", authenticateToken, async (req, res) => {
  try {
    if (req.user.user_type !== "Restaurant") {
      return res.status(403).json({ error: "Not a restaurant account" });
    }

    const restaurantId = await getRestaurantIdByUserId(req.user.id);
    if (!restaurantId) return res.status(404).json({ error: "Restaurant not found" });

    const categoryId = Number(req.params.id);
    if (!Number.isFinite(categoryId)) {
      return res.status(400).json({ error: "Invalid category id" });
    }

    const picsRes = await pool.query(
      "SELECT picture_path FROM r_dishes WHERE category_id = $1 AND restaurant_id = $2 AND picture_path IS NOT NULL",
      [categoryId, restaurantId]
    );
    const pathsToDelete = picsRes.rows.map((r) => r.picture_path).filter(Boolean);

    await pool.query("BEGIN");

    await pool.query(
      "DELETE FROM r_dishes WHERE category_id = $1 AND restaurant_id = $2",
      [categoryId, restaurantId]
    );

    const del = await pool.query(
      "DELETE FROM categories WHERE id = $1 AND restaurant_id = $2 RETURNING id",
      [categoryId, restaurantId]
    );

    await pool.query("COMMIT");

    if (del.rowCount === 0) {
      return res.status(404).json({ error: "Category not found" });
    }

    for (const p of pathsToDelete) safeUnlinkByUploadsUrl(p);

    res.sendStatus(204);
  } catch (err) {
    await pool.query("ROLLBACK").catch(() => {});
    console.error("DELETE /owner/categories/:id error:", err);
    res.status(500).json({ error: "Server error" });
  }
});


// DISH CREATE
// Erstellt ein neues Gericht innerhalb einer Kategorie
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

    if (!Number.isFinite(categoryId)) {
      return res.status(400).json({ error: "Invalid categoryId" });
    }
    if (!name || !description || !Number.isFinite(price)) {
      return res.status(400).json({ error: "Invalid dish data" });
    }

    const maxR = await pool.query(
      "SELECT COALESCE(MAX(sort_index), -1) AS max FROM r_dishes WHERE restaurant_id = $1 AND category_id = $2",
      [restaurantId, categoryId]
    );
    const nextIndex = Number(maxR.rows[0].max) + 1;

    const ins = await pool.query(
      `INSERT INTO r_dishes (name, description, price, restaurant_id, category_id, sort_index)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, description, price, category_id, picture_path`,
      [name, description, price, restaurantId, categoryId, nextIndex]
    );

    const d = ins.rows[0];

    res.status(201).json({
      id: d.id,
      name: d.name,
      description: d.description,
      price: moneyToNumber(d.price),
      category_id: d.category_id,
      picture_path: d.picture_path ?? null,
    });
  } catch (err) {
    console.error("POST /owner/dishes error:", err);
    res.status(500).json({ error: "Server error" });
  }
});


// DISH DELETE
// Löscht ein Gericht und entfernt das zugehörige Bild
router.delete("/dishes/:id", authenticateToken, async (req, res) => {
  try {
    if (req.user.user_type !== "Restaurant") {
      return res.status(403).json({ error: "Not a restaurant account" });
    }

    const restaurantId = await getRestaurantIdByUserId(req.user.id);
    if (!restaurantId) return res.status(404).json({ error: "Restaurant not found" });

    const dishId = Number(req.params.id);
    if (!Number.isFinite(dishId)) {
      return res.status(400).json({ error: "Invalid dish id" });
    }

    const picR = await pool.query(
      "SELECT picture_path FROM r_dishes WHERE id = $1 AND restaurant_id = $2",
      [dishId, restaurantId]
    );
    if (picR.rowCount === 0) {
      return res.status(404).json({ error: "Dish not found" });
    }

    const oldPath = picR.rows[0].picture_path;

    await pool.query(
      "DELETE FROM r_dishes WHERE id = $1 AND restaurant_id = $2",
      [dishId, restaurantId]
    );

    safeUnlinkByUploadsUrl(oldPath);

    res.sendStatus(204);
  } catch (err) {
    console.error("DELETE /owner/dishes/:id error:", err);
    res.status(500).json({ error: "Server error" });
  }
});


// DISH IMAGE UPLOAD
// Lädt ein Bild hoch, speichert den Pfad und ersetzt ggf. das alte Bild
router.post(
  "/dishes/:id/picture",
  authenticateToken,
  upload.single("image"),
  async (req, res) => {
    try {
      if (req.user.user_type !== "Restaurant") {
        return res.status(403).json({ error: "Not a restaurant account" });
      }

      const restaurantId = await getRestaurantIdByUserId(req.user.id);
      if (!restaurantId) return res.status(404).json({ error: "Restaurant not found" });

      const dishId = Number(req.params.id);
      if (!Number.isFinite(dishId)) {
        return res.status(400).json({ error: "Invalid dish id" });
      }
      if (!req.file) {
        return res.status(400).json({ error: "No image uploaded" });
      }

      const dishR = await pool.query(
        "SELECT picture_path FROM r_dishes WHERE id = $1 AND restaurant_id = $2",
        [dishId, restaurantId]
      );
      if (dishR.rowCount === 0) {
        return res.status(404).json({ error: "Dish not found" });
      }

      const oldPath = dishR.rows[0].picture_path;
      const relPath = `/uploads/dishes/${req.file.filename}`;

      await pool.query(
        "UPDATE r_dishes SET picture_path = $1 WHERE id = $2 AND restaurant_id = $3",
        [relPath, dishId, restaurantId]
      );

      safeUnlinkByUploadsUrl(oldPath);

      res.json({ picture_path: relPath });
    } catch (err) {
      console.error("POST /owner/dishes/:id/picture error:", err);
      res.status(500).json({ error: "Upload failed" });
    }
  }
);


// CATEGORY REORDER
// Speichert die neue Reihenfolge der Kategorien
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
      await pool.query(
        "UPDATE categories SET sort_index = $1 WHERE id = $2 AND restaurant_id = $3",
        [i, orderedIds[i], restaurantId]
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


// DISH REORDER
// Speichert die neue Reihenfolge der Gerichte innerhalb einer Kategorie
router.patch("/categories/:categoryId/dishes/reorder", authenticateToken, async (req, res) => {
  try {
    if (req.user.user_type !== "Restaurant") {
      return res.status(403).json({ error: "Not a restaurant account" });
    }

    const restaurantId = await getRestaurantIdByUserId(req.user.id);
    if (!restaurantId) return res.status(404).json({ error: "Restaurant not found" });

    const categoryId = Number(req.params.categoryId);
    const { orderedDishIds } = req.body;

    if (!Number.isFinite(categoryId) || !Array.isArray(orderedDishIds)) {
      return res.status(400).json({ error: "Invalid reorder data" });
    }

    await pool.query("BEGIN");
    for (let i = 0; i < orderedDishIds.length; i++) {
      await pool.query(
        "UPDATE r_dishes SET sort_index = $1 WHERE id = $2 AND restaurant_id = $3 AND category_id = $4",
        [i, orderedDishIds[i], restaurantId, categoryId]
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


// ROUTER EXPORT
// Exportiert den Router für die Einbindung in server.js
export default router;
