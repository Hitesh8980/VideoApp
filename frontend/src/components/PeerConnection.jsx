import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import Peer from "simple-peer";

const socket = io("https://videoapp-q3ld.onrender.com"); // Update your backend URL

const PeerConnection = () => {
    const [myId, setMyId] = useState("");
    const [roomId, setRoomId] = useState("12345"); // Default room ID (change as needed)
    const [users, setUsers] = useState([]);
    const [stream, setStream] = useState(null);
    const myVideo = useRef();
    const userVideo = useRef();
    const peersRef = useRef([]);

    useEffect(() => {
        // Get user media stream
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((myStream) => {
                setStream(myStream);
                if (myVideo.current) {
                    myVideo.current.srcObject = myStream;
                }
            })
            .catch((err) => console.error("Error accessing media devices:", err));

        // Handle connection
        socket.on("connect", () => {
            setMyId(socket.id);
            socket.emit("join-room", { roomId, name: `User-${socket.id}` });
        });

        // Receive new users joining
        socket.on("user-joined", ({ id }) => {
            console.log("New user joined:", id);
            setUsers((prevUsers) => [...prevUsers, id]);
            callUser(id);
        });

        // Get list of all users in the room
        socket.on("roomUsers", (roomUsers) => {
            setUsers(roomUsers.filter(id => id !== myId)); // Exclude self
        });

        socket.on("call-received", ({ from, signal }) => {
            answerCall(from, signal);
        });

        socket.on("call-accepted", ({ signal }) => {
            const peer = peersRef.current.find(p => p.peer);
            if (peer) {
                peer.peer.signal(signal);
            }
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const callUser = (userToCall) => {
        if (!stream) {
            console.error("Stream not ready yet.");
            return;
        }

        const peer = new Peer({
            initiator: true,
            trickle: false,
            stream: stream,
        });

        peer.on("signal", (signal) => {
            socket.emit("call-user", { userToCall, signalData: signal, from: myId });
        });

        peer.on("stream", (remoteStream) => {
            console.log("Receiving remote stream");
            if (userVideo.current) {
                userVideo.current.srcObject = remoteStream;
            }
        });

        peer.on("error", (err) => console.error("Peer connection error:", err));

        peersRef.current.push({ id: userToCall, peer });
    };

    const answerCall = (callerId, signal) => {
        const peer = new Peer({
            initiator: false,
            trickle: false,
            stream: stream,
        });

        peer.on("signal", (returnSignal) => {
            socket.emit("accept-call", { signal: returnSignal, to: callerId });
        });

        peer.on("stream", (remoteStream) => {
            console.log("Receiving remote stream from caller");
            if (userVideo.current) {
                userVideo.current.srcObject = remoteStream;
            }
        });

        peer.signal(signal);
        peersRef.current.push({ id: callerId, peer });
    };

    return (
        <div style={{ textAlign: "center", padding: "20px" }}>
            <h2>Video Chat</h2>

            <p>Share this link with others:</p>
            <input
                type="text"
                value={window.location.href}
                readOnly
                style={{ width: "80%", padding: "5px", marginBottom: "10px" }}
            />

            <h3>Users in Room:</h3>
            <ul>
                {users.length > 0 ? users.map((user) => <li key={user}>{user}</li>) : <p>No other users</p>}
            </ul>

            <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginTop: "20px" }}>
                {/* My Video */}
                <div style={{ width: "300px", height: "200px", border: "2px solid black", textAlign: "center" }}>
                    <h3>My Video</h3>
                    <video ref={myVideo} autoPlay muted style={{ width: "100%", height: "100%" }} />
                </div>

                {/* Other User's Video */}
                <div style={{ width: "300px", height: "200px", border: "2px solid red", textAlign: "center" }}>
                    <h3>Other User</h3>
                    <video ref={userVideo} autoPlay style={{ width: "100%", height: "100%" }} />
                </div>
            </div>
        </div>
    );
};

export default PeerConnection;
