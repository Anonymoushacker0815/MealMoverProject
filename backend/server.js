import express from "express";
import cors from "cors";
import pkg from "pg";
import threadsRouter from './routes/threads.routes.js';
import authRoutes from "./routes/auth.routes.js";
import ownerRoutes from './routes/owner.routes.js';
import ownerProfileRoutes from './routes/ownerProfile.routes.js';


const { Pool } = pkg;

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  host: "localhost",
  port: 5433,
  user: "postgres",
  password: "postgres",
  database: "postgres",
});

pool.query("SELECT 1")
  .then(() => console.log("Database connected"))
  .catch(err => console.error("Database connection error:", err));

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/", authRoutes);

app.use("/api/threads", threadsRouter);

app.use('/owner', ownerRoutes);
app.use('/owner', ownerProfileRoutes);

app.listen(3000, () => {
  console.log("Backend running on http://localhost:3000");
});