import React from "react";

const VideoPlayer = ({ myVideo, userVideo, callAccepted, callEnded }) => {
    return (
        <div style={{ display: "flex", justifyContent: "center", gap: "20px" }}>
            <video 
                playsInline 
                muted 
                ref={myVideo} 
                autoPlay 
                style={{ width: "300px", border: "1px solid black" }} 
            />
            {callAccepted && !callEnded && (
                <video 
                    playsInline 
                    ref={userVideo} 
                    autoPlay 
                    style={{ width: "300px", border: "1px solid black" }} 
                />
            )}
        </div>
    );
};

export default VideoPlayer;
