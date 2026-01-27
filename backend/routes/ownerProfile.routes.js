// CORE DEPENDENCIES
// Express Router, JWT für Tokenprüfung, DB Pool und App-Konfiguration
import express from "express";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";
import { config } from "../config.js";

// FILE UPLOADS
// Multer für Upload Handling sowie Path und FS für Dateisystemoperationen
import multer from "multer";
import path from "path";
import fs from "fs";

// JWT CONFIG
// JWT Secret wird aus zentraler Konfiguration geladen
const JWT_SECRET = config.JWT_SECRET;

// ROUTER SETUP
// Erstellt Router-Instanz für alle Owner-Profile Endpunkte
const router = express.Router();


// AUTHENTICATION MIDDLEWARE
// Akzeptiert Bearer Token und setzt den User in req.user
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


// RESTAURANT LOOKUP HELPER
// Holt die Restaurant-ID, die zum eingeloggten User gehört
async function getRestaurantIdByUserId(userId) {
  const r = await pool.query(
    "SELECT id FROM restaurants WHERE user_id = $1 LIMIT 1",
    [userId]
  );
  return r.rows.length ? r.rows[0].id : null;
}


// MONEY HELPER
// Konvertiert DB Money oder String Formate sicher in Number
function moneyToNumber(m) {
  const s = String(m ?? "");
  const n = Number(s.replace(/[^\d.,-]/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}


// FILE PATH HELPERS
// Wandelt /uploads/... URL in absoluten Server-Pfad um
function absPathFromUploadsUrl(uploadUrl) {
  const local = String(uploadUrl || "").replace(/^\/uploads\//, "uploads/");
  return path.join(process.cwd(), local);
}

// FILE DELETE HELPER
// Löscht Datei anhand des gespeicherten /uploads/... Pfads ohne Hard-Fail
function safeUnlinkByUploadsUrl(uploadUrl) {
  if (!uploadUrl) return;
  const abs = absPathFromUploadsUrl(uploadUrl);
  fs.unlink(abs, () => {});
}


// MULTER CONFIG
// Speichert Restaurant-Logo und Cover Bilder in uploads/restaurants
const uploadDir = path.join(process.cwd(), "uploads", "restaurants");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: async (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase() || ".jpg";

    // Dateiname: restaurant_<id>_logo_<timestamp>.jpg oder restaurant_<id>_cover_<timestamp>.jpg
    const kind = req.params.kind || "image";
    const restaurantId = req.restaurantId || "unknown";
    cb(null, `restaurant_${restaurantId}_${kind}_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) return cb(new Error("Only images allowed"));
    cb(null, true);
  },
});


// DEFAULT OPENING HOURS
// Fallback-Öffnungszeiten, falls keine im DB Feld vorhanden sind
const DEFAULT_OPENING_HOURS = {
  mon: { label: "Mon", closed: false, open: "09:00", close: "18:00" },
  tue: { label: "Tue", closed: false, open: "09:00", close: "18:00" },
  wed: { label: "Wed", closed: false, open: "09:00", close: "18:00" },
  thu: { label: "Thu", closed: false, open: "09:00", close: "18:00" },
  fri: { label: "Fri", closed: false, open: "09:00", close: "20:00" },
  sat: { label: "Sat", closed: false, open: "10:00", close: "20:00" },
  sun: { label: "Sun", closed: true, open: "00:00", close: "00:00" },
};


// PROFILE READ
// Lädt Restaurant-Profil für den eingeloggten Restaurant-User inklusive logo_path und cover_path
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    if (req.user.user_type !== "Restaurant") {
      return res.status(403).json({ error: "Not a restaurant account" });
    }

    const restaurantId = await getRestaurantIdByUserId(req.user.id);
    if (!restaurantId) return res.status(404).json({ error: "Restaurant not found" });

    const result = await pool.query(
      `SELECT id, name, email, phone, delivery_zone, opening_hours, logo_path, cover_path
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

      // IMAGE PATHS
      // Relative Pfade für Logo und Cover (werden im Frontend zu URLs zusammengesetzt)
      logo_path: r.logo_path ?? null,
      cover_path: r.cover_path ?? null,
    });
  } catch (err) {
    console.error("GET /owner/profile error:", err);
    res.status(500).json({ error: "Server error" });
  }
});


// PROFILE UPDATE
// Aktualisiert Profilfelder und Öffnungszeiten des eingeloggten Restaurants
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
       RETURNING id, name, email, phone, delivery_zone, opening_hours, logo_path, cover_path`,
      [name, email, phone, deliveryZone, openingHours, restaurantId]
    );

    res.json(upd.rows[0]);
  } catch (err) {
    console.error("PUT /owner/profile error:", err);
    res.status(500).json({ error: "Server error" });
  }
});


// RESTAURANT IMAGE UPLOAD
// Upload Endpoint für Restaurant Logo oder Cover und speichert Pfad in DB
router.post(
  "/profile/:kind",
  authenticateToken,
  async (req, res, next) => {
    try {
      if (req.user.user_type !== "Restaurant") {
        return res.status(403).json({ error: "Not a restaurant account" });
      }

      const restaurantId = await getRestaurantIdByUserId(req.user.id);
      if (!restaurantId) return res.status(404).json({ error: "Restaurant not found" });

      const kind = String(req.params.kind || "").toLowerCase();
      if (kind !== "logo" && kind !== "cover") {
        return res.status(400).json({ error: "Invalid kind. Use logo or cover." });
      }

      req.restaurantId = restaurantId;
      req.params.kind = kind;

      next();
    } catch (err) {
      console.error("PRE /owner/profile/:kind error:", err);
      res.status(500).json({ error: "Server error" });
    }
  },
  upload.single("image"),
  async (req, res) => {
    try {
      const restaurantId = req.restaurantId;
      const kind = req.params.kind;

      if (!req.file) return res.status(400).json({ error: "No image uploaded" });

      const relPath = `/uploads/restaurants/${req.file.filename}`;

      // OLD PATH READ
      // Holt alten Pfad um nach erfolgreichem Update die alte Datei zu löschen
      const col = kind === "logo" ? "logo_path" : "cover_path";
      const oldR = await pool.query(`SELECT ${col} FROM restaurants WHERE id = $1 LIMIT 1`, [
        restaurantId,
      ]);

      const oldPath = oldR.rows?.[0]?.[col] ?? null;

      // DB UPDATE
      // Setzt neuen Pfad in der passenden Spalte
      await pool.query(`UPDATE restaurants SET ${col} = $1 WHERE id = $2`, [relPath, restaurantId]);

      // FILE DELETE
      // Löscht alte Datei erst nach erfolgreichem DB Update
      safeUnlinkByUploadsUrl(oldPath);

      res.json({ success: true, kind, picture_path: relPath });
    } catch (err) {
      console.error("POST /owner/profile/:kind error:", err);
      res.status(500).json({ error: "Upload failed" });
    }
  }
);


// ROUTER EXPORT
// Exportiert den Router für die Einbindung in server.js
export default router;
