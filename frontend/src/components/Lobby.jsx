import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidV4 } from "uuid";

const Lobby = () => {
  const [roomId, setRoomId] = useState("");
  const navigate = useNavigate();

  const handleJoinRoom = () => {
    if (!roomId.trim()) {
      alert("Please enter a valid Room ID");
      return;
    }
    navigate(`/room/${roomId}`);
  };

  const createRoom = () => {
    const newRoomId = uuidV4();
    navigate(`/room/${newRoomId}`);
  };

  return (
    <div>
      <h1>Enter Room ID</h1>
      <input type="text" value={roomId} onChange={(e) => setRoomId(e.target.value)} placeholder="Enter Room ID" />
      <button onClick={handleJoinRoom}>Join Room</button>
      <button onClick={createRoom}>Create New Room</button>
    </div>
  );
};

export default Lobby;
