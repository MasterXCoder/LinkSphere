const mongoose = require("mongoose");

const directMessageSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      default: () => Date.now(),
      unique: true,
    },
    participants: {
      type: [Number],
      required: true,
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length === 2 && arr[0] !== arr[1],
        message: "participants must contain exactly two different user ids",
      },
    },
    senderId: {
      type: Number,
      required: true,
    },
    content: {
      type: String,
      default: "",
    },
    attachmentUrl: {
      type: String,
      default: null,
    },
    attachmentName: {
      type: String,
      default: null,
    },
    attachmentMimeType: {
      type: String,
      default: null,
    },
    type: {
      type: String,
      enum: ["user", "system"],
      default: "user",
    },
    systemKind: {
      type: String,
      enum: ["generic", "call_started"],
      default: "generic",
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

directMessageSchema.index({ participants: 1, timestamp: 1 });

module.exports = mongoose.model("DirectMessage", directMessageSchema);
