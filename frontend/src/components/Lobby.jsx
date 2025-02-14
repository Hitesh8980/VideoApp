import React from "react";

const Lobby = ({ createRoom, setName }) => {
    return (
        <div>
            <h2>Create a Room</h2>
            <input
                type="text"
                placeholder="Enter Your Name"
                onChange={(e) => setName(e.target.value)}
            />
            <button onClick={createRoom}>Start Call</button>
        </div>
    );
};

export default Lobby;
