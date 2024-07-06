"use client";
import { useState, useRef } from "react";
import useWebSocket from "@/hooks/useWebSocket";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

const WebSocketComponent = () => {
  const { messages, joinRoom, leaveRoom, sendMessage, sendVideo } =
    useWebSocket("ws://localhost:8080");
  const [roomId, setRoomId] = useState("");
  const [input, setInput] = useState("");
  const [joined, setJoined] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleJoinRoom = () => {
    joinRoom(roomId);
    setJoined(true);
  };

  const handleLeaveRoom = () => {
    leaveRoom(roomId);
    setJoined(false);
  };

  const handleSendMessage = () => {
    sendMessage(roomId, input);
    setInput("");
  };

  const handleStartVideo = async () => {
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        sendVideo(roomId, stream);
      }
    } catch (error) {
      console.error("Error accessing media devices:", error);
    }
  } else {
    console.error("getUserMedia is not supported");
  }
};

  

  const handleStopVideo = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
  };

  return (
    <div>
      <h1 className="text-4xl m-5 font-medium">WebSocket Chat</h1>
      <div className="flex flex-col space-y-4 gap-3">
        {!joined ? (
          <>
            <Input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Enter room ID"
            />
            <Button variant="default" onClick={handleJoinRoom}>Join Room</Button>
          </>
        ) : (
          <>
            <Button variant="default" onClick={handleLeaveRoom}>Leave Room</Button>
            <Input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message"
            />
            <Button variant="default" onClick={handleSendMessage}>Send</Button>
            <Button variant="default" onClick={handleStartVideo}>Start Video</Button>
            <Button variant="default" onClick={handleStopVideo}>Stop Video</Button>
            <Card className="w-full p-4 gap-2 text-lg">
              <div>
                <h2>Messages:</h2>
                <ul>
                  {messages.map((msg, index) => (
                    <li key={index}><strong>{msg.type === 'system' ? 'System' : 'Chat'}:</strong> {msg.message}</li>
                  ))}
                </ul>
              </div>
            </Card>
            <video ref={videoRef} className="w-full" />
          </>
        )}
      </div>
    </div>
  );
};

export default WebSocketComponent;
