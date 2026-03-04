// User Routes
// Public  : POST /api/users/signup, POST /api/users/login
// Protected (JWT required): GET /api/users/:id, PUT /api/users/:id, DELETE /api/users/:id

const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const { signup, login, getUser, updateUser, deleteUser } = require("../controllers/userController");

// ── Public routes     ─────────────────────────────────────────────────────────────
router.post("/signup", signup);
router.post("/login",  login);

// ── Protected routes ──────────────────────────────────────────────────────────
router.get   ("/:id", verifyToken, getUser);
router.put   ("/:id", verifyToken, updateUser);
router.delete("/:id", verifyToken, deleteUser);

module.exports = router;