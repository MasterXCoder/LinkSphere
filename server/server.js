require("dotenv").config({ quiet: true });
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const app = require("./app");
const { connectDB } = require("./database/db");
const User = require("./models/User");

// Track user socket mappings: userId -> Set of socketIds
const userSockets = new Map();

// Handle connection errors after the initial connection
mongoose.connection.on("error", (err) => {
  console.error("❌ MongoDB runtime error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.warn("⚠️ MongoDB connection lost.");
});

const PORT = process.env.PORT || 8000;

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:5174", "http://127.0.0.1:5174"],
    credentials: true,
  },
});

app.set("io", io);



io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    return next(new Error("Authentication error: No token provided"));
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return next(new Error("Authentication error: Invalid token"));
    }
    socket.user = decoded; // Attach the decoded user data (id, username) to the socket instance
    next();
  });
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

  socket.on("join_channel", (channelId) => {
    socket.join(channelId);
    console.log(`Socket ${socket.id} joined channel: ${channelId}`);
  });

  socket.on("leave_channel", (channelId) => {
    socket.leave(channelId);
    console.log(`Socket ${socket.id} left channel: ${channelId}`);
  });

  // Voice/Video Call Signaling
  socket.on("call-user", ({ userToCall, signalData, from, callType }) => {
    // Use server-side verified username from JWT — never trust client-sent callerName
    io.to(userToCall).emit("call-incoming", {
      signal: signalData,
      from,
      callType: callType || 'audio',
      callerName: socket.user.username,
    });
  });

  socket.on("accept-call", ({ signal, to }) => {
    io.to(to).emit("call-accepted", signal);
  });

  socket.on("reject-call", ({ to }) => {
    io.to(to).emit("call-rejected");
  });

  socket.on("end-call", ({ to }) => {
    io.to(to).emit("call-ended");
  });

  socket.on("ice-candidate", ({ candidate, to }) => {
    io.to(to).emit("ice-candidate", { candidate });
  });

  socket.on("disconnect", async () => {
    console.log(`🔌 Client disconnected: ${socket.id} (User: ${socket.user.username})`);
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
