// CORE DEPENDENCIES
import express from "express";
import cors from "cors";
import pkg from "pg";
import path from "path";
import fs from "fs";

// ROUTE MODULES
// Importiert alle Router für die einzelnen Features der Anwendung
import threadsRouter from "./routes/threads.routes.js";
import moderationRouter from "./routes/moderation.routes.js";
import authRoutes from "./routes/auth.routes.js";
import userRestaurantRoutes from "./routes/userRestaurant.routes.js";
import ownerMenuRoutes from "./routes/ownerMenu.routes.js";
import ownerProfileRoutes from "./routes/ownerProfile.routes.js";
import accountRouter from "./routes/account.routes.js";
import ownerOrdersRouter from "./routes/ownerOrders.routes.js";
import managerSettingsRouter from "./routes/managerSettings.routes.js";
import managerDashboardRouter from "./routes/managerDashboard.routes.js";
import ownerAnalyticsRoutes from "./routes/ownerAnalytics.routes.js";

// POSTGRES CONFIG
// Holt die Pool-Klasse aus dem pg Package
const { Pool } = pkg;

// EXPRESS APP SETUP
// Erstellt Express App und registriert globale Middlewares
const app = express();
app.use(cors());
app.use(express.json());

// STATIC FILE SERVING
// Macht Upload-Dateien per URL erreichbar, damit Frontend Bilder laden kann
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// DATABASE POOL
// Erstellt eine Connection Pool Instanz für PostgreSQL
const pool = new Pool({
  host: "localhost",
  port: 5433,
  user: "postgres",
  password: "postgres",
  database: "postgres",
});


// SEED IMAGE RESTORE (DISHES)
// Kopiert fehlende Seed-Dish-Bilder beim Serverstart nach /uploads/dishes
function restoreSeedDishImages() {
  const seedDir = path.join(process.cwd(), "seed_images", "dishes");
  const uploadsDir = path.join(process.cwd(), "uploads", "dishes");

  if (!fs.existsSync(seedDir)) {
    console.log("[seed-images] No seed_images/dishes folder found, skipping restore");
    return;
  }

  fs.mkdirSync(uploadsDir, { recursive: true });

  const seedFiles = fs.readdirSync(seedDir).filter(Boolean);
  let copied = 0;

  for (const file of seedFiles) {
    const from = path.join(seedDir, file);
    const to = path.join(uploadsDir, file);

    // Nur kopieren, wenn Datei noch nicht existiert
    if (!fs.existsSync(to)) {
      try {
        fs.copyFileSync(from, to);
        copied++;
      } catch {}
    }
  }

  console.log(`[seed-images] Restored ${copied} seed dish images`);
}


// SEED IMAGE RESTORE (RESTAURANTS)
// Kopiert fehlende Restaurant Seed-Bilder (Logo & Cover)
// von /seed_images/restaurants nach /uploads/restaurants
function restoreSeedRestaurantImages() {
  const seedDir = path.join(process.cwd(), "seed_images", "restaurants");
  const uploadsDir = path.join(process.cwd(), "uploads", "restaurants");

  if (!fs.existsSync(seedDir)) {
    console.log("[seed-images] No seed_images/restaurants folder found, skipping restore");
    return;
  }

  fs.mkdirSync(uploadsDir, { recursive: true });

  const seedFiles = fs.readdirSync(seedDir).filter(Boolean);
  let copied = 0;

  for (const file of seedFiles) {
    const from = path.join(seedDir, file);
    const to = path.join(uploadsDir, file);

    // Nur kopieren, wenn Datei noch nicht existiert
    if (!fs.existsSync(to)) {
      try {
        fs.copyFileSync(from, to);
        copied++;
      } catch {}
    }
  }

  console.log(`[seed-images] Restored ${copied} seed restaurant images`);
}


// ORPHAN IMAGE CLEANUP (DISHES)
// Löscht Upload-Dateien, die nicht mehr in r_dishes.picture_path referenziert sind
async function cleanupOrphanDishImages() {
  const dishesDir = path.join(process.cwd(), "uploads", "dishes");

  if (!fs.existsSync(dishesDir)) return;

  const filesOnDisk = fs.readdirSync(dishesDir).filter(Boolean);

  const dbRes = await pool.query(
    "SELECT picture_path FROM r_dishes WHERE picture_path IS NOT NULL"
  );

  const referencedFilenames = new Set(
    dbRes.rows
      .map((r) => r.picture_path)
      .filter(Boolean)
      .map((p) => path.basename(String(p)))
  );

  let removed = 0;

  for (const file of filesOnDisk) {
    if (!referencedFilenames.has(file)) {
      try {
        fs.unlinkSync(path.join(dishesDir, file));
        removed++;
      } catch {}
    }
  }

  console.log(`[cleanup] Removed ${removed} orphan dish images`);
}


// ORPHAN IMAGE CLEANUP (RESTAURANTS)
// Löscht Restaurant-Uploads, die weder als logo_path noch cover_path referenziert sind
async function cleanupOrphanRestaurantImages() {
  const dir = path.join(process.cwd(), "uploads", "restaurants");

  if (!fs.existsSync(dir)) return;

  const filesOnDisk = fs.readdirSync(dir).filter(Boolean);

  const dbRes = await pool.query(`
    SELECT logo_path, cover_path
    FROM restaurants
    WHERE logo_path IS NOT NULL OR cover_path IS NOT NULL
  `);

  const referencedFilenames = new Set();

  for (const row of dbRes.rows) {
    if (row.logo_path) referencedFilenames.add(path.basename(String(row.logo_path)));
    if (row.cover_path) referencedFilenames.add(path.basename(String(row.cover_path)));
  }

  let removed = 0;

  for (const file of filesOnDisk) {
    if (!referencedFilenames.has(file)) {
      try {
        fs.unlinkSync(path.join(dir, file));
        removed++;
      } catch {}
    }
  }

  console.log(`[cleanup] Removed ${removed} orphan restaurant images`);
}


// DATABASE CONNECTION CHECK
// Prüft DB Verbindung beim Serverstart und führt danach Restore & Cleanup aus
pool
  .query("SELECT 1")
  .then(async () => {
    console.log("Database connected");

    // 1) Seed-Bilder wiederherstellen
    restoreSeedDishImages();
    restoreSeedRestaurantImages();

    // 2) Nicht referenzierte Uploads aufräumen
    await cleanupOrphanDishImages();
    await cleanupOrphanRestaurantImages();
  })
  .catch((err) => console.error("Database connection error:", err));


// HEALTH CHECK
// Einfacher Endpoint, um zu prüfen ob Backend läuft
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});


// ROUTE REGISTRATION
// Registriert alle Router unter ihren jeweiligen Basis-Pfaden
app.use("/", authRoutes);

app.use("/api/threads", threadsRouter);
app.use("/moderation", moderationRouter);

app.use("/owner", ownerMenuRoutes);
app.use("/owner", ownerProfileRoutes);
app.use("/owner", ownerAnalyticsRoutes);

app.use("/", accountRouter);
app.use("/", ownerOrdersRouter);

app.use("/manager", managerSettingsRouter);
app.use("/manager/dashboard", managerDashboardRouter);

app.use("/user-restaurants", userRestaurantRoutes);


// SERVER START
// Startet den HTTP Server auf Port 3000
app.listen(3000, () => {
  console.log("Backend running on http://localhost:3000");
});
