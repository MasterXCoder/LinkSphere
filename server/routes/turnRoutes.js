const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");

// GET /api/turn/credentials
// Fetches temporary TURN credentials from Xirsys for WebRTC peer connections.
router.get("/credentials", verifyToken, async (req, res) => {
  try {
    const ident = process.env.TURN_IDENT;
    const secret = process.env.TURN_SECRET;
    const channel = process.env.TURN_CHANNEL;
    const apiPath = process.env.TURN_API_PATH;

    if (!ident || !secret || !apiPath) {
      return res.status(500).json({ error: "TURN server not configured" });
    }

    // Xirsys uses HTTP Basic Auth: ident:secret
    const authHeader = "Basic " + Buffer.from(`${ident}:${secret}`).toString("base64");

    const response = await fetch(apiPath, {
      method: "PUT",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ format: "urls" }),
    });

    const data = await response.json();

    if (data.s !== "ok" || !data.v) {
      console.error("Xirsys error:", data);
      return res.status(502).json({ error: "Failed to fetch TURN credentials" });
    }

    // data.v.iceServers is the array of STUN/TURN server objects
    res.json({ iceServers: data.v.iceServers });
  } catch (err) {
    console.error("TURN credentials error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
