// User Controller
// NOTE: No real DB yet — placeholder logic only

const fs = require("fs");
const path = require("path");
// const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const SECRET = "linksphere_secret_key";
const usersFilePath = path.join(__dirname, "../../users.json");


const getUsers = () => {
  if (!fs.existsSync(usersFilePath)) {
    fs.writeFileSync(usersFilePath, "[]");
  }
  const data = fs.readFileSync(usersFilePath);
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

  const existingUser = users.find(user => user.email === email);
  if (existingUser) {
    return res.status(400).json({ error: "User already exists" });
  }

  const newUser = {
    id: Date.now(),
    username,
    email,
    password: password
  };

  users.push(newUser);
  saveUsers(users);

  res.status(201).json({
    message: "Account created successfully"
  });
};



const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const users = getUsers();

  const user = users.find(user => user.email === email);

  if (!user) {
    return res.status(400).json({ error: "User not found" });
  }

  if (password !== user.password) {
    return res.status(400).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username },
    SECRET,
    { expiresIn: "1h" }
  );

  res.status(200).json({
    message: "Login successful",
    token
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
    email: user.email
  });
};

module.exports = { login, signup, getUser };