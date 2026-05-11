const DirectMessage = require("../models/DirectMessage");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const catchAsync = require("../utils/catchAsync");

const normalizeParticipants = (a, b) => [Number(a), Number(b)].sort((x, y) => x - y);

const ensureFriendship = async (meId, otherId) => {
  const me = await User.findOne({ id: meId });
  const other = await User.findOne({ id: otherId });
  if (!me || !other) throw new ApiError(404, "User not found");
  if (!me.friends.includes(otherId) || !other.friends.includes(meId)) {
    throw new ApiError(403, "You can only message your friends");
  }
  return other;
};

// GET /api/dm/:friendId/messages
const getDirectMessages = catchAsync(async (req, res) => {
  const meId = req.user.id;
  const friendId = Number(req.params.friendId);
  if (!Number.isFinite(friendId)) throw new ApiError(400, "Invalid friend id");
  if (friendId === meId) throw new ApiError(400, "Cannot open DM with yourself");

  await ensureFriendship(meId, friendId);

  const participants = normalizeParticipants(meId, friendId);
  const dmMessages = await DirectMessage.find({ participants }).sort({ timestamp: 1 });

  res.status(200).json(dmMessages);
});

// POST /api/dm/:friendId/messages
const postDirectMessage = catchAsync(async (req, res) => {
  const meId = req.user.id;
  const friendId = Number(req.params.friendId);
  const { content, attachmentUrl, attachmentName, attachmentSize, attachmentType } = req.body || {};

  if (!Number.isFinite(friendId)) throw new ApiError(400, "Invalid friend id");
  if (friendId === meId) throw new ApiError(400, "Cannot message yourself");

  const trimmedContent = typeof content === "string" ? content.trim() : "";
  if (!trimmedContent && !attachmentUrl) {
    throw new ApiError(400, "Message content or attachment is required");
  }

  await ensureFriendship(meId, friendId);

  const newMessage = new DirectMessage({
    participants: normalizeParticipants(meId, friendId),
    senderId: meId,
    content: trimmedContent,
    attachmentUrl: attachmentUrl || null,
    attachmentName: attachmentName || null,
    attachmentSize: attachmentSize ?? null,
    attachmentType: attachmentType || null,
  });

  await newMessage.save();
  res.status(201).json(newMessage);
});

// POST /api/dm/:friendId/call-events
const postDmCallStartEvent = catchAsync(async (req, res) => {
  const meId = req.user.id;
  const friendId = Number(req.params.friendId);
  const { callType = "audio" } = req.body || {};

  if (!Number.isFinite(friendId)) throw new ApiError(400, "Invalid friend id");
  if (friendId === meId) throw new ApiError(400, "Cannot call yourself");

  await ensureFriendship(meId, friendId);

  const normalizedCallType = callType === "video" ? "video" : "audio";
  const newMessage = new DirectMessage({
    participants: normalizeParticipants(meId, friendId),
    senderId: meId, // The person who started the call
    type: "system",
    systemKind: "call_started",
    content: `${req.user.username} started a ${normalizedCallType} call.`,
  });

  await newMessage.save();
  res.status(201).json(newMessage);
});

module.exports = {
  getDirectMessages,
  postDirectMessage,
  postDmCallStartEvent,
};
