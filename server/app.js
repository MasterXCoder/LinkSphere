
const express = require("express");
const cors    = require("cors");
const userRoutes = require("./routes/userRoutes");

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/users", userRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "LinkSphere server is running" });
});

module.exports = app;