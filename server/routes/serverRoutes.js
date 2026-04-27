// Server Routes
// All routes are JWT-protected via verifyToken middleware

const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const {
    createServerSchema,
    updateServerSchema,
    createChannelSchema,
    postMessageSchema,
} = require("../validations/serverSchemas");
const {
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
    postCallStartEvent,
    getServerByInvite,
    joinByInvite,
} = require("../controllers/serverController");

// ── Invite Links (must be BEFORE /:id routes) ────────────────────────────────
router.get ("/invite/:code",      verifyToken, getServerByInvite);
router.post("/invite/:code/join", verifyToken, joinByInvite);

// ── Server CRUD ───────────────────────────────────────────────────────────────
router.post  ("/",    verifyToken, validate(createServerSchema), createServer);
router.get   ("/mine",verifyToken, getMyServers);
router.get   ("/:id", verifyToken, getServer);
router.patch ("/:id", verifyToken, validate(updateServerSchema), updateServer);
router.delete("/:id", verifyToken, deleteServer);

// ── Channels ──────────────────────────────────────────────────────────────────
router.post  ("/:id/channels",             verifyToken, validate(createChannelSchema), createChannel);
router.delete("/:id/channels/:channelId",  verifyToken, deleteChannel);

// ── Join / Leave ──────────────────────────────────────────────────────────────
router.post("/:id/join",  verifyToken, joinServer);
router.post("/:id/leave", verifyToken, leaveServer);

// ── Messages ──────────────────────────────────────────────────────────────────
router.get ("/:id/channels/:channelId/messages", verifyToken, getChannelMessages);
router.post("/:id/channels/:channelId/messages", verifyToken, validate(postMessageSchema), postMessage);
router.post("/:id/channels/:channelId/call-events", verifyToken, postCallStartEvent);

module.exports = router;
