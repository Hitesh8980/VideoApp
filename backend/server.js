const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const rooms = {};

io.on("connection", (socket) => {
  console.log("🟢 New connection:", socket.id);

  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    rooms[socket.id] = roomId;
    console.log(`👤 User ${socket.id} joined room ${roomId}`);
    socket.broadcast.to(roomId).emit("user-joined", { id: socket.id });
  });

  socket.on("call-user", ({ userToCall, signalData, from }) => {
    console.log(`📞 ${from} calling ${userToCall}`);
    io.to(userToCall).emit("call-received", { signal: signalData, from });
  });

  socket.on("accept-call", ({ signal, to }) => {
    console.log(`✅ Call accepted by ${socket.id}, notifying ${to}`);
    io.to(to).emit("call-accepted", signal);
  });

  socket.on("disconnect", () => {
    const roomId = rooms[socket.id];
    if (roomId) {
      socket.broadcast.to(roomId).emit("user-disconnected", socket.id);
      console.log(`❌ User ${socket.id} left room ${roomId}`);
    }
    delete rooms[socket.id];
  });
});

server.listen(5000, () => {
  console.log("🚀 Server running on port 5000");
});
