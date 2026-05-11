const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env"), quiet: true });
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const app = require("./app");
const { connectDB } = require("./database/db");
const User = require("./models/User");

// Track user socket mappings: userId -> Set of socketIds
const userSockets = new Map();

// Track users in voice channels: channelId -> Map<socketId, userObj>
const voiceRooms = new Map();

// Handle connection errors after the initial connection
mongoose.connection.on("error", (err) => {
  console.error("❌ MongoDB runtime error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.warn("⚠️ MongoDB connection lost.");
});

const PORT = process.env.PORT || 8000;

const httpServer = http.createServer(app);

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
  process.env.CLIENT_URL
].filter(Boolean);

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

app.set("io", io);



io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    return next(new Error("Authentication error: No token provided"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    let user;
    if (typeof decoded.id === 'string' && decoded.id.length === 24) {
      // Legacy token with MongoDB _id
      user = await User.findById(decoded.id);
    } else {
      user = await User.findOne({ id: decoded.id });
    }

    if (user) {
      // Extract numeric id and avatarUrl
      socket.user = {
        id: user._doc?.id || user.id, // Ensure numeric ID
        username: user.username,
        avatarUrl: user.avatarUrl
      };
    } else {
      socket.user = decoded; // Fallback
    }
    
    next();
  } catch (err) {
    return next(new Error("Authentication error: Invalid token"));
  }
});

io.on("connection", async (socket) => {
  console.log(`🔌 New client connected: ${socket.id} (User: ${socket.user.username})`);

  // Store socket ID mapping
  const userId = socket.user.id;
  if (!userSockets.has(userId)) {
    userSockets.set(userId, new Set());
  }
  userSockets.get(userId).add(socket.id);

  // Update user's socketId in database
  await User.findOneAndUpdate({ id: userId }, { socketId: socket.id });

  // Tell THIS socket about ALL currently online users (including themselves)
  const onlineList = [];
  for (const [onlineUserId, socketSet] of userSockets.entries()) {
    if (socketSet.size > 0) {
      const activeSocketId = Array.from(socketSet)[0];
      onlineList.push({ userId: onlineUserId, socketId: activeSocketId });
    }
  }
  socket.emit("online-users-list", onlineList);
  console.log(`📡 Sent online-users-list to ${socket.user.username}:`, onlineList);

  // Tell EVERYONE ELSE this user is now online
  socket.broadcast.emit("user-online", { userId, socketId: socket.id });
  console.log(`📢 Broadcasted user-online for ${socket.user.username} (${userId})`);

  // Tell THIS socket about ALL active voice rooms
  for (const [cId, room] of voiceRooms.entries()) {
    socket.emit("voice-users-update", {
      channelId: cId,
      users: Array.from(room.values())
    });
  }

  socket.on("join_channel", (channelId) => {
    socket.join(channelId);
    console.log(`Socket ${socket.id} joined channel: ${channelId}`);
  });

  socket.on("leave_channel", (channelId) => {
    socket.leave(channelId);
    console.log(`Socket ${socket.id} left channel: ${channelId}`);
  });

  // Voice/Video Call Signaling
  socket.on("call-user", ({ userToCall, signalData, from, callType, isVoiceChannel }) => {
    // Use server-side verified username from JWT — never trust client-sent callerName
    io.to(userToCall).emit("call-incoming", {
      signal: signalData,
      from,
      callType: callType || 'audio',
      callerName: socket.user.username,
      callerAvatar: socket.user.avatarUrl,
      isVoiceChannel
    });
  });

  socket.on("accept-call", ({ signal, to, isVoiceChannel }) => {
    io.to(to).emit("call-accepted", { signal, from: socket.id, isVoiceChannel });
  });

  socket.on("reject-call", ({ to }) => {
    io.to(to).emit("call-rejected");
  });

  socket.on("end-call", ({ to }) => {
    io.to(to).emit("call-ended");
  });

  socket.on("ice-candidate", ({ candidate, to, isVoiceChannel }) => {
    io.to(to).emit("ice-candidate", { candidate, from: socket.id, isVoiceChannel });
  });

  socket.on("toggle-video", ({ to, isVideoOff }) => {
    io.to(to).emit("toggle-video", { isVideoOff });
  });

  socket.on("toggle-mute", ({ to, isMuted }) => {
    io.to(to).emit("toggle-mute", { isMuted });
  });

  socket.on("renegotiate", ({ to, signal }) => {
    io.to(to).emit("renegotiate", signal);
  });

  socket.on("renegotiate-mesh", ({ to, signal, from }) => {
    io.to(to).emit("renegotiate-mesh", { signal, from });
  });

  socket.on("toggle-screen-share", ({ to, isScreenSharing }) => {
    io.to(to).emit("toggle-screen-share", { isScreenSharing });
  });

  socket.on("join-voice", ({ channelId, user }) => {
    // Enforce exclusivity: Remove user from all other voice rooms
    for (const [cId, room] of voiceRooms.entries()) {
      for (const [sId, u] of room.entries()) {
        if (String(u.id) === String(user.id)) {
          const socketToRemove = io.sockets.sockets.get(sId);
          if (socketToRemove) {
            socketToRemove.leave(`voice-${cId}`);
            socketToRemove.emit("force-disconnect-voice");
          }
          room.delete(sId);
          io.emit("voice-users-update", {
            channelId: cId,
            users: Array.from(room.values())
          });
          socket.to(`voice-${cId}`).emit("user-left-voice", { channelId: cId, socketId: sId });
          if (room.size === 0) voiceRooms.delete(cId);
        }
      }
    }

    socket.join(`voice-${channelId}`);
    if (!user.socketId) user.socketId = socket.id;
    if (!voiceRooms.has(channelId)) voiceRooms.set(channelId, new Map());
    voiceRooms.get(channelId).set(socket.id, user);
    
    io.emit("voice-users-update", {
      channelId,
      users: Array.from(voiceRooms.get(channelId).values())
    });
    
    // Broadcast to others in the room to trigger WebRTC offers
    socket.to(`voice-${channelId}`).emit("user-joined-voice", { channelId, user });
  });

  socket.on("leave-voice", ({ channelId }) => {
    socket.leave(`voice-${channelId}`);
    if (voiceRooms.has(channelId)) {
      const room = voiceRooms.get(channelId);
      room.delete(socket.id);
      io.emit("voice-users-update", {
        channelId,
        users: Array.from(room.values())
      });
      socket.to(`voice-${channelId}`).emit("user-left-voice", { channelId, socketId: socket.id });
      if (room.size === 0) voiceRooms.delete(channelId);
    }
  });

  socket.on("disconnect", async () => {
    console.log(`🔌 Client disconnected: ${socket.id} (User: ${socket.user.username})`);
    
    for (const [channelId, room] of voiceRooms.entries()) {
      if (room.has(socket.id)) {
        room.delete(socket.id);
        io.emit("voice-users-update", {
          channelId,
          users: Array.from(room.values())
        });
        socket.to(`voice-${channelId}`).emit("user-left-voice", { channelId, socketId: socket.id });
        if (room.size === 0) voiceRooms.delete(channelId);
      }
    }

    const socketSet = userSockets.get(userId);
    if (socketSet) {
      socketSet.delete(socket.id);
      if (socketSet.size === 0) {
        console.log(`🛑 Removing active socket for ${socket.user.username} (${userId})`);
        userSockets.delete(userId);
        await User.findOneAndUpdate({ id: userId }, { socketId: null });
        socket.broadcast.emit("user-offline", { userId });
        console.log(`📢 Broadcasted user-offline for ${socket.user.username} (${userId})`);
      } else {
        console.log(`⚠️ Ignored disconnect for ${socket.user.username} (${socketSet.size} sockets remaining)`);
        const activeSocketId = Array.from(socketSet)[0];
        await User.findOneAndUpdate({ id: userId }, { socketId: activeSocketId });
        socket.broadcast.emit("user-online", { userId, socketId: activeSocketId });
      }
    }
    socket.broadcast.emit("user-left-call", { userId });
  });
});

// Connect to MongoDB Atlas first, then start the HTTP server
connectDB()
  .then(() => {
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Failed to connect to MongoDB Atlas:", err);
    process.exit(1);
  });
