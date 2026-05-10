const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const verifyToken = require("../middleware/authMiddleware");
const Attachment = require("../models/Attachment");

const router = express.Router();

// ── Cloudinary config ─────────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Multer: memory storage, 25 MB limit, all file types ──────────────────────
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
});

/**
 * Derive the Cloudinary resource_type from a MIME type.
 * - image/* → "image"
 * - video/* → "video"
 * - everything else → "raw"  (PDFs, docs, zips, etc.)
 */
function getResourceType(mimeType = "") {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  return "raw";
}

// ── POST /api/upload ──────────────────────────────────────────────────────────
// Requires: Bearer token (JWT).
// Body:      multipart/form-data with field "file".
// Returns:   { url, publicId, originalName, mimeType, size, resourceType }
router.post("/", verifyToken, upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file provided." });
  }

  const mimeType    = req.file.mimetype || "application/octet-stream";
  const resourceType = getResourceType(mimeType);
  const originalName = req.file.originalname || "file";

  try {
    // Upload to Cloudinary via stream
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder:          "linksphere/files",
          resource_type:   resourceType, // "image", "video", or "raw"
          type:            "upload",      // ensures public delivery URL
          access_mode:     "public",      // explicitly public — accessible by anyone with the URL
          use_filename:    false,
          unique_filename: true,
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    // Persist metadata to MongoDB
    const attachment = await Attachment.create({
      publicId:     result.public_id,
      url:          result.secure_url,
      originalName,
      mimeType,
      size:         req.file.size,
      resourceType,
      uploadedBy:   req.user?.id ?? null,
    });

    return res.status(200).json({
      url:          attachment.url,
      publicId:     attachment.publicId,
      originalName: attachment.originalName,
      mimeType:     attachment.mimeType,
      size:         attachment.size,
      resourceType: attachment.resourceType,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return res.status(500).json({
      error: "Upload failed: " + (err.message || "Unknown error"),
    });
  }
});

module.exports = router;
