import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import Peer from "simple-peer";

const socket = io("https://videoapp-q3ld.onrender.com");

const PeerConnection = () => {
    const [myId, setMyId] = useState("");
    const [users, setUsers] = useState([]);
    const [stream, setStream] = useState(null);
    const peersRef = useRef({});

    const localVideoRef = useRef();
    const remoteVideoRef = useRef();

    useEffect(() => {
        // Get user media stream
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((myStream) => {
                setStream(myStream);
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = myStream;
                }
            })
            .catch((err) => console.error("Error accessing media devices:", err));

        // Handle connection
        socket.on("me", (id) => {
            console.log("My socket ID:", id);
            setMyId(id);
            socket.emit("joinRoom", id);
        });

        socket.on("newUser", (userId) => {
            console.log("New user joined:", userId);
            setUsers((prevUsers) => [...prevUsers, userId]);
            autoCallUser(userId);
        });

        socket.on("incomingCall", ({ from, signal }) => {
            console.log("Incoming call from:", from);
            const peer = new Peer({
                initiator: false,
                trickle: false,
                stream: stream,
            });

            peer.on("signal", (signal) => {
                socket.emit("acceptCall", { to: from, signal });
            });

            peer.on("stream", (remoteStream) => {
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = remoteStream;
                }
            });

            peer.signal(signal);
            peersRef.current[from] = peer;
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const autoCallUser = (userToCall) => {
        if (!userToCall || !stream) {
            console.error("Cannot call, missing user or stream.");
            return;
        }

        console.log("Calling user:", userToCall);

        const peer = new Peer({
            initiator: true,
            trickle: false,
            stream: stream,
        });

        peer.on("signal", (signal) => {
            socket.emit("callUser", { userToCall, signal });
        });

        peer.on("stream", (remoteStream) => {
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = remoteStream;
            }
        });

        peersRef.current[userToCall] = peer;
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
            <div>
                <h3>Video Call</h3>
                <video ref={localVideoRef} autoPlay playsInline muted />
                <video ref={remoteVideoRef} autoPlay playsInline />
            </div>
        </div>
    );
};

export default PeerConnection;
