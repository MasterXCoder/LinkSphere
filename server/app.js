
const express = require("express");
const cors = require("cors");
const userRoutes = require("./routes/userRoutes");
const serverRoutes = require("./routes/serverRoutes");

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/users", userRoutes);
app.use("/api/servers", serverRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "LinkSphere server is running" });
});

module.exports = app;