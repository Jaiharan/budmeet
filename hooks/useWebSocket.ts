import { useEffect, useState } from "react";

interface Message {
  type: string;
  message?: string;
  data?: any;
}

const useWebSocket = (url: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    const socket = new WebSocket(url);
    setWs(socket);

    socket.onopen = () => {
      console.log("Connected to WebSocket server");
    };

    socket.onmessage = (event) => {
      if (typeof event.data === 'string') {
        try {
          const data: Message = JSON.parse(event.data);
          setMessages((prevMessages) => [...prevMessages, data]);

          if (data.type === "videoRoomId") {
            console.log("Room ID set for video streaming:", data.message);
          }
        } catch (error) {
          console.error("Error parsing message:", error);
        }
      } else if (event.data instanceof Blob) {
        // Handle binary data (video)
        handleVideoMessage(event.data);
      }
    };

    socket.onclose = () => {
      console.log("Disconnected from WebSocket server");
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      socket.close();
    };
  }, [url]);

  const joinRoom = (roomId: string) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "join", roomId }));
    }
  };

  const leaveRoom = (roomId: string) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "leave", roomId }));
    }
  };

  const sendMessage = (roomId: string, message: string) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "message", roomId, content: message }));
    }
  };

  const sendVideo = (roomId: string, stream: MediaStream) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      console.log("Came to useWebSocket");
      
      // Send room ID as a JSON message
      ws.send(JSON.stringify({ type: 'videoRoomId', roomId }));
  
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp8' });
  
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log("Recording video data", event.data);
          
          // Send video data as binary
          ws.send(event.data);
        }
      };
  
      mediaRecorder.onstart = () => {
        console.log("MediaRecorder started");
      };
  
      mediaRecorder.start(100);  // Send data every 100ms
    }
  };

  const handleVideoMessage = (videoData: Blob) => {
    const videoUrl = URL.createObjectURL(videoData);
    const videoElement = document.createElement("video");
    videoElement.src = videoUrl;
    videoElement.autoplay = true;
    document.body.appendChild(videoElement);
  };

  return { messages, sendMessage, sendVideo, joinRoom, leaveRoom };
};

export default useWebSocket;
