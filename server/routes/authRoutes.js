// OAuth Routes
// GET /api/auth/google          → redirects to Google consent screen
// GET /api/auth/google/callback → Google redirects back here
// GET /api/auth/me              → returns current user from JWT

const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");

const router = express.Router();
const SECRET = process.env.JWT_SECRET;
const CLIENT_URL = "http://localhost:5173";

// ── Initiate Google OAuth ─────────────────────────────────────────────────────
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// ── Google OAuth callback ─────────────────────────────────────────────────────
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${CLIENT_URL}/login`,
  }),
  (req, res) => {
    // Generate JWT — same payload shape as existing login
    const token = jwt.sign(
      { id: req.user.id, username: req.user.username },
      SECRET,
      { expiresIn: "1h" }
    );

    // Encode user data for the frontend
    const userData = encodeURIComponent(
      JSON.stringify({
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        dob: req.user.dob || "",
      })
    );

    // Redirect to frontend with token + user data in query params
    res.redirect(`${CLIENT_URL}/oauth-callback?token=${token}&user=${userData}`);
  }
);

module.exports = router;
