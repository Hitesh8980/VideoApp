import { io } from "socket.io-client";

const socket = io("http://localhost:5003", {
  transports: ["websocket", "polling"], // Ensures compatibility
  reconnectionAttempts: 5, // Try reconnecting 5 times
});

socket.on("connect", () => {
  console.log("Connected to socket server:", socket.id);
});

socket.on("connect_error", (err) => {
  console.error("Socket connection error:", err);
});

export default socket;
