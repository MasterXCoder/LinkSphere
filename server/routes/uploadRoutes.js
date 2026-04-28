const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const verifyToken = require("../middleware/authMiddleware");

const router = express.Router();

// Configure cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "demo",
  api_key: process.env.CLOUDINARY_API_KEY || "demo_key",
  api_secret: process.env.CLOUDINARY_API_SECRET || "demo_secret",
});

// Configure multer with memory storage (so we skip saving to disk and upload stream directly)
const storage = multer.memoryStorage();
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/zip",
  "application/x-zip-compressed",
]);

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(new Error("Unsupported file type."));
    }
    cb(null, true);
  },
});

router.post("/", verifyToken, upload.fields([
  { name: "attachment", maxCount: 1 },
  { name: "image", maxCount: 1 }, // backward compatibility
]), (req, res) => {
  const file = req.files?.attachment?.[0] || req.files?.image?.[0];
  if (!file) {
    return res.status(400).json({ error: "No file provided." });
  }

  const isImage = file.mimetype.startsWith("image/");
  const resourceType = isImage ? "image" : "raw";

  // Use explicit resource type so docs/pdfs are not delivered through image endpoints.
  const uploadStream = cloudinary.uploader.upload_stream(
    { folder: "linksphere/chat-attachments", resource_type: resourceType },
    (error, result) => {
      if (error) {
        console.error("Cloudinary upload error:", error);
        return res.status(500).json({ error: "Failed to upload file to Cloudinary: " + (error.message || JSON.stringify(error)) });
      }
      const deliveryUrl = isImage
        ? result.secure_url
        : cloudinary.url(result.public_id, {
            resource_type: "raw",
            type: "upload",
            secure: true,
          });
      res.status(200).json({
        url: deliveryUrl,
        originalName: file.originalname,
        mimeType: file.mimetype,
        isImage,
      });
    }
  );

  uploadStream.end(file.buffer);
});

router.use((err, _req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "File too large. Max size is 10MB." });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err.message === "Unsupported file type.") {
    return res.status(400).json({ error: err.message });
  }
  return next(err);
});

module.exports = router;
