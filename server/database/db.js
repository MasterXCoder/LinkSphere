const mongoose = require("mongoose");

// URI is loaded from .env
const uri = process.env.MONGODB_URI;

async function connectDB() {
  try {
    if (mongoose.connection.readyState >= 1) return;

    await mongoose.connect(uri, {
      dbName: "linksphere",
    });
    console.log("✅ Connected to MongoDB Atlas via Mongoose");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
}

// Exporting a helper to ensure DB is connected (optional with Mongoose but good for consistency)
function getDB() {
  if (mongoose.connection.readyState === 0) {
    throw new Error("Database not initialised — call connectDB() first");
  }
  return mongoose.connection.db;
}

module.exports = { connectDB, getDB };
