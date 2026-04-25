const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;

const router = express.Router();

// Configure cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "demo",
  api_key: process.env.CLOUDINARY_API_KEY || "demo_key",
  api_secret: process.env.CLOUDINARY_API_SECRET || "demo_secret",
});

// Configure multer with memory storage (so we skip saving to disk and upload stream directly)
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No image file provided." });
  }

  // Upload to Cloudinary using a stream
  const uploadStream = cloudinary.uploader.upload_stream(
    { folder: "linksphere" },
    (error, result) => {
      if (error) {
        console.error("Cloudinary upload error:", error);
        return res.status(500).json({ error: "Failed to upload image to Cloudinary: " + (error.message || JSON.stringify(error)) });
      }
      res.status(200).json({ url: result.secure_url });
    }
  );

  uploadStream.end(req.file.buffer);
});

module.exports = router;
