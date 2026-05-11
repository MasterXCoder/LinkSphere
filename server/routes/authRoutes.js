// OAuth Routes
// GET /api/auth/google          → redirects to Google consent screen
// GET /api/auth/google/callback → Google redirects back here
// GET /api/auth/me              → returns current user from JWT

const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");

const router = express.Router();
const SECRET = process.env.JWT_SECRET;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// ── Initiate Google OAuth ─────────────────────────────────────────────────────
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// ── Google OAuth callback ─────────────────────────────────────────────────────
router.get(
  "/google/callback",
  (req, res, next) => {
    passport.authenticate("google", { session: false }, (err, user, info) => {
      console.log("GOOGLE AUTH RESULT -> err:", err, "user:", user, "info:", info);
      if (err) {
        return res.redirect(`${CLIENT_URL}/login?error=auth_error`);
      }
      if (!user) {
        return res.redirect(`${CLIENT_URL}/login?error=no_user`);
      }
      req.user = user;
      next();
    })(req, res, next);
  },
  (req, res) => {
    console.log("Generating JWT for user:", req.user.username);
    // `req.user.id` might return the string `_id` virtual. Use `_doc.id` to be safe if it's a numeric ID field.
    const userId = req.user._doc?.id || req.user.id || req.user._id;

    // Generate JWT — same payload shape as existing login
    const token = jwt.sign(
      { id: userId, username: req.user.username },
      SECRET,
      { expiresIn: "1h" }
    );

    // Encode user data for the frontend
    const userData = encodeURIComponent(
      JSON.stringify({
        id: userId,
        username: req.user.username,
        email: req.user.email,
        dob: req.user.dob || "",
        hasPassword: !!req.user.password,
        avatarUrl: req.user.avatarUrl || "",
      })
    );

    console.log("Redirecting to frontend...");
    // Redirect to frontend with token + user data in query params
    res.redirect(`${CLIENT_URL}/oauth-callback?token=${token}&user=${userData}`);
  }
);

module.exports = router;
