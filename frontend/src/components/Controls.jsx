import React from "react";

const Controls = ({ callAccepted, callEnded, receivingCall, caller, answerCall, leaveCall, callUser, idToCall }) => {
    return (
        <div style={{ marginTop: "20px" }}>
            {callAccepted && !callEnded ? (
                <button 
                    onClick={leaveCall} 
                    style={{ padding: "10px", backgroundColor: "red", color: "white", cursor: "pointer" }}>
                    End Call
                </button>
            ) : (
                <button 
                    onClick={() => callUser(idToCall)} 
                    style={{ padding: "10px", backgroundColor: "green", color: "white", cursor: "pointer" }}>
                    Call
                </button>
            )}

            {receivingCall && !callAccepted && (
                <div>
                    <h3>{caller} is calling...</h3>
                    <button 
                        onClick={answerCall} 
                        style={{ padding: "10px", backgroundColor: "blue", color: "white", cursor: "pointer" }}>
                        Answer
                    </button>
                </div>
            )}
        </div>
    );
};

export default Controls;
