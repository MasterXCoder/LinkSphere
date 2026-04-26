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
    default: null,
    unique: true,
    sparse: true, // Allows multiple nulls but ensures uniqueness for non-null values
  },
  avatarUrl: {
    type: String,
    default: null,
  },
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
