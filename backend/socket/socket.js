
const { Server } = require("socket.io");

function setupSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log("A user connected: ", socket.id);

    socket.on("join-room", (roomId, userId) => {
      socket.join(roomId);
      socket.to(roomId).emit("user-connected", userId);
    });

    socket.on("signal", (data) => {
      io.to(data.room).emit("signal", data);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected: ", socket.id);
    });
  });
}

module.exports = { setupSocket };

