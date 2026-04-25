
const express = require("express");
const cors = require("cors");
const userRoutes = require("./routes/userRoutes");
const serverRoutes = require("./routes/serverRoutes");

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: ["http://localhost:5173", "http://127.0.0.1:5173"], credentials: true }));
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/users", userRoutes);
app.use("/api/servers", serverRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "LinkSphere server is running" });
});

module.exports = app;