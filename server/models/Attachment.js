const mongoose = require("mongoose");

/**
 * Stores metadata for every file uploaded via the /api/upload endpoint.
 * Cloudinary is the actual storage backend; this record lets us track,
 * audit, and (optionally) delete assets later.
 */
const attachmentSchema = new mongoose.Schema(
  {
    publicId: {
      type: String,
      required: true, // Cloudinary public_id — needed to delete the asset
    },
    url: {
      type: String,
      required: true, // Cloudinary secure_url returned after upload
    },
    originalName: {
      type: String,
      default: "file",
    },
    mimeType: {
      type: String,
      default: "application/octet-stream",
    },
    size: {
      type: Number,
      default: 0, // bytes
    },
    resourceType: {
      type: String,
      enum: ["image", "video", "raw"],
      default: "raw",
    },
    uploadedBy: {
      type: Number, // matches User.id (numeric)
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Attachment", attachmentSchema);
