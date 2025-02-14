import React, { useEffect, useRef, useState } from "react";
import Peer from "simple-peer";

const PeerConnection = ({ socket, stream, remoteSocketId }) => {
  const [peer, setPeer] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const videoRef = useRef(null);

  useEffect(() => {
    if (!socket) {
      console.error("Socket is not initialized.");
      return;
    }
    if (!stream) {
      console.error("Local stream is missing.");
      return;
    }
    if (!remoteSocketId) {
      console.error("Remote Socket ID is missing.");
      return;
    }

    console.log("✅ All dependencies are available, initializing Peer...");

    const newPeer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    });

    newPeer.on("signal", (data) => {
      socket.emit("signal", { signal: data, to: remoteSocketId });
    });

    newPeer.on("stream", (remoteStream) => {
      console.log("📡 Received remote stream.");
      setRemoteStream(remoteStream);
      if (videoRef.current) {
        videoRef.current.srcObject = remoteStream;
      }
    });

    newPeer.on("error", (err) => {
      console.error("⚠️ Peer error:", err);
    });

    socket.on("signal", ({ signal }) => {
      newPeer.signal(signal);
    });

    setPeer(newPeer);

    return () => {
      console.log("🛑 Cleaning up Peer...");
      newPeer.destroy();
      socket.off("signal");
    };
  }, [socket, stream, remoteSocketId]);

  return (
    <div>
      <h3>Peer Connection</h3>
      {remoteStream ? (
        <video ref={videoRef} autoPlay playsInline width="300px" />
      ) : (
        <p>Waiting for remote video...</p>
      )}
    </div>
  );
};

export default PeerConnection;
