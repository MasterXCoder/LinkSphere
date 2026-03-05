// Server Controller
// Handles server CRUD, channels, join/leave, messages
// Uses flat-file JSON storage (no database)

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const serversFilePath = path.join(__dirname, "../../data/servers.json");
const messagesFilePath = path.join(__dirname, "../../data/messages.json");
const usersFilePath = path.join(__dirname, "../../data/users.json");

// ─── File Helpers ────────────────────────────────────────────────────────────

const readJSON = (filePath) => {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, "[]");
    }
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
};

const writeJSON = (filePath, data) => {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

const getServers = () => readJSON(serversFilePath);
const saveServers = (s) => writeJSON(serversFilePath, s);
const getMessages = () => readJSON(messagesFilePath);
const saveMessages = (m) => writeJSON(messagesFilePath, m);
const getUsers = () => readJSON(usersFilePath);

// Generate a random 8-character invite code
const generateInviteCode = () => crypto.randomBytes(4).toString("hex");


// ─── Controllers ─────────────────────────────────────────────────────────────

// POST /api/servers — create a new server
const createServer = (req, res) => {
    const { name } = req.body;
    const userId = req.user.id;
    const username = req.user.username;

    if (!name || !name.trim()) {
        return res.status(400).json({ error: "Server name is required" });
    }

    const servers = getServers();

    const newServer = {
        id: Date.now(),
        name: name.trim(),
        inviteCode: generateInviteCode(),
        ownerId: userId,
        members: [userId],
        channels: [
            { id: `ch_${Date.now()}_1`, name: "general", type: "text" },
            { id: `ch_${Date.now()}_2`, name: "random", type: "text" },
        ],
    };

    servers.push(newServer);
    saveServers(servers);

    // Post system message in general
    const messages = getMessages();
    messages.push({
        id: Date.now(),
        serverId: newServer.id,
        channelId: newServer.channels[0].id,
        type: "system",
        content: `${username} created the server. Welcome!`,
        timestamp: new Date().toISOString(),
    });
    saveMessages(messages);

    res.status(201).json({ message: "Server created", server: newServer });
};


// GET /api/servers/mine — get all servers the user is a member of
const getMyServers = (req, res) => {
    const userId = req.user.id;
    const servers = getServers();
    const myServers = servers.filter((s) => s.members.includes(userId));
    res.json(myServers);
};


// GET /api/servers/:id — get full server data with member usernames
const getServer = (req, res) => {
    const { id } = req.params;
    const servers = getServers();
    const server = servers.find((s) => s.id == id);

    if (!server) {
        return res.status(404).json({ error: "Server not found" });
    }

    // Check if user is a member
    if (!server.members.includes(req.user.id)) {
        return res.status(403).json({ error: "You are not a member of this server" });
    }

    // Resolve member usernames
    const users = getUsers();
    const membersWithNames = server.members.map((memberId) => {
        const user = users.find((u) => u.id == memberId);
        return {
            id: memberId,
            username: user ? user.username : "Unknown",
        };
    });

    res.json({
        ...server,
        membersData: membersWithNames,
    });
};


// DELETE /api/servers/:id — owner-only delete
const deleteServer = (req, res) => {
    const { id } = req.params;
    const servers = getServers();
    const serverIndex = servers.findIndex((s) => s.id == id);

    if (serverIndex === -1) {
        return res.status(404).json({ error: "Server not found" });
    }

    if (servers[serverIndex].ownerId !== req.user.id) {
        return res.status(403).json({ error: "Only the server owner can delete it" });
    }

    const serverId = servers[serverIndex].id;
    servers.splice(serverIndex, 1);
    saveServers(servers);

    // Also delete all messages for this server
    const messages = getMessages();
    const filtered = messages.filter((m) => m.serverId != serverId);
    saveMessages(filtered);

    res.json({ message: "Server deleted" });
};


// POST /api/servers/:id/channels — owner adds a channel
const createChannel = (req, res) => {
    const { id } = req.params;
    const { name } = req.body;

    if (!name || !name.trim()) {
        return res.status(400).json({ error: "Channel name is required" });
    }

    const servers = getServers();
    const server = servers.find((s) => s.id == id);

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
    saveServers(servers);

    res.status(201).json({ message: "Channel created", channel: newChannel });
};


// DELETE /api/servers/:id/channels/:channelId — owner removes a channel
const deleteChannel = (req, res) => {
    const { id, channelId } = req.params;
    const servers = getServers();
    const server = servers.find((s) => s.id == id);

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

    // Don't allow deleting the last channel
    if (server.channels.length <= 1) {
        return res.status(400).json({ error: "Cannot delete the last channel" });
    }

    server.channels.splice(channelIndex, 1);
    saveServers(servers);

    // Delete messages for this channel
    const messages = getMessages();
    const filtered = messages.filter((m) => m.channelId !== channelId);
    saveMessages(filtered);

    res.json({ message: "Channel deleted" });
};


// POST /api/servers/:id/join — user joins a server
const joinServer = (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const username = req.user.username;

    const servers = getServers();
    const server = servers.find((s) => s.id == id);

    if (!server) {
        return res.status(404).json({ error: "Server not found" });
    }

    if (server.members.includes(userId)) {
        return res.status(400).json({ error: "You are already a member" });
    }

    server.members.push(userId);
    saveServers(servers);

    // Post system message in the general channel (first channel)
    const generalChannel = server.channels[0];
    if (generalChannel) {
        const messages = getMessages();
        messages.push({
            id: Date.now(),
            serverId: server.id,
            channelId: generalChannel.id,
            type: "system",
            content: `${username} joined the server. Welcome!`,
            timestamp: new Date().toISOString(),
        });
        saveMessages(messages);
    }

    res.json({ message: "Joined server successfully", server });
};


// GET /api/servers/invite/:code — preview a server by invite code (no auth required for preview)
const getServerByInvite = (req, res) => {
    const { code } = req.params;
    const servers = getServers();
    const server = servers.find((s) => s.inviteCode === code);

    if (!server) {
        return res.status(404).json({ error: "Invalid invite code" });
    }

    res.json({
        id: server.id,
        name: server.name,
        inviteCode: server.inviteCode,
        memberCount: server.members.length,
    });
};


// POST /api/servers/invite/:code/join — join a server by invite code
const joinByInvite = (req, res) => {
    const { code } = req.params;
    const userId = req.user.id;
    const username = req.user.username;

    const servers = getServers();
    const server = servers.find((s) => s.inviteCode === code);

    if (!server) {
        return res.status(404).json({ error: "Invalid invite link" });
    }

    if (server.members.includes(userId)) {
        return res.json({ message: "Already a member", server, alreadyMember: true });
    }

    server.members.push(userId);
    saveServers(servers);

    // Post system message in general channel
    const generalChannel = server.channels[0];
    if (generalChannel) {
        const messages = getMessages();
        messages.push({
            id: Date.now(),
            serverId: server.id,
            channelId: generalChannel.id,
            type: "system",
            content: `${username} joined the server. Welcome!`,
            timestamp: new Date().toISOString(),
        });
        saveMessages(messages);
    }

    res.json({ message: "Joined server successfully", server });
};


// POST /api/servers/:id/leave — user leaves a server
const leaveServer = (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const servers = getServers();
    const server = servers.find((s) => s.id == id);

    if (!server) {
        return res.status(404).json({ error: "Server not found" });
    }

    if (!server.members.includes(userId)) {
        return res.status(400).json({ error: "You are not a member" });
    }

    if (server.ownerId === userId) {
        return res.status(400).json({ error: "Server owner cannot leave. Delete the server instead." });
    }

    server.members = server.members.filter((m) => m !== userId);
    saveServers(servers);

    // Post system message
    const generalChannel = server.channels[0];
    if (generalChannel) {
        const messages = getMessages();
        messages.push({
            id: Date.now(),
            serverId: server.id,
            channelId: generalChannel.id,
            type: "system",
            content: `${req.user.username} left the server.`,
            timestamp: new Date().toISOString(),
        });
        saveMessages(messages);
    }

    res.json({ message: "Left server successfully" });
};


// GET /api/servers/:id/channels/:channelId/messages — get channel messages
const getChannelMessages = (req, res) => {
    const { id, channelId } = req.params;
    const servers = getServers();
    const server = servers.find((s) => s.id == id);

    if (!server) {
        return res.status(404).json({ error: "Server not found" });
    }

    if (!server.members.includes(req.user.id)) {
        return res.status(403).json({ error: "You are not a member of this server" });
    }

    const allMessages = getMessages();
    const channelMessages = allMessages.filter(
        (m) => m.serverId == id && m.channelId === channelId
    );

    // Resolve current usernames from users.json so name changes are reflected
    const users = getUsers();
    const messagesWithCurrentNames = channelMessages.map((msg) => {
        if (msg.type === "system") return msg;
        const author = users.find((u) => u.id === msg.authorId);
        return {
            ...msg,
            authorName: author ? author.username : msg.authorName,
        };
    });

    res.json(messagesWithCurrentNames);
};


// POST /api/servers/:id/channels/:channelId/messages — post a message
const postMessage = (req, res) => {
    const { id, channelId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
        return res.status(400).json({ error: "Message content is required" });
    }

    const servers = getServers();
    const server = servers.find((s) => s.id == id);

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

    const messages = getMessages();
    const newMessage = {
        id: Date.now(),
        serverId: Number(id),
        channelId,
        authorId: req.user.id,
        authorName: req.user.username,
        content: content.trim(),
        type: "user",
        timestamp: new Date().toISOString(),
    };

    messages.push(newMessage);
    saveMessages(messages);

    res.status(201).json(newMessage);
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
