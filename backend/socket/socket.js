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
    console.log("New connection:", socket.id);

    socket.on("join-room", ({ roomId, name }) => {
        socket.join(roomId);
        rooms[socket.id] = roomId;
        socket.broadcast.to(roomId).emit("user-joined", { id: socket.id });
    });

    socket.on("call-user", ({ userToCall, signalData, from }) => {
        io.to(userToCall).emit("call-received", { signal: signalData, from });
    });

    socket.on("accept-call", ({ signal, to }) => {
        io.to(to).emit("call-accepted", signal);
    });

    socket.on("disconnect", () => {
        const roomId = rooms[socket.id];
        if (roomId) {
            socket.broadcast.to(roomId).emit("user-disconnected", socket.id);
        }
        delete rooms[socket.id];
    });
});
}

module.exports = { setupSocket };
