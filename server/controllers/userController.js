const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const catchAsync = require("../utils/catchAsync");
const { deleteImage } = require("../utils/cloudinaryHelper");

const SECRET = process.env.JWT_SECRET || "fallback-secret";

// ─── Signup ───────────────────────────────────────────────────────────────────
const signup = catchAsync(async (req, res) => {
  const { username, email, password, dob } = req.body;
  // Note: presence & format validated by Zod middleware (signupSchema)

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(400, "User already exists");
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
});

// ─── Login ────────────────────────────────────────────────────────────────────
const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  // Note: presence & format validated by Zod middleware (loginSchema)

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Guard: if user signed up via Google and hasn't set a password yet
  if (user.googleId && !user.password) {
    throw new ApiError(400, "No password set. Please add a password in Settings first.");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new ApiError(401, "Invalid credentials");
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
});

// ─── Get User ─────────────────────────────────────────────────────────────────
const getUser = catchAsync(async (req, res) => {
  const id = Number(req.params.id);
  const user = await User.findOne({ id });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  res.status(200).json({
    id: user.id,
    username: user.username,
    email: user.email,
    dob: user.dob,
    hasPassword: !!user.password,
    avatarUrl: user.avatarUrl,
  });
});

// ─── Update User ──────────────────────────────────────────────────────────────
const updateUser = catchAsync(async (req, res) => {
  const id = Number(req.params.id);

  if (req.user.id != id) {
    throw new ApiError(403, "Unauthorized action");
  }

  const { username, email, password, dob, avatarUrl } = req.body;

  const user = await User.findOne({ id });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // If avatar is being updated and an old one exists, cleanup Cloudinary
  if (avatarUrl !== undefined && avatarUrl !== user.avatarUrl) {
    await deleteImage(user.avatarUrl);
    user.avatarUrl = avatarUrl;
  }

  if (username) user.username = username;
  if (email)    user.email    = email;
  if (password) user.password = await bcrypt.hash(password, 10);
  if (dob)      user.dob      = dob;

  await user.save();

  res.status(200).json({
    message: "User updated successfully",
    user: { id: user.id, username: user.username, email: user.email, dob: user.dob, hasPassword: !!user.password, avatarUrl: user.avatarUrl },
  });
});

// ─── Delete User ──────────────────────────────────────────────────────────────
const deleteUser = catchAsync(async (req, res) => {
  const id = Number(req.params.id);

  if (req.user.id != id) {
    throw new ApiError(403, "You can only delete your own account");
  }

  const user = await User.findOne({ id });
  if (user) {
    await deleteImage(user.avatarUrl);
  }

  const result = await User.deleteOne({ id });

  if (result.deletedCount === 0) {
    throw new ApiError(404, "User not found");
  }

  res.status(200).json({ message: "Account deleted successfully" });
});

module.exports = { signup, login, getUser, updateUser, deleteUser };