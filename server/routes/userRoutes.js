// User Routes
// Public  : POST /api/users/signup, POST /api/users/login
// Protected (JWT required): GET /api/users/:id, PUT /api/users/:id, DELETE /api/users/:id

const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const { signupSchema, loginSchema, updateUserSchema } = require("../validations/userSchemas");
const { signup, login, getUser, updateUser, deleteUser } = require("../controllers/userController");

// ── Public routes ──────────────────────────────────────────────────────────────
router.post("/signup", validate(signupSchema), signup);
router.post("/login",  validate(loginSchema),  login);

// ── Protected routes ───────────────────────────────────────────────────────────
router.get   ("/:id", verifyToken, getUser);
router.put   ("/:id", verifyToken, validate(updateUserSchema), updateUser);
router.delete("/:id", verifyToken, deleteUser);

module.exports = router;