import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";

const socket = io("http://192.168.1.11:5003");
 // Change if backend is on another port

const VideoCall = () => {
  const { roomId } = useParams();
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const myVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);
  const localStream = useRef(null); // ✅ Using useRef instead of useState

  useEffect(() => {
    socket.emit("join-room", roomId);

    socket.on("user-connected", async (socketId) => {
      if (!socketId) {
        console.error("Received null user ID.");
        return;
      }
      console.log("User connected:", socketId);
      setRemoteSocketId(socketId);
      startCall(socketId);
    });

    socket.on("user-disconnected", (socketId) => {
      console.log("User disconnected:", socketId);
      if (remoteSocketId === socketId) {
        setRemoteSocketId(null);
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
      }
    });

    startLocalStream();

    return () => {
      socket.off("user-connected");
      socket.off("user-disconnected");
      if (peerConnection.current) peerConnection.current.close();
    };
  }, [roomId, remoteSocketId]);

  const startLocalStream = async () => {
    try {
      if (localStream.current) {
        localStream.current.getTracks().forEach(track => track.stop()); 
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStream.current = stream;
      myVideoRef.current.srcObject = stream;
    } catch (error) {
      console.error("Error accessing media devices:", error);
      alert("Please allow camera & microphone access, or check if another app is using them.");
    }
  };

  const startCall = async () => {
    if (!localStream.current) {
      console.error("Local stream is not available.");
      return;
    }
  
    peerConnection.current = new RTCPeerConnection();
    localStream.current.getTracks().forEach(track => peerConnection.current.addTrack(track, localStream.current));
    
    const offer = await peerConnection.current.createOffer();
    await peerConnection.current.setLocalDescription(offer);
  
    socket.emit("offer", { offer });
  };

  socket.on("offer", async ({ offer, from }) => {
    peerConnection.current = new RTCPeerConnection();

    localStream.current.getTracks().forEach((track) => {
      peerConnection.current.addTrack(track, localStream.current);
    });

    peerConnection.current.ontrack = (event) => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
    };

    await peerConnection.current.setRemoteDescription(offer);
    const answer = await peerConnection.current.createAnswer();
    await peerConnection.current.setLocalDescription(answer);

    socket.emit("answer", { answer, to: from });
  });

  socket.on("answer", async ({ answer }) => {
    await peerConnection.current.setRemoteDescription(answer);
  });

  const toggleAudio = () => {
    if (localStream.current) {
      localStream.current.getAudioTracks()[0].enabled = isAudioMuted;
      setIsAudioMuted(!isAudioMuted);
    }
  };

  const toggleVideo = () => {
    if (!localStream.current) {
      console.error("Local stream is not available.");
      return;
    }
    
    const videoTrack = localStream.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoOff(!videoTrack.enabled); // ✅ Fix: Corrected `setIsVideoMuted` to `setIsVideoOff`
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Link copied! Share it with others to join.");
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
      <div style={{ marginTop: "20px" }}>
        <button onClick={toggleAudio}>{isAudioMuted ? "Unmute" : "Mute"} Audio</button>
        <button onClick={toggleVideo}>{isVideoOff ? "Turn On" : "Turn Off"} Video</button>
      </div>
    </div>
  );
};

export default VideoCall;
