const crypto = require("crypto");
const Server = require("../models/Server");
const Message = require("../models/Message");
const User = require("../models/User");

const SERVER_COLORS = [
  "#5865F2",
  "#3BA55D",
  "#ED4245",
  "#FAA61A",
  "#EB459E",
  "#7289DA",
  "#2C2F33",
  "#5562ea",
  "#202225",
  "#ffffff",
];

const generateInviteCode = () => crypto.randomBytes(4).toString("hex");

// ─── Create Server ────────────────────────────────────────────────────────────
const createServer = async (req, res) => {
  const { name, iconUrl } = req.body;
  const userId = req.user.id;
  const username = req.user.username;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Server name is required" });
  }

  try {
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

    // System welcome message in general channel
    const welcomeMessage = new Message({
      serverId: newServer.id,
      channelId: newServer.channels[0].id,
      type: "system",
      content: `${username} created the server. Welcome!`,
    });
    await welcomeMessage.save();

    res.status(201).json({ message: "Server created", server: newServer });
  } catch (err) {
    console.error("createServer error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ─── Get My Servers ───────────────────────────────────────────────────────────
const getMyServers = async (req, res) => {
  const userId = req.user.id;

  try {
    const myServers = await Server.find({ members: userId });
    res.json(myServers);
  } catch (err) {
    console.error("getMyServers error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ─── Get Server ───────────────────────────────────────────────────────────────
const getServer = async (req, res) => {
  const id = Number(req.params.id);

  try {
    const server = await Server.findOne({ id });

    if (!server) {
      return res.status(404).json({ error: "Server not found" });
    }

    if (!server.members.includes(req.user.id)) {
      return res.status(403).json({ error: "You are not a member of this server" });
    }

    // Resolve member usernames
    const memberDocs = await User.find({ id: { $in: server.members } });

    const membersWithNames = server.members.map((memberId) => {
      const user = memberDocs.find((u) => u.id === memberId);
      return { id: memberId, username: user ? user.username : "Unknown", avatarUrl: user?.avatarUrl || null };
    });

    res.json({ ...server.toObject(), membersData: membersWithNames });
  } catch (err) {
    console.error("getServer error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ─── Delete Server ────────────────────────────────────────────────────────────
const deleteServer = async (req, res) => {
  const id = Number(req.params.id);

  try {
    const server = await Server.findOne({ id });

    if (!server) {
      return res.status(404).json({ error: "Server not found" });
    }

    if (server.ownerId !== req.user.id) {
      return res.status(403).json({ error: "Only the server owner can delete it" });
    }

    await Server.deleteOne({ id });
    await Message.deleteMany({ serverId: id });

    res.json({ message: "Server deleted" });
  } catch (err) {
    console.error("deleteServer error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ─── Create Channel ───────────────────────────────────────────────────────────
const createChannel = async (req, res) => {
  const id = Number(req.params.id);
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Channel name is required" });
  }

  try {
    const server = await Server.findOne({ id });

    if (!server) {
      return res.status(404).json({ error: "Server not found" });
    }

    if (server.ownerId !== req.user.id) {
      return res.status(403).json({ error: "Only the server owner can add channels" });
    }

    const newChannel = {
      id: `ch_${Date.now()}`,
      name: name.trim().toLowerCase().replace(/\s+/g, "-"),
      type: "text",
    };

    server.channels.push(newChannel);
    await server.save();

    res.status(201).json({ message: "Channel created", channel: newChannel });
  } catch (err) {
    console.error("createChannel error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ─── Delete Channel ───────────────────────────────────────────────────────────
const deleteChannel = async (req, res) => {
  const id = Number(req.params.id);
  const { channelId } = req.params;

  try {
    const server = await Server.findOne({ id });

    if (!server) {
      return res.status(404).json({ error: "Server not found" });
    }

    if (server.ownerId !== req.user.id) {
      return res.status(403).json({ error: "Only the server owner can delete channels" });
    }

    const channelIndex = server.channels.findIndex((c) => c.id === channelId);
    if (channelIndex === -1) {
      return res.status(404).json({ error: "Channel not found" });
    }

    if (server.channels.length <= 1) {
      return res.status(400).json({ error: "Cannot delete the last channel" });
    }

    server.channels.splice(channelIndex, 1);
    await server.save();

    await Message.deleteMany({ channelId });

    res.json({ message: "Channel deleted" });
  } catch (err) {
    console.error("deleteChannel error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ─── Join Server (by ID) ──────────────────────────────────────────────────────
const joinServer = async (req, res) => {
  const id = Number(req.params.id);
  const userId = req.user.id;
  const username = req.user.username;

  try {
    const server = await Server.findOne({ id });

    if (!server) {
      return res.status(404).json({ error: "Server not found" });
    }

    if (server.members.includes(userId)) {
      return res.status(400).json({ error: "You are already a member" });
    }

    server.members.push(userId);
    await server.save();

    const generalChannel = server.channels[0];
    if (generalChannel) {
      const joinMsg = new Message({
        serverId: server.id,
        channelId: generalChannel.id,
        type: "system",
        content: `${username} joined the server. Welcome!`,
      });
      await joinMsg.save();
    }

    res.json({ message: "Joined server successfully", server });
  } catch (err) {
    console.error("joinServer error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ─── Get Server by Invite Code ────────────────────────────────────────────────
const getServerByInvite = async (req, res) => {
  const { code } = req.params;

  try {
    const server = await Server.findOne({ inviteCode: code });

    if (!server) {
      return res.status(404).json({ error: "Invalid invite code" });
    }

    res.json({
      id: server.id,
      name: server.name,
      inviteCode: server.inviteCode,
      memberCount: server.members.length,
    });
  } catch (err) {
    console.error("getServerByInvite error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ─── Join by Invite Code ──────────────────────────────────────────────────────
const joinByInvite = async (req, res) => {
  const { code } = req.params;
  const userId = req.user.id;
  const username = req.user.username;

  try {
    const server = await Server.findOne({ inviteCode: code });

    if (!server) {
      return res.status(404).json({ error: "Invalid invite link" });
    }

    if (server.members.includes(userId)) {
      return res.json({ message: "Already a member", server, alreadyMember: true });
    }

    server.members.push(userId);
    await server.save();

    const generalChannel = server.channels[0];
    if (generalChannel) {
      const joinMsg = new Message({
        serverId: server.id,
        channelId: generalChannel.id,
        type: "system",
        content: `${username} joined the server. Welcome!`,
      });
      await joinMsg.save();
    }

    res.json({ message: "Joined server successfully", server });
  } catch (err) {
    console.error("joinByInvite error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ─── Leave Server ─────────────────────────────────────────────────────────────
const leaveServer = async (req, res) => {
  const id = Number(req.params.id);
  const userId = req.user.id;

  try {
    const server = await Server.findOne({ id });

    if (!server) {
      return res.status(404).json({ error: "Server not found" });
    }

    if (!server.members.includes(userId)) {
      return res.status(400).json({ error: "You are not a member" });
    }

    if (server.ownerId === userId) {
      return res.status(400).json({ error: "Server owner cannot leave. Delete the server instead." });
    }

    server.members = server.members.filter(m => m !== userId);
    await server.save();

    const generalChannel = server.channels[0];
    if (generalChannel) {
      const leaveMsg = new Message({
        serverId: server.id,
        channelId: generalChannel.id,
        type: "system",
        content: `${req.user.username} left the server.`,
      });
      await leaveMsg.save();
    }

    res.json({ message: "Left server successfully" });
  } catch (err) {
    console.error("leaveServer error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ─── Get Channel Messages ─────────────────────────────────────────────────────
const getChannelMessages = async (req, res) => {
  const id = Number(req.params.id);
  const { channelId } = req.params;

  try {
    const server = await Server.findOne({ id });

    if (!server) {
      return res.status(404).json({ error: "Server not found" });
    }

    if (!server.members.includes(req.user.id)) {
      return res.status(403).json({ error: "You are not a member of this server" });
    }

    const channelMessages = await Message.find({ serverId: id, channelId }).sort({ timestamp: 1 });

    // Resolve current usernames so name changes are reflected
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
  } catch (err) {
    console.error("getChannelMessages error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ─── Post Message ─────────────────────────────────────────────────────────────
const postMessage = async (req, res) => {
  const id = Number(req.params.id);
  const { channelId } = req.params;
  const { content, attachmentUrl } = req.body;

  if ((!content || !content.trim()) && !attachmentUrl) {
    return res.status(400).json({ error: "Message content or attachment is required" });
  }

  try {
    const server = await Server.findOne({ id });

    if (!server) {
      return res.status(404).json({ error: "Server not found" });
    }

    if (!server.members.includes(req.user.id)) {
      return res.status(403).json({ error: "You are not a member of this server" });
    }

    const channel = server.channels.find((c) => c.id === channelId);
    if (!channel) {
      return res.status(404).json({ error: "Channel not found" });
    }

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
    res.status(201).json(newMessage);
  } catch (err) {
    console.error("postMessage error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  createServer,
  getMyServers,
  getServer,
  deleteServer,
  createChannel,
  deleteChannel,
  joinServer,
  leaveServer,
  getChannelMessages,
  postMessage,
  getServerByInvite,
  joinByInvite,
};