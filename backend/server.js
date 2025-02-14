const cors = require("cors");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "https://video-app-delta-ten.vercel.app",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Enable CORS middleware
app.use(cors({ origin: "https://video-app-delta-ten.vercel.app", credentials: true }));

const rooms = {}; // Store users' room info

io.on("connection", (socket) => {
  console.log(`🟢 New connection: ${socket.id}`);

  // User joins a room
  socket.on("join-room", (roomId) => {
    if (!roomId) return;
    socket.join(roomId);
    rooms[socket.id] = roomId;

    console.log(`👤 User ${socket.id} joined room ${roomId}`);

    // Notify others in the room
    socket.broadcast.to(roomId).emit("user-joined", { id: socket.id });
  });

  // Handle call initiation
  socket.on("call-user", ({ userToCall, signalData, from }) => {
    if (!userToCall || !signalData || !from) return;

    console.log(`📞 ${from} calling ${userToCall}`);
    io.to(userToCall).emit("call-received", { signal: signalData, from });
  });

  // Handle call acceptance
  socket.on("accept-call", ({ signal, to }) => {
    if (!signal || !to) return;

    console.log(`✅ Call accepted by ${socket.id}, notifying ${to}`);
    io.to(to).emit("call-accepted", signal);
  });

  // Handle user disconnection
  socket.on("disconnect", () => {
    const roomId = rooms[socket.id];

    if (roomId) {
      console.log(`❌ User ${socket.id} left room ${roomId}`);
      socket.broadcast.to(roomId).emit("user-disconnected", socket.id);
      delete rooms[socket.id]; // Cleanup
    }
  });
});

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
