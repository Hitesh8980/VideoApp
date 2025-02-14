import { useEffect, useState, useRef, useCallback } from "react";
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
  const remoteSocketIdRef = useRef(null); // To track latest remoteSocketId

  // Sync ref with state
  useEffect(() => {
    remoteSocketIdRef.current = remoteSocketId;
  }, [remoteSocketId]);

  const startLocalStream = useCallback(async () => {
    if (localStream.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStream.current = stream;
      if (myVideoRef.current) myVideoRef.current.srcObject = stream;
    } catch (error) {
      console.error("Error accessing media devices:", error);
      alert("Please allow camera & microphone access.");
      throw error;
    }
  }, []);

  const handleOffer = useCallback(async (offer, from) => {
    try {
      if (!localStream.current) await startLocalStream();

      if (peerConnection.current) {
        peerConnection.current.close();
        peerConnection.current = null;
      }

      peerConnection.current = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice-candidate", { candidate: event.candidate, to: from });
        }
      };

      peerConnection.current.ontrack = (event) => {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
      };

      localStream.current.getTracks().forEach((track) => {
        peerConnection.current.addTrack(track, localStream.current);
      });

      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);

      socket.emit("answer", { answer, to: from });
    } catch (error) {
      console.error("Error handling offer:", error);
    }
  }, [startLocalStream]);

  const startCall = useCallback(async (socketId) => {
    try {
      if (!localStream.current) await startLocalStream();

      if (peerConnection.current) {
        peerConnection.current.close();
        peerConnection.current = null;
      }

      peerConnection.current = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice-candidate", { candidate: event.candidate, to: socketId });
        }
      };

      peerConnection.current.ontrack = (event) => {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
      };

      localStream.current.getTracks().forEach((track) => {
        peerConnection.current.addTrack(track, localStream.current);
      });

      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);

      socket.emit("offer", { offer, to: socketId });
    } catch (error) {
      console.error("Error starting call:", error);
    }
  }, [startLocalStream]);

  useEffect(() => {
    socket.emit("join-room", roomId);

    const onUserConnected = async (socketId) => {
      console.log("User connected:", socketId);
      setRemoteSocketId(socketId);
      if (!peerConnection.current) await startCall(socketId);
    };

    const onUserDisconnected = (socketId) => {
      console.log("User disconnected:", socketId);
      if (remoteSocketIdRef.current === socketId) {
        setRemoteSocketId(null);
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
        peerConnection.current?.close();
        peerConnection.current = null;
      }
    };

    const onOffer = async ({ offer, from }) => {
      console.log("Received Offer:", from);
      await handleOffer(offer, from);
    };

    const onAnswer = async ({ answer }) => {
      console.log("Received Answer");
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
    };

    const onIceCandidate = ({ candidate }) => {
      if (candidate) {
        console.log("Received ICE Candidate");
        peerConnection.current?.addIceCandidate(new RTCIceCandidate(candidate));
      }
    };

    socket.on("user-connected", onUserConnected);
    socket.on("user-disconnected", onUserDisconnected);
    socket.on("offer", onOffer);
    socket.on("answer", onAnswer);
    socket.on("ice-candidate", onIceCandidate);

    startLocalStream();

    return () => {
      socket.off("user-connected", onUserConnected);
      socket.off("user-disconnected", onUserDisconnected);
      socket.off("offer", onOffer);
      socket.off("answer", onAnswer);
      socket.off("ice-candidate", onIceCandidate);
      peerConnection.current?.close();
      peerConnection.current = null;
      if (localStream.current) {
        localStream.current.getTracks().forEach(track => track.stop());
        localStream.current = null;
      }
      socket.emit("leave-room", roomId);
    };
  }, [roomId, startCall, handleOffer, startLocalStream]);

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