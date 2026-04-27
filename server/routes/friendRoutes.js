const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const {
  sendRequest,
  acceptRequest,
  declineRequest,
  cancelRequest,
  removeFriend,
  getFriends,
} = require("../controllers/friendController");

// All routes require authentication
router.use(verifyToken);

router.get("/", getFriends);                    // GET  /api/friends
router.post("/request", sendRequest);           // POST /api/friends/request
router.post("/accept", acceptRequest);          // POST /api/friends/accept
router.post("/decline", declineRequest);        // POST /api/friends/decline
router.post("/cancel", cancelRequest);          // POST /api/friends/cancel
router.delete("/:friendId", removeFriend);      // DELETE /api/friends/:friendId

module.exports = router;
