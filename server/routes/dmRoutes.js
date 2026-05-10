const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const { getDirectMessages, postDirectMessage, postDmCallStartEvent } = require("../controllers/dmController");

router.use(verifyToken);

router.get("/:friendId/messages", getDirectMessages);
router.post("/:friendId/messages", postDirectMessage);
router.post("/:friendId/call-events", postDmCallStartEvent);

module.exports = router;
