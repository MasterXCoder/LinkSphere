const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const SECRET = process.env.JWT_SECRET;

// ─── Signup ───────────────────────────────────────────────────────────────────
const signup = async (req, res) => {
  const { username, email, password, dob } = req.body;

  if (!username || !email || !password || !dob) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      dob,
      password: hashedPassword,
    });

    await newUser.save();
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
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Guard: if user signed up via Google and hasn't set a password yet
    if (user.googleId && !user.password) {
      return res.status(400).json({
        error: "No password set. Please add a password in Settings first.",
      });
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
      user: { id: user.id, username: user.username, email: user.email, dob: user.dob, hasPassword: !!user.password, avatarUrl: user.avatarUrl },
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
    const user = await User.findOne({ id });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      id: user.id,
      username: user.username,
      email: user.email,
      dob: user.dob,
      hasPassword: !!user.password,
      avatarUrl: user.avatarUrl,
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

  const { username, email, password, dob, avatarUrl } = req.body;

  try {
    const user = await User.findOne({ id });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (username) user.username = username;
    if (email)    user.email    = email;
    if (password) user.password = await bcrypt.hash(password, 10);
    if (dob)      user.dob      = dob;
    if (avatarUrl) user.avatarUrl = avatarUrl;

    await user.save();

    res.status(200).json({
      message: "User updated successfully",
      user: { id: user.id, username: user.username, email: user.email, dob: user.dob, hasPassword: !!user.password, avatarUrl: user.avatarUrl },
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
    const result = await User.deleteOne({ id });

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