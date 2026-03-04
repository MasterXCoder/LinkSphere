// User Controller
// Uses flat-file JSON storage (no database)
// Passwords stored as plain text (no hashing) — for learning purposes
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
dotenv.config();
const SECRET = process.env.JWT_SECRET;

// Path to the users data file
const usersFilePath = path.join(__dirname, "../../data/users.json");


// ─── File Helpers ────────────────────────────────────────────────────────────

const getUsers = () => {
  if (!fs.existsSync(usersFilePath)) {
    fs.writeFileSync(usersFilePath, "[]");
  }
  const data = fs.readFileSync(usersFilePath, "utf-8");
  return JSON.parse(data);
};

const saveUsers = (users) => {
  fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
};

const signup = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const users = getUsers();

  const existingUser = users.find((user) => user.email === email);
  if (existingUser) {
    return res.status(400).json({ error: "User already exists" });
  }

  const newUser = {
    id: Date.now(),
    username,
    email,
    password, // plain text — no hashing
  };

  users.push(newUser);
  saveUsers(users);

  res.status(201).json({ message: "Account created successfully" });
};


const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const users = getUsers();

  const user = users.find((user) => user.email === email);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  // Direct plain-text password comparison
  if (password !== user.password) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  // Sign JWT with user id and username
  const token = jwt.sign(
    { id: user.id, username: user.username },
    SECRET,
    { expiresIn: "5s" }
  );

  res.status(200).json({
    message: "Login successful",
    token,
    user: { id: user.id, username: user.username, email: user.email },
  });
};


const getUser = (req, res) => {
  const { id } = req.params;
  const users = getUsers();
  const user = users.find(user => user.id == id);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  // Never return the password field
  res.status(200).json({
    id: user.id,
    username: user.username,
    email: user.email,
  });
};


// PUT /api/users/:id  (protected)
const updateUser = (req, res) => {
  const { id } = req.params;

  // Only allow a user to update their own account
  if (req.user.id != id) {
    return res.status(403).json({ error: "Unauthorized action" });
  }

  const { username, email, password } = req.body;
  const users = getUsers();

  const userIndex = users.findIndex((user) => user.id == id);
  if (userIndex === -1) {
    return res.status(404).json({ error: "User not found" });
  }

  if (username) users[userIndex].username = username;
  if (email) users[userIndex].email = email;
  if (password) users[userIndex].password = password; // plain text

  saveUsers(users);

  res.status(200).json({
    message: "User updated successfully",
    user: {
      id: users[userIndex].id,
      username: users[userIndex].username,
      email: users[userIndex].email,
    },
  });
};


// DELETE /api/users/:id  (protected)
const deleteUser = (req, res) => {
  const { id } = req.params;

  if (req.user.id != id) {
    return res.status(403).json({ error: "You can only delete your own account" });
  }

  const users = getUsers();
  const userExists = users.find((user) => user.id == id);
  if (!userExists) {
    return res.status(404).json({ error: "User not found" });
  }

  const updatedUsers = users.filter((user) => user.id != id);
  saveUsers(updatedUsers);

  res.status(200).json({ message: "Account deleted successfully" });
};


module.exports = { signup, login, getUser, updateUser, deleteUser };