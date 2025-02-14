import React, { useEffect, useRef, useState } from "react";
import Peer from "simple-peer";
import socket from "../utils/socket";

const PeerConnection = ({ me, name, roomId }) => {
    const [stream, setStream] = useState(null);
    const [peers, setPeers] = useState([]);
    const myVideo = useRef();
    const peersRef = useRef([]);

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((currentStream) => {
            setStream(currentStream);
            if (myVideo.current) myVideo.current.srcObject = currentStream;

            socket.emit("joinRoom", { roomId, userId: me, name });

            socket.on("allUsers", (users) => {
                const newPeers = [];
                users.forEach((user) => {
                    const peer = createPeer(user.userId, socket.id, currentStream);
                    peersRef.current.push({ peerId: user.userId, peer });
                    newPeers.push(peer);
                });
                setPeers(newPeers);
            });

            socket.on("userJoined", ({ userId, signal }) => {
                const peer = addPeer(userId, signal, currentStream);
                peersRef.current.push({ peerId: userId, peer });
                setPeers((prev) => [...prev, peer]);
            });

            socket.on("receivingReturnedSignal", ({ id, signal }) => {
                const peerObj = peersRef.current.find((p) => p.peerId === id);
                if (peerObj) {
                    peerObj.peer.signal(signal);
                }
            });
        });

        return () => {
            socket.emit("leaveRoom", { roomId, userId: me });
        };
    }, []);

    function createPeer(userToSignal, callerId, stream) {
        const peer = new Peer({
            initiator: true,
            trickle: false,
            stream,
        });

        peer.on("signal", (signal) => {
            socket.emit("sendingSignal", { userToSignal, callerId, signal });
        });

        return peer;
    }

    function addPeer(incomingSignal, callerId, stream) {
        const peer = new Peer({
            initiator: false,
            trickle: false,
            stream,
        });

        peer.on("signal", (signal) => {
            socket.emit("returningSignal", { signal, callerId });
        });

        peer.signal(incomingSignal);
        return peer;
    }

    return (
        <div>
            <h2>Room: {roomId}</h2>
            <video ref={myVideo} autoPlay playsInline muted style={{ width: "300px", border: "1px solid black" }} />
            {peers.map((peer, index) => (
                <video key={index} ref={(ref) => (ref ? (peer.video = ref) : null)} autoPlay playsInline />
            ))}
            <p>Share this link to invite someone: {window.location.href}</p>
        </div>
    );
};

export default PeerConnection;
