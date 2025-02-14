import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";

const socket = io("https://videoapp-q3ld.onrender.com");

const VideoCall = () => {
  const { roomId } = useParams();
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const myVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);
  const localStream = useRef(null);

  useEffect(() => {
    socket.emit("join-room", roomId);

    socket.on("user-connected", async (socketId) => {
      console.log("User connected:", socketId);
      setRemoteSocketId(socketId);
      if (!peerConnection.current) await startCall(socketId);
    });

    socket.on("user-disconnected", (socketId) => {
      console.log("User disconnected:", socketId);
      if (remoteSocketId === socketId) {
        setRemoteSocketId(null);
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
        peerConnection.current?.close();
        peerConnection.current = null;
      }
    });

    socket.on("offer", async ({ offer, from }) => {
      console.log("Received Offer:", from);
      await handleOffer(offer, from);
    });

    socket.on("answer", async ({ answer }) => {
      console.log("Received Answer");
      await peerConnection.current.setRemoteDescription(answer);
    });

    socket.on("ice-candidate", ({ candidate }) => {
      if (candidate) {
        console.log("Received ICE Candidate");
        peerConnection.current?.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    startLocalStream();

    return () => {
      socket.off("user-connected");
      socket.off("user-disconnected");
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
      peerConnection.current?.close();
      peerConnection.current = null;
    };
  }, [roomId, remoteSocketId]);

  const startLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStream.current = stream;
      if (myVideoRef.current) myVideoRef.current.srcObject = stream;
    } catch (error) {
      console.error("Error accessing media devices:", error);
      alert("Please allow camera & microphone access.");
    }
  };

  const startCall = async (socketId) => {
    console.log("Starting call with", socketId);
    peerConnection.current = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    localStream.current.getTracks().forEach((track) => {
      peerConnection.current.addTrack(track, localStream.current);
    });

    peerConnection.current.ontrack = (event) => {
      console.log("Received remote track");
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
    };

    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("Sending ICE Candidate");
        socket.emit("ice-candidate", { candidate: event.candidate, to: socketId });
      }
    };

    const offer = await peerConnection.current.createOffer();
    await peerConnection.current.setLocalDescription(offer);

    socket.emit("offer", { offer, to: socketId });
  };

  const handleOffer = async (offer, from) => {
    console.log("Handling received offer from:", from);
    peerConnection.current = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    peerConnection.current.ontrack = (event) => {
      console.log("Received remote track in offer handler");
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
    };

    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("Sending ICE Candidate from answer side");
        socket.emit("ice-candidate", { candidate: event.candidate, to: from });
      }
    };

    localStream.current.getTracks().forEach((track) => {
      peerConnection.current.addTrack(track, localStream.current);
    });

    await peerConnection.current.setRemoteDescription(offer);
    const answer = await peerConnection.current.createAnswer();
    await peerConnection.current.setLocalDescription(answer);

    socket.emit("answer", { answer, to: from });
  };

  const copyLink = () => {
    const roomLink = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard.writeText(roomLink);
    alert("Room link copied!");
  };

  return (
    <div>
      <h1>Video Call Room: {roomId}</h1>
      <button onClick={copyLink}>Copy Invite Link</button>
      <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginTop: "20px" }}>
        <div>
          <h3>You</h3>
          <video ref={myVideoRef} autoPlay muted playsInline style={{ width: "300px", border: "2px solid black" }} />
        </div>
        <div>
          <h3>{remoteSocketId ? "Remote User" : "Waiting for another user..."}</h3>
          <video ref={remoteVideoRef} autoPlay playsInline style={{ width: "300px", border: "2px solid black" }} />
        </div>
      </div>
    </div>
  );
};

export default VideoCall;
