const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
dotenv.config();
const SECRET = process.env.JWT_SECRET;

const usersFilePath = path.join(__dirname, "../../data/users.json");

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
  const { username, email, password, dob } = req.body;

  if (!username || !email || !password || !dob) {
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
    dob,
    password, 
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

  if (password !== user.password) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username },
    SECRET,
    { expiresIn: "5s" }
  );

  res.status(200).json({
    message: "Login successful",
    token,
    user: { id: user.id, username: user.username, email: user.email, dob: user.dob },
  });
};

const getUser = (req, res) => {
  const { id } = req.params;
  const users = getUsers();
  const user = users.find(user => user.id == id);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  res.status(200).json({
    id: user.id,
    username: user.username,
    email: user.email,
    dob: user.dob,
  });
};

const updateUser = (req, res) => {
  const { id } = req.params;

  if (req.user.id != id) {
    return res.status(403).json({ error: "Unauthorized action" });
  }

  const { username, email, password, dob } = req.body;
  const users = getUsers();

  const userIndex = users.findIndex((user) => user.id == id);
  if (userIndex === -1) {
    return res.status(404).json({ error: "User not found" });
  }

  if (username) users[userIndex].username = username;
  if (email) users[userIndex].email = email;
  if (password) users[userIndex].password = password;
  if (dob) users[userIndex].dob = dob;

  saveUsers(users);

  res.status(200).json({
    message: "User updated successfully",
    user: {
      id: users[userIndex].id,
      username: users[userIndex].username,
      email: users[userIndex].email,
      dob: users[userIndex].dob,
    },
  });
};

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