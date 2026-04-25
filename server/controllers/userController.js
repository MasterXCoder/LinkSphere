const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { getDB } = require("../database/db");

const SECRET = process.env.JWT_SECRET;

// ─── Signup ───────────────────────────────────────────────────────────────────
const signup = async (req, res) => {
  const { username, email, password, dob } = req.body;

  if (!username || !email || !password || !dob) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const db = getDB();
    const users = db.collection("users");

    const existingUser = await users.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      id: Date.now(),
      username,
      email,
      dob,
      password: hashedPassword,
    };

    await users.insertOne(newUser);
    res.status(201).json({ message: "Account created successfully" });
  } catch (err) {
    console.error("signup error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ─── Login ────────────────────────────────────────────────────────────────────
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const db = getDB();
    const user = await db.collection("users").findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: { id: user.id, username: user.username, email: user.email, dob: user.dob },
    });
  } catch (err) {
    console.error("login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ─── Get User ─────────────────────────────────────────────────────────────────
const getUser = async (req, res) => {
  const id = Number(req.params.id);

  try {
    const db = getDB();
    const user = await db.collection("users").findOne({ id });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      id: user.id,
      username: user.username,
      email: user.email,
      dob: user.dob,
    });
  } catch (err) {
    console.error("getUser error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ─── Update User ──────────────────────────────────────────────────────────────
const updateUser = async (req, res) => {
  const id = Number(req.params.id);

  if (req.user.id != id) {
    return res.status(403).json({ error: "Unauthorized action" });
  }

  const { username, email, password, dob } = req.body;

  try {
    const db = getDB();
    const users = db.collection("users");

    const user = await users.findOne({ id });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const updates = {};
    if (username) updates.username = username;
    if (email)    updates.email    = email;
    if (password) updates.password = await bcrypt.hash(password, 10);
    if (dob)      updates.dob      = dob;

    await users.updateOne({ id }, { $set: updates });

    const updated = await users.findOne({ id });
    res.status(200).json({
      message: "User updated successfully",
      user: { id: updated.id, username: updated.username, email: updated.email, dob: updated.dob },
    });
  } catch (err) {
    console.error("updateUser error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ─── Delete User ──────────────────────────────────────────────────────────────
const deleteUser = async (req, res) => {
  const id = Number(req.params.id);

  if (req.user.id != id) {
    return res.status(403).json({ error: "You can only delete your own account" });
  }

  try {
    const db = getDB();
    const result = await db.collection("users").deleteOne({ id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ message: "Account deleted successfully" });
  } catch (err) {
    console.error("deleteUser error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { signup, login, getUser, updateUser, deleteUser };