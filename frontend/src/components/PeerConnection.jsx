import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import Peer from "simple-peer";

const socket = io("https://videoapp-q3ld.onrender.com"); // Update with your backend URL

const PeerConnection = () => {
    const [myId, setMyId] = useState("");
    const [users, setUsers] = useState([]);
    const [stream, setStream] = useState(null);
    const peersRef = useRef({});

    useEffect(() => {
        // Get user media stream
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((myStream) => {
                setStream(myStream);
            })
            .catch((err) => console.error("Error accessing media devices:", err));

        // Handle connection
        socket.on("me", (id) => {
            console.log("My socket ID:", id);
            setMyId(id);
        });

        // When a new user joins
        socket.on("newUser", (userId) => {
            console.log("New user joined:", userId);
            setUsers((prevUsers) => [...prevUsers, userId]);
            autoCallUser(userId);
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const autoCallUser = (userToCall) => {
        if (!userToCall) {
            console.error("No user ID provided for calling.");
            return;
        }

        if (!stream) {
            console.error("Media stream is not ready yet.");
            return;
        }

        console.log("Calling user automatically:", userToCall);

        const peer = new Peer({
            initiator: true,
            trickle: false,
            stream: stream,
        });

        peer.on("signal", (signal) => {
            socket.emit("callUser", { userToCall, signal });
        });

        peer.on("connect", () => {
            console.log("Connected with", userToCall);
        });

        peer.on("error", (err) => {
            console.error("Peer connection error:", err);
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
        </div>
    );
};

export default PeerConnection;
