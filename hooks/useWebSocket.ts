import { useEffect, useState } from "react";

interface Message {
  type: string;
  message?: string;
  data?: any;
}

const useWebSocket = (url: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [videoDataCallback, setVideoDataCallback] = useState<((videoData: Blob) => void) | null>(null);

  useEffect(() => {
    const socket = new WebSocket(url);
    setWs(socket);

    socket.onopen = () => {
      console.log("Connected to WebSocket server");
    };

    socket.onmessage = async (event) => {
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
        try {
          const blobData = await blobToArrayBuffer(event.data);
          const blob = new Blob([blobData], { type: event.data.type });
          
          if (videoDataCallback) {
            console.log("Received video data", blob);
            videoDataCallback(blob);
          } else {
            console.error("Video data callback is not defined");
          }
        } catch (error) {
          console.error("Error converting binary data to Blob:", error);
        }
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
  }, [url, videoDataCallback]);

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
      console.log("Sending video stream to server");

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

  const blobToArrayBuffer = (blob: Blob): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(reader.result);
        } else {
          reject(new Error("Failed to read binary data as ArrayBuffer"));
        }
      };
      reader.onerror = () => {
        reject(reader.error);
      };
      reader.readAsArrayBuffer(blob);
    });
  };

  return { messages, sendMessage, sendVideo, joinRoom, leaveRoom, setVideoDataCallback };
};

export default useWebSocket;
