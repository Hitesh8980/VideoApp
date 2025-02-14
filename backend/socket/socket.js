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

    // Send the socket ID to frontend
    socket.emit("me", socket.id);

    // Handle user joining a room
    socket.on("join-room", (roomId, userId) => {
      socket.join(roomId);
      socket.to(roomId).emit("user-connected", userId);
    });

    // Handle user signaling
    socket.on("signal", (data) => {
      io.to(data.room).emit("signal", data);
    });

    // Handle call initiation
    socket.on("callUser", (data) => {
      io.to(data.userToCall).emit("callUser", { 
        signal: data.signalData, 
        from: data.from, 
        name: data.name 
      });
    });

    // Handle answering a call
    socket.on("answerCall", (data) => {
      io.to(data.to).emit("callAccepted", data.signal);
    });

    // Handle call disconnection
    socket.on("disconnect", () => {
      socket.broadcast.emit("callEnded");
      console.log("User disconnected: ", socket.id);
    });
  });
}

module.exports = { setupSocket };
