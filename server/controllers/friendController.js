const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const catchAsync = require("../utils/catchAsync");

// ─── Send Friend Request ───────────────────────────────────────────────────────
// POST /api/friends/request   { toUsername }
const sendRequest = catchAsync(async (req, res) => {
  const { toUsername } = req.body;
  const fromId = req.user.id; // injected by verifyToken

  if (!toUsername) throw new ApiError(400, "Username is required");

  // Find target user by username (case-insensitive)
  const toUser = await User.findOne({ username: { $regex: new RegExp(`^${toUsername}$`, "i") } });
  if (!toUser) throw new ApiError(404, "User not found");

  if (toUser.id === fromId) throw new ApiError(400, "You cannot add yourself");

  // Already friends?
  if (toUser.friends.includes(fromId)) throw new ApiError(400, "Already friends");

  // Request already sent?
  const alreadySent = toUser.friendRequests.some(r => r.from === fromId && r.status === "pending");
  if (alreadySent) throw new ApiError(400, "Friend request already sent");

  // They already sent us a request — auto-accept
  const fromUser = await User.findOne({ id: fromId });
  const theirRequest = fromUser.friendRequests.find(r => r.from === toUser.id && r.status === "pending");
  if (theirRequest) {
    theirRequest.status = "accepted";
    if (!fromUser.friends.includes(toUser.id)) fromUser.friends.push(toUser.id);
    if (!toUser.friends.includes(fromId)) toUser.friends.push(fromId);
    await fromUser.save();
    await toUser.save();
    return res.status(200).json({ message: "Friend request accepted (mutual)", autoAccepted: true });
  }

  // Add pending request to toUser
  toUser.friendRequests.push({ from: fromId, status: "pending" });
  await toUser.save();

  res.status(200).json({ message: "Friend request sent" });
});

// ─── Accept Friend Request ─────────────────────────────────────────────────────
// POST /api/friends/accept   { fromId }
const acceptRequest = catchAsync(async (req, res) => {
  const { fromId } = req.body;
  const meId = req.user.id;

  const me = await User.findOne({ id: meId });
  const them = await User.findOne({ id: Number(fromId) });

  if (!them) throw new ApiError(404, "User not found");

  const req_entry = me.friendRequests.find(r => r.from === Number(fromId) && r.status === "pending");
  if (!req_entry) throw new ApiError(400, "No pending friend request from this user");

  req_entry.status = "accepted";
  if (!me.friends.includes(Number(fromId))) me.friends.push(Number(fromId));
  if (!them.friends.includes(meId)) them.friends.push(meId);

  await me.save();
  await them.save();

  res.status(200).json({ message: "Friend request accepted" });
});

// ─── Decline / Cancel Friend Request ──────────────────────────────────────────
// POST /api/friends/decline   { fromId }
const declineRequest = catchAsync(async (req, res) => {
  const { fromId } = req.body;
  const meId = req.user.id;

  const me = await User.findOne({ id: meId });
  if (!me) throw new ApiError(404, "User not found");

  const before = me.friendRequests.length;
  me.friendRequests = me.friendRequests.filter(r => r.from !== Number(fromId));
  if (me.friendRequests.length === before) throw new ApiError(400, "No request found");

  await me.save();
  res.status(200).json({ message: "Friend request declined" });
});

// ─── Cancel outgoing request (sender cancels) ─────────────────────────────────
// POST /api/friends/cancel   { toId }
const cancelRequest = catchAsync(async (req, res) => {
  const { toId } = req.body;
  const meId = req.user.id;

  const them = await User.findOne({ id: Number(toId) });
  if (!them) throw new ApiError(404, "User not found");

  const before = them.friendRequests.length;
  them.friendRequests = them.friendRequests.filter(r => !(r.from === meId && r.status === "pending"));
  if (them.friendRequests.length === before) throw new ApiError(400, "No outgoing request found");

  await them.save();
  res.status(200).json({ message: "Friend request cancelled" });
});

// ─── Remove Friend ─────────────────────────────────────────────────────────────
// DELETE /api/friends/:friendId
const removeFriend = catchAsync(async (req, res) => {
  const meId = req.user.id;
  const friendId = Number(req.params.friendId);

  const me = await User.findOne({ id: meId });
  const them = await User.findOne({ id: friendId });

  if (!me || !them) throw new ApiError(404, "User not found");

  me.friends = me.friends.filter(id => id !== friendId);
  them.friends = them.friends.filter(id => id !== meId);

  // Also remove any accepted request entries
  me.friendRequests = me.friendRequests.filter(r => r.from !== friendId);
  them.friendRequests = them.friendRequests.filter(r => r.from !== meId);

  await me.save();
  await them.save();

  res.status(200).json({ message: "Friend removed" });
});

// ─── Get Friends + Pending Requests ────────────────────────────────────────────
// GET /api/friends
const getFriends = catchAsync(async (req, res) => {
  const meId = req.user.id;
  const me = await User.findOne({ id: meId });
  if (!me) throw new ApiError(404, "User not found");

  // Resolve friends into full user objects
  const friendUsers = await User.find({ id: { $in: me.friends } })
    .select("id username avatarUrl socketId");

  // Incoming pending requests — resolve sender info
  const incomingIds = me.friendRequests
    .filter(r => r.status === "pending")
    .map(r => r.from);

  const incomingUsers = await User.find({ id: { $in: incomingIds } })
    .select("id username avatarUrl");

  // Outgoing pending requests — find docs where MY id appears in their friendRequests
  const outgoingDocs = await User.find({
    "friendRequests": { $elemMatch: { from: meId, status: "pending" } }
  }).select("id username avatarUrl");

  res.status(200).json({
    friends: friendUsers.map(u => ({ id: u.id, username: u.username, avatarUrl: u.avatarUrl, socketId: u.socketId })),
    incoming: incomingUsers.map(u => ({ id: u.id, username: u.username, avatarUrl: u.avatarUrl })),
    outgoing: outgoingDocs.map(u => ({ id: u.id, username: u.username, avatarUrl: u.avatarUrl })),
  });
});

module.exports = { sendRequest, acceptRequest, declineRequest, cancelRequest, removeFriend, getFriends };
