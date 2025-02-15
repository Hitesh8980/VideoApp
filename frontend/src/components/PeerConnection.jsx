import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

const SOCKET_SERVER_URL = "https://videoapp-q3ld.onrender.com"; // Change to your server URL

const PeerConnection = ({ roomId }) => {
  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const [remoteVideo, setRemoteVideo] = useState(null);
  const [localVideo, setLocalVideo] = useState(null);

  useEffect(() => {
    console.log("⚡ Initializing PeerConnection...");

    socketRef.current = io(SOCKET_SERVER_URL);
    socketRef.current.emit("join-room", roomId);

    socketRef.current.on("user-joined", ({ id }) => {
      console.log(`✅ user-joined event received: ${id}`);
    });

    socketRef.current.on("call-received", ({ signal, from }) => {
      console.log("📞 Incoming call from:", from);
      peerRef.current.setRemoteDescription(new RTCSessionDescription(signal));
      peerRef.current.createAnswer().then((answer) => {
        peerRef.current.setLocalDescription(answer);
        socketRef.current.emit("accept-call", { signal: answer, to: from });
      });
    });

    socketRef.current.on("call-accepted", (signal) => {
      console.log("✅ Call accepted, setting remote description...");
      peerRef.current.setRemoteDescription(new RTCSessionDescription(signal));
    });

    socketRef.current.on("ice-candidate", ({ candidate }) => {
      console.log("📡 ICE Candidate Received:", candidate);
      if (peerRef.current) {
        peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        console.log("✅ Local video stream acquired");
        localStreamRef.current = stream;
        setLocalVideo(stream);

        peerRef.current = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });

        peerRef.current.ontrack = (event) => {
          console.log("🎥 Remote stream received");
          setRemoteVideo(event.streams[0]);
        };

        peerRef.current.onicecandidate = (event) => {
          if (event.candidate) {
            console.log("📡 ICE Candidate Generated:", event.candidate);
            socketRef.current.emit("ice-candidate", { candidate: event.candidate });
          }
        };

        stream.getTracks().forEach((track) => {
          peerRef.current.addTrack(track, stream);
        });
      })
      .catch((error) => {
        console.error("❌ Error getting local stream:", error);
      });

    return () => {
      console.log("🔴 Cleaning up...");
      socketRef.current.disconnect();
      if (peerRef.current) peerRef.current.close();
    };
  }, [roomId]);

  const callUser = (userToCall) => {
    console.log("📞 Calling user:", userToCall);
    peerRef.current.createOffer().then((offer) => {
      peerRef.current.setLocalDescription(offer);
      socketRef.current.emit("call-user", {
        userToCall,
        signalData: offer,
        from: socketRef.current.id,
      });
    });
  };

  return (
    <div>
      <h2>WebRTC Video Call</h2>
      <div style={{ display: "flex", gap: "10px" }}>
        <video
          ref={(video) => video && (video.srcObject = localVideo)}
          autoPlay
          playsInline
          muted
          style={{ width: "300px", height: "200px", border: "1px solid black" }}
        />
        <video
          ref={(video) => video && (video.srcObject = remoteVideo)}
          autoPlay
          playsInline
          style={{ width: "300px", height: "200px", border: "1px solid red" }}
        />
      </div>
      <button onClick={() => callUser("other-user-id")}>Call</button>
    </div>
  );
};

export default PeerConnection;