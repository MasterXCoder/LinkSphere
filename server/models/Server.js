const mongoose = require("mongoose");

const channelSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    default: "text",
  },
});

const serverSchema = new mongoose.Schema({
  id: {
    type: Number,
    default: () => Date.now(),
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  inviteCode: {
    type: String,
    required: true,
    unique: true,
  },
  ownerId: {
    type: Number, // Keeping as Number for now to match current logic
    required: true,
  },
  members: [{
    type: Number,
  }],
  color: {
    type: String,
    default: "#7289DA",
  },
  channels: [channelSchema],
}, { timestamps: true });

module.exports = mongoose.model("Server", serverSchema);
