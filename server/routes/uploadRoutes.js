const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const verifyToken = require("../middleware/authMiddleware");
<<<<<<< HEAD
=======
const Attachment = require("../models/Attachment");
>>>>>>> 4b1e7ad76bed14de00ffc268ba9d781e4f1209d1

const router = express.Router();

// ── Cloudinary config ─────────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Multer: memory storage, 25 MB limit, all file types ──────────────────────
const storage = multer.memoryStorage();
<<<<<<< HEAD
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
=======

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
>>>>>>> 4b1e7ad76bed14de00ffc268ba9d781e4f1209d1
});

module.exports = router;
