const { MongoClient, ServerApiVersion } = require("mongodb");

// URI is loaded from .env — password is never hardcoded here
const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let db;

async function connectDB() {
  if (db) return db; // return cached connection if already connected

  await client.connect();

  // Confirm connection with a ping
  await client.db("admin").command({ ping: 1 });
  console.log("✅ Connected to MongoDB Atlas");

  db = client.db(); // uses the default DB from the connection string
  return db;
}

function getDB() {
  if (!db) throw new Error("Database not initialised — call connectDB() first");
  return db;
}

module.exports = { connectDB, getDB, client };
