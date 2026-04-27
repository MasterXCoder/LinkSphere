const crypto = require("crypto");
const Server = require("../models/Server");
const Message = require("../models/Message");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const catchAsync = require("../utils/catchAsync");
const { deleteImage } = require("../utils/cloudinaryHelper");

const SERVER_COLORS = [
  "#5865F2", "#3BA55D", "#ED4245", "#FAA61A", "#EB459E", 
  "#7289DA", "#2C2F33", "#5562ea", "#202225", "#ffffff",
];

const generateInviteCode = () => crypto.randomBytes(4).toString("hex");

// ─── Create Server ────────────────────────────────────────────────────────────
const createServer = catchAsync(async (req, res) => {
  const { name, iconUrl } = req.body;
  const userId = req.user.id;
  const username = req.user.username;

  // Note: name & iconUrl validated by Zod middleware (createServerSchema)

  const randomColor = SERVER_COLORS[Math.floor(Math.random() * SERVER_COLORS.length)];
  const now = Date.now();

  const newServer = new Server({
    id: now,
    name: name.trim(),
    iconUrl: iconUrl || null,
    inviteCode: generateInviteCode(),
    ownerId: userId,
    members: [userId],
    color: randomColor,
    channels: [
      { id: `ch_${now}_1`, name: "general", type: "text" },
      { id: `ch_${now}_2`, name: "random",  type: "text" },
    ],
  });

  await newServer.save();

  const welcomeMessage = new Message({
    serverId: newServer.id,
    channelId: newServer.channels[0].id,
    type: "system",
    content: `${username} created the server. Welcome!`,
  });
  await welcomeMessage.save();

  res.status(201).json({ message: "Server created", server: newServer });
});

// ─── Get My Servers ───────────────────────────────────────────────────────────
const getMyServers = catchAsync(async (req, res) => {
  const myServers = await Server.find({ members: req.user.id });
  res.json(myServers);
});

// ─── Get Server ───────────────────────────────────────────────────────────────
const getServer = catchAsync(async (req, res) => {
  const id = Number(req.params.id);
  const server = await Server.findOne({ id });

  if (!server) throw new ApiError(404, "Server not found");
  if (!server.members.includes(req.user.id)) throw new ApiError(403, "Not a member");

  const memberDocs = await User.find({ id: { $in: server.members } });
  const membersWithNames = server.members.map((memberId) => {
    const user = memberDocs.find((u) => u.id === memberId);
    return { id: memberId, username: user ? user.username : "Unknown", avatarUrl: user?.avatarUrl || null, socketId: user?.socketId || null };
  });

  res.json({ ...server.toObject(), membersData: membersWithNames });
});

// ─── Delete Server ────────────────────────────────────────────────────────────
const deleteServer = catchAsync(async (req, res) => {
  const id = Number(req.params.id);
  const server = await Server.findOne({ id });

  if (!server) throw new ApiError(404, "Server not found");
  if (server.ownerId !== req.user.id) throw new ApiError(403, "Only owner can delete");

  // Cleanup Cloudinary icon if it exists
  await deleteImage(server.iconUrl);

  await Server.deleteOne({ id });
  await Message.deleteMany({ serverId: id });

  res.json({ message: "Server deleted" });
});

// ─── Update Server ────────────────────────────────────────────────────────────
const updateServer = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { name, iconUrl } = req.body;
  const userId = req.user.id;

  const server = await Server.findOne({ id });
  if (!server) throw new ApiError(404, "Server not found");
  if (server.ownerId !== userId) throw new ApiError(403, "Forbidden");

  // If icon is being updated and an old one exists, delete the old one from Cloudinary
  if (iconUrl !== undefined && iconUrl !== server.iconUrl) {
    await deleteImage(server.iconUrl);
    server.iconUrl = iconUrl;
  }

  if (name) server.name = name.trim();
  await server.save();

  res.json({ message: "Server updated successfully", server });
});

// ─── Create Channel ───────────────────────────────────────────────────────────
const createChannel = catchAsync(async (req, res) => {
  const id = Number(req.params.id);
  const { name, type = "text" } = req.body;

  // Note: name validated by Zod middleware (createChannelSchema)

  const server = await Server.findOne({ id });
  if (!server) throw new ApiError(404, "Server not found");
  if (server.ownerId !== req.user.id) throw new ApiError(403, "Forbidden");

  const newChannel = {
    id: `ch_${Date.now()}`,
    name: name.trim().toLowerCase().replace(/\s+/g, "-"),
    type: type,
  };

  server.channels.push(newChannel);
  await server.save();

  res.status(201).json({ message: "Channel created", channel: newChannel });
});

// ─── Delete Channel ───────────────────────────────────────────────────────────
const deleteChannel = catchAsync(async (req, res) => {
  const id = Number(req.params.id);
  const { channelId } = req.params;

  const server = await Server.findOne({ id });
  if (!server) throw new ApiError(404, "Server not found");
  if (server.ownerId !== req.user.id) throw new ApiError(403, "Forbidden");

  const channelIndex = server.channels.findIndex((c) => c.id === channelId);
  if (channelIndex === -1) throw new ApiError(404, "Channel not found");
  if (server.channels.length <= 1) throw new ApiError(400, "Cannot delete last channel");

  server.channels.splice(channelIndex, 1);
  await server.save();
  await Message.deleteMany({ channelId });

  res.json({ message: "Channel deleted" });
});

// ─── Join Server ──────────────────────────────────────────────────────────────
const joinServer = catchAsync(async (req, res) => {
  const id = Number(req.params.id);
  const { id: userId, username } = req.user;

  const server = await Server.findOne({ id });
  if (!server) throw new ApiError(404, "Server not found");
  if (server.members.includes(userId)) throw new ApiError(400, "Already a member");

  server.members.push(userId);
  await server.save();

  if (server.channels[0]) {
    const welcomeMsg = new Message({
      serverId: server.id,
      channelId: server.channels[0].id,
      type: "system",
      content: `${username} joined the server. Welcome!`,
    });
    await welcomeMsg.save();

    const io = req.app.get("io");
    if (io) {
      io.to(server.channels[0].id).emit("new_message", welcomeMsg.toObject());
    }
  }

  res.json({ message: "Joined server successfully", server });
});

// ─── Get Server by Invite ─────────────────────────────────────────────────────
const getServerByInvite = catchAsync(async (req, res) => {
  const server = await Server.findOne({ inviteCode: req.params.code });
  if (!server) throw new ApiError(404, "Invalid invite code");

  res.json({
    id: server.id,
    name: server.name,
    inviteCode: server.inviteCode,
    memberCount: server.members.length,
  });
});

// ─── Join by Invite ───────────────────────────────────────────────────────────
const joinByInvite = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const server = await Server.findOne({ inviteCode: req.params.code });

  if (!server) throw new ApiError(404, "Invalid invite link");
  if (server.members.includes(userId)) {
    return res.json({ message: "Already a member", server, alreadyMember: true });
  }

  server.members.push(userId);
  await server.save();

  if (server.channels[0]) {
    const welcomeMsg = new Message({
      serverId: server.id,
      channelId: server.channels[0].id,
      type: "system",
      content: `${req.user.username} joined the server. Welcome!`,
    });
    await welcomeMsg.save();

    const io = req.app.get("io");
    if (io) {
      io.to(server.channels[0].id).emit("new_message", welcomeMsg.toObject());
    }
  }

  res.json({ message: "Joined server successfully", server });
});

// ─── Leave Server ─────────────────────────────────────────────────────────────
const leaveServer = catchAsync(async (req, res) => {
  const id = Number(req.params.id);
  const userId = req.user.id;

  const server = await Server.findOne({ id });
  if (!server) throw new ApiError(404, "Server not found");
  if (!server.members.includes(userId)) throw new ApiError(400, "Not a member");
  if (server.ownerId === userId) throw new ApiError(400, "Owner cannot leave");

  server.members = server.members.filter(m => m !== userId);
  await server.save();

  if (server.channels[0]) {
    const leaveMsg = new Message({
      serverId: server.id,
      channelId: server.channels[0].id,
      type: "system",
      content: `${req.user.username} left the server.`,
    });
    await leaveMsg.save();

    const io = req.app.get("io");
    if (io) {
      io.to(server.channels[0].id).emit("new_message", leaveMsg.toObject());
    }
  }

  res.json({ message: "Left server successfully" });
});

// ─── Get Channel Messages ─────────────────────────────────────────────────────
const getChannelMessages = catchAsync(async (req, res) => {
  const id = Number(req.params.id);
  const { channelId } = req.params;

  const server = await Server.findOne({ id });
  if (!server) throw new ApiError(404, "Server not found");
  if (!server.members.includes(req.user.id)) throw new ApiError(403, "Forbidden");

  const channelMessages = await Message.find({ serverId: id, channelId }).sort({ timestamp: 1 });
  const authorIds = [...new Set(channelMessages.map((m) => m.authorId).filter(Boolean))];
  const authorDocs = await User.find({ id: { $in: authorIds } });

  const messagesWithCurrentNames = channelMessages.map((msg) => {
    const msgObj = msg.toObject();
    if (msgObj.type === "system") return msgObj;
    const author = authorDocs.find((u) => u.id === msgObj.authorId);
    return { 
        ...msgObj, 
        authorName: author ? author.username : msgObj.authorName,
        authorAvatarUrl: author?.avatarUrl || null
    };
  });

  res.json(messagesWithCurrentNames);
});

// ─── Post Message ─────────────────────────────────────────────────────────────
const postMessage = catchAsync(async (req, res) => {
  const id = Number(req.params.id);
  const { channelId } = req.params;
  const { content, attachmentUrl } = req.body;

  // Note: content/attachmentUrl combo validated by Zod middleware (postMessageSchema)

  const server = await Server.findOne({ id });
  if (!server) throw new ApiError(404, "Server not found");
  if (!server.members.includes(req.user.id)) throw new ApiError(403, "Forbidden");

  const channel = server.channels.find((c) => c.id === channelId);
  if (!channel) throw new ApiError(404, "Channel not found");

  const newMessage = new Message({
    serverId: id,
    channelId,
    authorId: req.user.id,
    authorName: req.user.username,
    content: content ? content.trim() : "",
    attachmentUrl: attachmentUrl || null,
    type: "user",
  });

  await newMessage.save();

  const io = req.app.get("io");
  if (io) {
    const author = await User.findOne({ id: req.user.id });
    const msgObj = newMessage.toObject();
    const emitPayload = {
      ...msgObj,
      authorName: author ? author.username : msgObj.authorName,
      authorAvatarUrl: author?.avatarUrl || null
    };
    io.to(channelId).emit("new_message", emitPayload);
  }

  res.status(201).json(newMessage);
});

module.exports = {
  createServer,
  getMyServers,
  getServer,
  deleteServer,
  updateServer,
  createChannel,
  deleteChannel,
  joinServer,
  leaveServer,
  getChannelMessages,
  postMessage,
  getServerByInvite,
  joinByInvite,
};