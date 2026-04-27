require("dotenv").config({ quiet: true });
const app = require("./server/app");
const { connectDB } = require("./server/database/db");

const PORT = 8000;

// Connect to MongoDB Atlas first, then start the HTTP server
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Failed to connect to MongoDB Atlas:", err);
    process.exit(1);
  });
