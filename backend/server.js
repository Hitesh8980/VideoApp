const express = require("express");
const http = require("http");
const { setupSocket } = require("./socket/socket");

const app = express();
const server = http.createServer(app);

// Setup Socket.io
setupSocket(server);

const PORT = process.env.PORT || 5003;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
