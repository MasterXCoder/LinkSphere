// Auth Middleware
// Verifies the JWT token sent in the Authorization header
// Usage: Authorization: Bearer <token>
const jwt = require("jsonwebtoken");
const SECRET = process.env.JWT_SECRET;

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Check header exists
  if (!authHeader) {
    return res.status(401).json({ error: "No token provided" });
  }

  // Header format must be:  Bearer <token>
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({ error: "Token format: Bearer <token>" });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded; // { id, username, iat, exp }
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};

module.exports = verifyToken;