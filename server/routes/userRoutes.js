const express = require("express");
const router = express.Router();
const { login, signup, getUser } = require("../controllers/userController");

// POST /api/users/login
router.post("/login", login);

// POST /api/users/signup
router.post("/signup", signup);

// GET /api/users/:id
router.get("/:id", getUser);

module.exports = router;