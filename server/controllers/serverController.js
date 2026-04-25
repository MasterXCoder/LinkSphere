const crypto = require("crypto");
const { getDB } = require("../database/db");

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
    const db = getDB();
    const randomColor = SERVER_COLORS[Math.floor(Math.random() * SERVER_COLORS.length)];
    const now = Date.now();

    const newServer = {
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
    };

    await db.collection("servers").insertOne(newServer);

    // System welcome message in general channel
    await db.collection("messages").insertOne({
      id: Date.now(),
      serverId: newServer.id,
      channelId: newServer.channels[0].id,
      type: "system",
      content: `${username} created the server. Welcome!`,
      timestamp: new Date().toISOString(),
    });

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
    const db = getDB();
    const myServers = await db.collection("servers").find({ members: userId }).toArray();
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
    const db = getDB();
    const server = await db.collection("servers").findOne({ id });

    if (!server) {
      return res.status(404).json({ error: "Server not found" });
    }

    if (!server.members.includes(req.user.id)) {
      return res.status(403).json({ error: "You are not a member of this server" });
    }

    // Resolve member usernames
    const memberDocs = await db
      .collection("users")
      .find({ id: { $in: server.members } })
      .toArray();

    const membersWithNames = server.members.map((memberId) => {
      const user = memberDocs.find((u) => u.id === memberId);
      return { id: memberId, username: user ? user.username : "Unknown", avatarUrl: user?.avatarUrl || null };
    });

    res.json({ ...server, membersData: membersWithNames });
  } catch (err) {
    console.error("getServer error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ─── Delete Server ────────────────────────────────────────────────────────────
const deleteServer = async (req, res) => {
  const id = Number(req.params.id);

  try {
    const db = getDB();
    const server = await db.collection("servers").findOne({ id });

    if (!server) {
      return res.status(404).json({ error: "Server not found" });
    }

    if (server.ownerId !== req.user.id) {
      return res.status(403).json({ error: "Only the server owner can delete it" });
    }

    await db.collection("servers").deleteOne({ id });
    await db.collection("messages").deleteMany({ serverId: id });

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
    const db = getDB();
    const server = await db.collection("servers").findOne({ id });

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

    await db.collection("servers").updateOne({ id }, { $push: { channels: newChannel } });

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
    const db = getDB();
    const server = await db.collection("servers").findOne({ id });

    if (!server) {
      return res.status(404).json({ error: "Server not found" });
    }

    if (server.ownerId !== req.user.id) {
      return res.status(403).json({ error: "Only the server owner can delete channels" });
    }

    const channelExists = server.channels.find((c) => c.id === channelId);
    if (!channelExists) {
      return res.status(404).json({ error: "Channel not found" });
    }

    if (server.channels.length <= 1) {
      return res.status(400).json({ error: "Cannot delete the last channel" });
    }

    await db.collection("servers").updateOne(
      { id },
      { $pull: { channels: { id: channelId } } }
    );

    await db.collection("messages").deleteMany({ channelId });

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
    const db = getDB();
    const server = await db.collection("servers").findOne({ id });

    if (!server) {
      return res.status(404).json({ error: "Server not found" });
    }

    if (server.members.includes(userId)) {
      return res.status(400).json({ error: "You are already a member" });
    }

    await db.collection("servers").updateOne({ id }, { $push: { members: userId } });

    const generalChannel = server.channels[0];
    if (generalChannel) {
      await db.collection("messages").insertOne({
        id: Date.now(),
        serverId: server.id,
        channelId: generalChannel.id,
        type: "system",
        content: `${username} joined the server. Welcome!`,
        timestamp: new Date().toISOString(),
      });
    }

    const updated = await db.collection("servers").findOne({ id });
    res.json({ message: "Joined server successfully", server: updated });
  } catch (err) {
    console.error("joinServer error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ─── Get Server by Invite Code ────────────────────────────────────────────────
const getServerByInvite = async (req, res) => {
  const { code } = req.params;

  try {
    const db = getDB();
    const server = await db.collection("servers").findOne({ inviteCode: code });

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
    const db = getDB();
    const server = await db.collection("servers").findOne({ inviteCode: code });

    if (!server) {
      return res.status(404).json({ error: "Invalid invite link" });
    }

    if (server.members.includes(userId)) {
      return res.json({ message: "Already a member", server, alreadyMember: true });
    }

    await db.collection("servers").updateOne(
      { inviteCode: code },
      { $push: { members: userId } }
    );

    const generalChannel = server.channels[0];
    if (generalChannel) {
      await db.collection("messages").insertOne({
        id: Date.now(),
        serverId: server.id,
        channelId: generalChannel.id,
        type: "system",
        content: `${username} joined the server. Welcome!`,
        timestamp: new Date().toISOString(),
      });
    }

    const updated = await db.collection("servers").findOne({ inviteCode: code });
    res.json({ message: "Joined server successfully", server: updated });
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
    const db = getDB();
    const server = await db.collection("servers").findOne({ id });

    if (!server) {
      return res.status(404).json({ error: "Server not found" });
    }

    if (!server.members.includes(userId)) {
      return res.status(400).json({ error: "You are not a member" });
    }

    if (server.ownerId === userId) {
      return res.status(400).json({ error: "Server owner cannot leave. Delete the server instead." });
    }

    await db.collection("servers").updateOne({ id }, { $pull: { members: userId } });

    const generalChannel = server.channels[0];
    if (generalChannel) {
      await db.collection("messages").insertOne({
        id: Date.now(),
        serverId: server.id,
        channelId: generalChannel.id,
        type: "system",
        content: `${req.user.username} left the server.`,
        timestamp: new Date().toISOString(),
      });
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
    const db = getDB();
    const server = await db.collection("servers").findOne({ id });

    if (!server) {
      return res.status(404).json({ error: "Server not found" });
    }

    if (!server.members.includes(req.user.id)) {
      return res.status(403).json({ error: "You are not a member of this server" });
    }

    const channelMessages = await db
      .collection("messages")
      .find({ serverId: id, channelId })
      .sort({ timestamp: 1 })
      .toArray();

    // Resolve current usernames so name changes are reflected
    const authorIds = [...new Set(channelMessages.map((m) => m.authorId).filter(Boolean))];
    const authorDocs = await db.collection("users").find({ id: { $in: authorIds } }).toArray();

    const messagesWithCurrentNames = channelMessages.map((msg) => {
      if (msg.type === "system") return msg;
      const author = authorDocs.find((u) => u.id === msg.authorId);
      return { 
          ...msg, 
          authorName: author ? author.username : msg.authorName,
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
  const { content } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ error: "Message content is required" });
  }

  try {
    const db = getDB();
    const server = await db.collection("servers").findOne({ id });

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

    const newMessage = {
      id: Date.now(),
      serverId: id,
      channelId,
      authorId: req.user.id,
      authorName: req.user.username,
      content: content.trim(),
      type: "user",
      timestamp: new Date().toISOString(),
    };

    await db.collection("messages").insertOne(newMessage);
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