// User Controller
// NOTE: No real DB yet — placeholder logic only

const login = (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  // TODO: Add real auth logic
  res.status(200).json({ message: "Login successful", user: { email } });
};

const signup = (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }
  // TODO: Add real registration logic
  res.status(201).json({ message: "Account created", user: { username, email } });
};

const getUser = (req, res) => {
  const { id } = req.params;
  // TODO: Fetch from DB
  res.status(200).json({ id, username: "DemoUser" });
};

module.exports = { login, signup, getUser };