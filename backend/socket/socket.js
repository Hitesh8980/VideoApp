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
    socket.emit("me", socket.id);

    socket.on("joinRoom", ({ roomId, userId, name }) => {
        if (!rooms[roomId]) rooms[roomId] = [];
        rooms[roomId].push({ userId, name });

        socket.join(roomId);
        socket.emit("allUsers", rooms[roomId].filter((user) => user.userId !== userId));

        socket.broadcast.to(roomId).emit("userJoined", { userId });
    });

    socket.on("sendingSignal", ({ userToSignal, callerId, signal }) => {
        io.to(userToSignal).emit("userJoined", { callerId, signal });
    });

    socket.on("returningSignal", ({ signal, callerId }) => {
        io.to(callerId).emit("receivingReturnedSignal", { id: socket.id, signal });
    });

    socket.on("leaveRoom", ({ roomId, userId }) => {
        if (rooms[roomId]) {
            rooms[roomId] = rooms[roomId].filter((user) => user.userId !== userId);
        }
        socket.leave(roomId);
        socket.broadcast.to(roomId).emit("userLeft", userId);
    });

    socket.on("disconnect", () => {
        Object.keys(rooms).forEach((roomId) => {
            rooms[roomId] = rooms[roomId].filter((user) => user.userId !== socket.id);
            io.to(roomId).emit("userLeft", socket.id);
        });
    });
});
}

module.exports = { setupSocket };
