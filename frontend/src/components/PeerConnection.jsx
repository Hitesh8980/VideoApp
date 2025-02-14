import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import io from "socket.io-client";
import SimplePeer from "simple-peer";

const socket = io("https://videoapp-q3ld.onrender.com"); // Ensure this is correct

function PeerConnection({ me, name }) {
    const { roomId } = useParams();
    const [stream, setStream] = useState(null);
    const [callAccepted, setCallAccepted] = useState(false);
    const [callerSignal, setCallerSignal] = useState(null);
    const [peerId, setPeerId] = useState(null);

    const myVideo = useRef();
    const userVideo = useRef();
    const peerRef = useRef();

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
            setStream(stream);
            if (myVideo.current) {
                myVideo.current.srcObject = stream;
            }
        });

        socket.emit("join-room", { roomId, name });

        socket.on("user-joined", ({ id }) => {
            console.log("New user joined:", id);
            setPeerId(id);
        });

        socket.on("call-received", ({ signal, from }) => {
            console.log("Receiving a call from:", from);
            setCallerSignal(signal);
            setPeerId(from);
            setCallAccepted(true);
        });

    }, [roomId]);

    const callUser = () => {
        if (!peerId) {
            console.log("No peer ID to call");
            return;
        }

        const peer = new SimplePeer({
            initiator: true,
            trickle: false,
            stream: stream,
        });

        peer.on("signal", (data) => {
            socket.emit("call-user", { userToCall: peerId, signalData: data, from: me });
        });

        peer.on("stream", (peerStream) => {
            if (userVideo.current) {
                userVideo.current.srcObject = peerStream;
            }
        });

        socket.on("call-accepted", (signal) => {
            peer.signal(signal);
        });

        peerRef.current = peer;
    };

    const answerCall = () => {
        setCallAccepted(true);

        const peer = new SimplePeer({
            initiator: false,
            trickle: false,
            stream: stream,
        });

        peer.on("signal", (data) => {
            socket.emit("accept-call", { signal: data, to: peerId });
        });

        peer.on("stream", (peerStream) => {
            if (userVideo.current) {
                userVideo.current.srcObject = peerStream;
            }
        });

        peer.signal(callerSignal);
        peerRef.current = peer;
    };

    return (
        <div style={{ textAlign: "center" }}>
            <h2>Room ID: {roomId}</h2>
            <div>
                <video ref={myVideo} autoPlay muted style={{ width: "300px" }} />
                {callAccepted && <video ref={userVideo} autoPlay style={{ width: "300px" }} />}
            </div>
            {!callAccepted && <button onClick={callUser}>Call</button>}
            {callerSignal && !callAccepted && <button onClick={answerCall}>Answer</button>}
        </div>
    );
}

export default PeerConnection;
