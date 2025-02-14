const { Server } = require("socket.io");

function setupSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "*", 
      methods: ["GET", "POST"]
    }
  });

  const rooms = {};

  io.on("connection", (socket) => {
    console.log(`New user connected: ${socket.id}`);

    // Send the socket ID to the client
    socket.emit("me", socket.id);

    socket.on("join-room", ({ roomId, name }) => {
      if (!roomId) {
        console.error("Error: Missing roomId");
        return;
      }

      socket.join(roomId);
      rooms[socket.id] = roomId;

      console.log(`${name} (${socket.id}) joined room: ${roomId}`);

      // Notify others in the room about the new user
      socket.broadcast.to(roomId).emit("newUser", { id: socket.id, name });

      // Send list of current users in the room
      const usersInRoom = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
      io.to(socket.id).emit("roomUsers", usersInRoom);
    });

    socket.on("call-user", ({ userToCall, signalData, from }) => {
      console.log(`${from} is calling ${userToCall}`);
      io.to(userToCall).emit("call-received", { signal: signalData, from });
    });

    socket.on("accept-call", ({ signal, to }) => {
      console.log(`${socket.id} accepted call from ${to}`);
      io.to(to).emit("call-accepted", signal);
    });

    socket.on("disconnect", () => {
      const roomId = rooms[socket.id];
      if (roomId) {
        console.log(`User ${socket.id} disconnected from room ${roomId}`);
        socket.broadcast.to(roomId).emit("user-disconnected", socket.id);
      }
      delete rooms[socket.id];
    });
  });
}

module.exports = { setupSocket };
