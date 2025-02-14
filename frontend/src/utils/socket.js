import io from "socket.io-client";

const SOCKET_SERVER_URL = "https://videoapp-q3ld.onrender.com";

const socket = io.connect(SOCKET_SERVER_URL);

export default socket;
