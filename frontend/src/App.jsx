import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useParams } from "react-router-dom";
import PeerConnection from "./components/PeerConnection";
import Lobby from "./components/Lobby";
import socket from "./utils/socket";

function App() {
    const navigate = useNavigate();
    const { roomId } = useParams();
    const [name, setName] = useState("");
    const [me, setMe] = useState("");

    useEffect(() => {
        socket.on("me", (id) => setMe(id));
    }, []);

    const createRoom = () => {
        const newRoomId = Math.random().toString(36).substr(2, 9);
        navigate(`/room/${newRoomId}`);  
    };

    return (
        <Routes>
            <Route path="/" element={<Lobby createRoom={createRoom} setName={setName} />} />
            <Route path="/room/:roomId" element={<PeerConnection me={me} name={name} roomId={roomId} />} />
        </Routes>
    );
}

export default App;
