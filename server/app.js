
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
require("./config/passport"); // loads the Google OAuth strategy
const userRoutes = require("./routes/userRoutes");
const serverRoutes = require("./routes/serverRoutes");
const authRoutes = require("./routes/authRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const friendRoutes = require("./routes/friendRoutes");
const dmRoutes = require("./routes/dmRoutes");

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || "fallback-secret",
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/users", userRoutes);
app.use("/api/servers", serverRoutes);
app.use("/api/auth", authRoutes);      // Google OAuth routes
app.use("/api/upload", uploadRoutes);  // Cloudinary image upload
app.use("/api/friends", friendRoutes); // Friend system
app.use("/api/dm", dmRoutes);          // Personal direct messages

app.get("/", (req, res) => {
  res.send("LinkSphere API is running");
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "LinkSphere server is running" });
});

const { errorConverter, errorHandler } = require("./middleware/errorMiddleware");
const ApiError = require("./utils/ApiError");

const path = require("path");

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../client/dist")));

  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.resolve(__dirname, "../client/dist", "index.html"));
  });
}

// send back a 404 error for any unknown api request
app.use((req, res, next) => {
    next(new ApiError(404, "Not found"));
});

// convert error to ApiError, if needed
app.use(errorConverter);

// handle error
app.use(errorHandler);

module.exports = app;
