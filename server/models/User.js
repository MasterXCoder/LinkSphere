const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  id: {
    type: Number,
    default: () => Date.now(),
    unique: true,
  },
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    default: null,
  },
  dob: {
    type: Date,
    default: null,
  },
  googleId: {
    type: String,
  },
  avatarUrl: {
    type: String,
    default: null,
  },
  socketId: {
    type: String,
    default: null,
  },
  friends: [{
    type: Number,
  }],
  friendRequests: [{
    fromId: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
}, { timestamps: true });

userSchema.index(
  { googleId: 1 },
  {
    unique: true,
    partialFilterExpression: { googleId: { $type: "string" } },
  }
);

module.exports = mongoose.model("User", userSchema);
