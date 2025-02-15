import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

const SOCKET_SERVER_URL = "https://videoapp-q3ld.onrender.com"; // Change to your actual server URL

const PeerConnection = ({ roomId }) => {
  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();

  useEffect(() => {
    console.log("⚡ Initializing PeerConnection...");

    // Connect to socket
    socketRef.current = io(SOCKET_SERVER_URL);
    socketRef.current.emit("join-room", roomId);

    socketRef.current.on("user-joined", ({ id }) => {
      console.log(`👤 User joined: ${id}`);
      callUser(id); // Automatically call the new user
    });

    socketRef.current.on("call-received", ({ signal, from }) => {
      console.log("📞 Incoming call from:", from);
      peerRef.current.setRemoteDescription(new RTCSessionDescription(signal))
        .then(() => peerRef.current.createAnswer())
        .then(answer => {
          return peerRef.current.setLocalDescription(answer);
        })
        .then(() => {
          socketRef.current.emit("accept-call", { signal: peerRef.current.localDescription, to: from });
        });
    });

    socketRef.current.on("call-accepted", (signal) => {
      console.log("✅ Call accepted, setting remote description...");
      peerRef.current.setRemoteDescription(new RTCSessionDescription(signal));
    });

    socketRef.current.on("ice-candidate", ({ candidate }) => {
      if (candidate && peerRef.current) {
        console.log("🌍 ICE Candidate Received:", candidate);
        peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    // Initialize local stream
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        console.log("✅ Local video stream acquired");
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Initialize Peer Connection
        peerRef.current = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
        });

        peerRef.current.onicecandidate = (event) => {
          if (event.candidate) {
            console.log("📡 ICE Candidate Generated:", event.candidate);
            socketRef.current.emit("ice-candidate", { candidate: event.candidate });
          }
        };

        peerRef.current.ontrack = (event) => {
          console.log("🎥 Remote stream received");
          setRemoteStream(event.streams[0]);
        };

        stream.getTracks().forEach(track => {
          peerRef.current.addTrack(track, stream);
        });
      })
      .catch(error => {
        console.error("❌ Error getting local stream:", error);
      });

    return () => {
      console.log("🔴 Cleaning up...");
      socketRef.current.disconnect();
      if (peerRef.current) peerRef.current.close();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [roomId]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const callUser = (userToCall) => {
    if (!peerRef.current) {
      console.error("Peer connection not initialized");
      return;
    }
    console.log("📞 Calling user:", userToCall);
    peerRef.current.createOffer()
      .then(offer => peerRef.current.setLocalDescription(offer))
      .then(() => {
        socketRef.current.emit("call-user", {
          userToCall,
          signalData: peerRef.current.localDescription,
          from: socketRef.current.id
        });
      })
      .catch(error => console.error("Error creating offer:", error));
  };

  return (
    <div>
      <h2>WebRTC Video Call</h2>
      <div style={{ display: "flex", gap: "10px" }}>
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          style={{ width: "300px", height: "200px", border: "1px solid black" }}
        />
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          style={{ width: "300px", height: "200px", border: "1px solid red" }}
        />
      </div>
    </div>
  );
};

export default PeerConnection;