const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  id: {
    type: Number,
    default: () => Date.now(),
    unique: true,
  },
  serverId: {
    type: Number,
    required: true,
  },
  channelId: {
    type: String,
    required: true,
  },
  authorId: {
    type: Number,
  },
  authorName: {
    type: String,
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
<<<<<<< HEAD
    default: null,
  },
  attachmentMimeType: {
    type: String,
    default: null,
=======
    default: null, // original filename (e.g. "report.pdf")
  },
  attachmentSize: {
    type: Number,
    default: null, // bytes
  },
  attachmentType: {
    type: String,
    enum: ["image", "video", "raw"],
    default: null, // drives client-side rendering — null means no attachment
>>>>>>> 4b1e7ad76bed14de00ffc268ba9d781e4f1209d1
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
}, { timestamps: true });

module.exports = mongoose.model("Message", messageSchema);
