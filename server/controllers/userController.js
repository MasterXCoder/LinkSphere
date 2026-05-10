const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const catchAsync = require("../utils/catchAsync");
const { deleteImage } = require("../utils/cloudinaryHelper");

const SECRET = process.env.JWT_SECRET || "fallback-secret";

// ─── Signup ───────────────────────────────────────────────────────────────────
const signup = catchAsync(async (req, res) => {
  const { username, email, password, dob } = req.body;
  // Note: presence & format validated by Zod middleware (signupSchema)

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(400, "User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = new User({
    username,
    email,
    dob,
    password: hashedPassword,
  });

  await newUser.save();
  res.status(201).json({ message: "Account created successfully" });
});

// ─── Login ────────────────────────────────────────────────────────────────────
const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  // Note: presence & format validated by Zod middleware (loginSchema)

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Guard: if user signed up via Google and hasn't set a password yet
  if (user.googleId && !user.password) {
    throw new ApiError(400, "No password set. Please add a password in Settings first.");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new ApiError(401, "Invalid credentials");
  }

  const token = jwt.sign(
    { id: user.id, username: user.username },
    SECRET,
    { expiresIn: "1h" }
  );

  res.status(200).json({
    message: "Login successful",
    token,
    user: { id: user.id, username: user.username, email: user.email, dob: user.dob, hasPassword: !!user.password, avatarUrl: user.avatarUrl },
  });
});

// ─── Get User ─────────────────────────────────────────────────────────────────
const getUser = catchAsync(async (req, res) => {
  const id = Number(req.params.id);
  const user = await User.findOne({ id });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  res.status(200).json({
    id: user.id,
    username: user.username,
    email: user.email,
    dob: user.dob,
    hasPassword: !!user.password,
    avatarUrl: user.avatarUrl,
  });
});

// ─── Update User ──────────────────────────────────────────────────────────────
const updateUser = catchAsync(async (req, res) => {
  const id = Number(req.params.id);

  if (req.user.id != id) {
    throw new ApiError(403, "Unauthorized action");
  }

  const { username, email, password, dob, avatarUrl } = req.body;

  const user = await User.findOne({ id });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // If avatar is being updated and an old one exists, cleanup Cloudinary
  if (avatarUrl !== undefined && avatarUrl !== user.avatarUrl) {
    await deleteImage(user.avatarUrl);
    user.avatarUrl = avatarUrl;
  }

  if (username) user.username = username;
  if (email) user.email = email;
  if (password) user.password = await bcrypt.hash(password, 10);
  if (dob) user.dob = dob;

  await user.save();

  res.status(200).json({
    message: "User updated successfully",
    user: { id: user.id, username: user.username, email: user.email, dob: user.dob, hasPassword: !!user.password, avatarUrl: user.avatarUrl },
  });
});

// ─── Delete User ──────────────────────────────────────────────────────────────
const deleteUser = catchAsync(async (req, res) => {
  const id = Number(req.params.id);

  if (req.user.id != id) {
    throw new ApiError(403, "You can only delete your own account");
  }

  const user = await User.findOne({ id });
  if (user) {
    await deleteImage(user.avatarUrl);
  }

  const result = await User.deleteOne({ id });

  if (result.deletedCount === 0) {
    throw new ApiError(404, "User not found");
  }

  res.status(200).json({ message: "Account deleted successfully" });
});

// ─── Friend System ────────────────────────────────────────────────────────────
const sendFriendRequest = catchAsync(async (req, res) => {
  const { username } = req.body;
  const currentUserId = req.user.id || req.user._id || req.user.userId;

  if (!currentUserId) {
    throw new ApiError(400, "Authentication error: Missing user ID in token");
  }

  if (!username) {
    throw new ApiError(400, "Username is required");
  }

  const currentUser = await User.findOne({ id: currentUserId });
  const targetUser = await User.findOne({ username });

  if (!targetUser) {
    throw new ApiError(404, "User not found");
  }

  if (targetUser.id === currentUserId) {
    throw new ApiError(400, "You cannot send a friend request to yourself");
  }

  if (targetUser.friends && targetUser.friends.includes(currentUserId)) {
    throw new ApiError(400, "You are already friends with this user");
  }

  // Check if target user already has a pending request from current user
  const existingRequest = targetUser.friendRequests && targetUser.friendRequests.find(r => r.fromId === currentUserId && r.status === 'pending');
  if (existingRequest) {
    throw new ApiError(400, "Friend request already sent");
  }

  // Add friend request to target user
  if (!targetUser.friendRequests) targetUser.friendRequests = [];
  targetUser.friendRequests.push({ fromId: currentUserId, status: 'pending' });
  await targetUser.save();

  // Socket notification will be handled in the route or controller later if we have socket instance
  // For now we can use req.app.get('io') to emit
  const io = req.app.get("io");
  if (io) {
    // We emit to the target user's rooms (userId is used as room or we broadcast to their socket directly if mapped)
    // Looking at server.js, users aren't joining rooms by userId, but we can emit to specific socketId.
    // Actually, we can just emit an event, but `server.js` manages `userSockets`. We'll broadcast `friend-request-received` and the client will filter, OR we can emit globally and let clients filter.
    io.emit('friend-request-received', { targetUserId: targetUser.id, fromUser: { id: currentUser.id, username: currentUser.username, avatarUrl: currentUser.avatarUrl } });
  }

  res.status(200).json({ message: "Friend request sent" });
});

const acceptFriendRequest = catchAsync(async (req, res) => {
  const { fromId } = req.body;
  const currentUserId = req.user.id || req.user._id || req.user.userId;

  const currentUser = await User.findOne({ id: currentUserId });
  const fromUser = await User.findOne({ id: fromId });

  if (!fromUser) {
    throw new ApiError(404, "User not found");
  }

  // Find the pending request
  const requestIndex = currentUser.friendRequests.findIndex(r => r.fromId === fromId && r.status === 'pending');
  if (requestIndex === -1) {
    throw new ApiError(400, "No pending friend request found");
  }

  // Update status
  currentUser.friendRequests[requestIndex].status = 'accepted';

  // Add to friends lists
  if (!currentUser.friends.includes(fromId)) currentUser.friends.push(fromId);
  if (!fromUser.friends.includes(currentUserId)) fromUser.friends.push(currentUserId);

  await currentUser.save();
  await fromUser.save();

  const io = req.app.get("io");
  if (io) {
    io.emit('friend-request-accepted', {
      targetUserId: fromId,
      fromUser: { id: currentUser.id, username: currentUser.username, avatarUrl: currentUser.avatarUrl }
    });
  }

  res.status(200).json({ message: "Friend request accepted" });
});

const rejectFriendRequest = catchAsync(async (req, res) => {
  const { fromId } = req.body;
  const currentUserId = req.user.id || req.user._id || req.user.userId;

  const currentUser = await User.findOne({ id: currentUserId });

  // Find the pending request
  const requestIndex = currentUser.friendRequests.findIndex(r => r.fromId === fromId && r.status === 'pending');
  if (requestIndex === -1) {
    throw new ApiError(400, "No pending friend request found");
  }

  // Update status or remove it. Let's just remove it or set to rejected
  currentUser.friendRequests[requestIndex].status = 'rejected';
  await currentUser.save();

  res.status(200).json({ message: "Friend request rejected" });
});

const getFriendsAndRequests = catchAsync(async (req, res) => {
  const currentUserId = req.user.id || req.user._id || req.user.userId;
  const currentUser = await User.findOne({ id: currentUserId });

  if (!currentUser) throw new ApiError(404, "User not found");

  // Fetch friends details
  const friends = await User.find({ id: { $in: currentUser.friends || [] } }, 'id username avatarUrl');

  // Fetch pending requests details
  const pendingRequests = (currentUser.friendRequests || []).filter(r => r.status === 'pending');
  const fromIds = pendingRequests.map(r => r.fromId);

  const pendingUsers = await User.find({ id: { $in: fromIds } }, 'id username avatarUrl');

  const requests = pendingRequests.map(req => {
    const u = pendingUsers.find(user => user.id === req.fromId);
    return {
      fromId: req.fromId,
      username: u ? u.username : 'Unknown',
      avatarUrl: u ? u.avatarUrl : null,
      createdAt: req.createdAt
    };
  });

  res.status(200).json({ friends, friendRequests: requests });
});

module.exports = { signup, login, getUser, updateUser, deleteUser, sendFriendRequest, acceptFriendRequest, rejectFriendRequest, getFriendsAndRequests };