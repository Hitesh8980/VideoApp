import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import Peer from "simple-peer";

const socket = io("https://videoapp-q3ld.onrender.com"); // Backend URL

const PeerConnection = () => {
    const [myId, setMyId] = useState("");
    const [users, setUsers] = useState([]);
    const [stream, setStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const myVideoRef = useRef();
    const remoteVideoRef = useRef();
    const peersRef = useRef({});

    useEffect(() => {
        console.log("⚡ Initializing PeerConnection...");

        // Get user media stream
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((myStream) => {
                setStream(myStream);
                if (myVideoRef.current) {
                    myVideoRef.current.srcObject = myStream;
                }
                console.log("✅ Local video stream acquired");
            })
            .catch((err) => console.error("❌ Error accessing media devices:", err));

        // Handle connection
        socket.on("connect", () => {
            console.log("🔌 Connected to socket server");
        });

        socket.on("me", (id) => {
            console.log("🔹 My socket ID:", id);
            setMyId(id);
        });

        // When a new user joins
        socket.on("newUser", (userId) => {
            console.log("👤 New user joined:", userId);
            setUsers((prevUsers) => [...prevUsers, userId]);

            if (stream) {
                console.log("📞 Automatically calling new user:", userId);
                autoCallUser(userId);
            } else {
                console.warn("⚠️ Stream not ready yet, waiting to call...");
            }
        });

        // When receiving a call
        socket.on("call-received", ({ signal, from }) => {
            console.log("📩 Incoming call from:", from);
            answerCall(from, signal);
        });

        // When a call is accepted
        socket.on("call-accepted", ({ signal, from }) => {
            console.log("✅ Call accepted by:", from);
            if (peersRef.current[from]) {
                peersRef.current[from].signal(signal);
            }
        });

        return () => {
            console.log("🔴 Disconnecting socket...");
            socket.disconnect();
        };
    }, [stream]);

    const autoCallUser = (userToCall) => {
        if (!userToCall || !stream) {
            console.error("🚫 Cannot call, missing user or stream.");
            return;
        }

        console.log("📞 Calling user:", userToCall);

        const peer = new Peer({
            initiator: true,
            trickle: false,
            stream: stream,
        });

        peer.on("signal", (signal) => {
            console.log("📡 Sending call signal to:", userToCall);
            socket.emit("call-user", { userToCall, signalData: signal, from: myId });
        });

        peer.on("stream", (incomingStream) => {
            console.log("🎥 Receiving remote video stream...");
            setRemoteStream(incomingStream);
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = incomingStream;
            }
        });

        peer.on("connect", () => {
            console.log("🔗 Peer connection established with", userToCall);
        });

        peer.on("error", (err) => {
            console.error("❌ Peer connection error:", err);
        });

        peersRef.current[userToCall] = peer;
    };

    const answerCall = (from, signal) => {
        console.log("📞 Answering call from:", from);

        const peer = new Peer({
            initiator: false,
            trickle: false,
            stream: stream,
        });

        peer.on("signal", (returnSignal) => {
            console.log("📡 Sending answer signal to:", from);
            socket.emit("accept-call", { signal: returnSignal, to: from });
        });

        peer.on("stream", (incomingStream) => {
            console.log("🎥 Receiving remote video stream...");
            setRemoteStream(incomingStream);
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = incomingStream;
            }
        });

        peer.on("connect", () => {
            console.log("🔗 Connected to", from);
        });

        peer.signal(signal);
        peersRef.current[from] = peer;
    };

    return (
        <div>
            <h2>My ID: {myId}</h2>
            <p>Share this link: {window.location.href}</p>
            <h3>Connected Users:</h3>
            <ul>
                {users.map((user) => (
                    <li key={user}>{user}</li>
                ))}
            </ul>

            <div style={{ display: "flex", justifyContent: "center", gap: "20px" }}>
                <div>
                    <h3>My Video</h3>
                    <video ref={myVideoRef} autoPlay muted style={{ width: "300px", height: "200px", border: "2px solid black" }}></video>
                </div>
                <div>
                    <h3>Remote Video</h3>
                    <video ref={remoteVideoRef} autoPlay style={{ width: "300px", height: "200px", border: "2px solid red" }}></video>
                </div>
            </div>
        </div>
    );
};

export default PeerConnection;
