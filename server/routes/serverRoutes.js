// Server Routes
// All routes are JWT-protected via verifyToken middleware

const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const {
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
} = require("../controllers/serverController");

// ── Invite Links (must be BEFORE /:id routes) ────────────────────────────────
router.get("/invite/:code", verifyToken, getServerByInvite);
router.post("/invite/:code/join", verifyToken, joinByInvite);

// ── Server CRUD ───────────────────────────────────────────────────────────────
router.post("/", verifyToken, createServer);
router.get("/mine", verifyToken, getMyServers);
router.get("/:id", verifyToken, getServer);
router.delete("/:id", verifyToken, deleteServer);

// ── Channels ──────────────────────────────────────────────────────────────────
router.post("/:id/channels", verifyToken, createChannel);
router.delete("/:id/channels/:channelId", verifyToken, deleteChannel);

// ── Join / Leave ──────────────────────────────────────────────────────────────
router.post("/:id/join", verifyToken, joinServer);
router.post("/:id/leave", verifyToken, leaveServer);

// ── Messages ──────────────────────────────────────────────────────────────────
router.get("/:id/channels/:channelId/messages", verifyToken, getChannelMessages);
router.post("/:id/channels/:channelId/messages", verifyToken, postMessage);

module.exports = router;
