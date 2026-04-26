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
  type: {
    type: String,
    enum: ["user", "system"],
    default: "user",
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

module.exports = mongoose.model("Message", messageSchema);
