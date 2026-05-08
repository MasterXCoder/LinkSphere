const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const { getDirectMessages, postDirectMessage } = require("../controllers/dmController");

router.use(verifyToken);

router.get("/:friendId/messages", getDirectMessages);
router.post("/:friendId/messages", postDirectMessage);

module.exports = router;
