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
      try {
        const data: Message = JSON.parse(event.data);
        setMessages((prevMessages) => [...prevMessages, data]);

        if (data.type === "video") {
          handleVideoMessage(data.data);
        }
      } catch (error) {
        console.error("Error parsing message:", error);
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
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          ws.send(event.data);
        }
      };
      mediaRecorder.start();
    }
  };

  const handleVideoMessage = (videoData: Blob | ArrayBuffer) => {
    const videoUrl = URL.createObjectURL(new Blob([videoData], { type: "video/webm" }));
    const videoElement = document.createElement("video");
    videoElement.src = videoUrl;
    videoElement.autoplay = true;
    document.body.appendChild(videoElement);
  };

  return { messages, sendMessage, sendVideo, joinRoom, leaveRoom };
};

export default useWebSocket;
