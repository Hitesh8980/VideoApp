const { Server } = require("socket.io");

function setupSocket(server) {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        },
    });

    const rooms = {};

    io.on("connection", (socket) => {
        console.log("🟢 New connection:", socket.id);

        socket.emit("me", socket.id);

        socket.on("join-room", ({ roomId, name }) => {
            socket.join(roomId);
            rooms[socket.id] = roomId;
            console.log(`👥 ${socket.id} joined room ${roomId}`);
            socket.broadcast.to(roomId).emit("newUser", socket.id);
        });

        socket.on("call-user", ({ userToCall, signalData, from }) => {
            console.log(`📞 Call request from ${from} to ${userToCall}`);
            io.to(userToCall).emit("call-received", { signal: signalData, from });
        });

        socket.on("accept-call", ({ signal, to }) => {
            console.log(`✅ Call accepted by ${to}`);
            io.to(to).emit("call-accepted", { signal, from: socket.id });
        });

        socket.on("disconnect", () => {
            console.log("🔴 User disconnected:", socket.id);
            const roomId = rooms[socket.id];
            if (roomId) {
                socket.broadcast.to(roomId).emit("user-disconnected", socket.id);
            }
            delete rooms[socket.id];
        });
    });
}

module.exports = { setupSocket };
