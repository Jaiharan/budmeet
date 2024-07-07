import { WebSocketServer, WebSocket as WS } from 'ws';

interface CustomWebSocket extends WS {
  roomId?: string;
}

const wss = new WebSocketServer({ port: 8080 });
const rooms = new Map<string, Set<WS>>();

let clientCounter = 1;

wss.on('connection', (ws: CustomWebSocket) => {
  const clientName = `Client${clientCounter++}`;
  console.log(`${clientName} connected`);

  ws.on('message', (message: Buffer, isBinary: boolean) => {
    if (isBinary) {
      // Handle binary message (video data)
      const roomId = ws.roomId;
      if (roomId && rooms.has(roomId)) {
        rooms.get(roomId)?.forEach((client) => {
          if (client !== ws && client.readyState === WS.OPEN) {
            client.send(message);
            console.log(`Broadcasting video data from ${clientName}`);
          }
        });
      } else {
        console.error('Received binary data without a valid room ID');
      }
    } else {
      // Handle JSON message (room ID or chat message)
      const decodedMessage = message.toString();
      const { type, roomId, content } = JSON.parse(decodedMessage);

      switch (type) {
        case 'videoRoomId':
          ws.roomId = roomId;
          break;
        case 'join':
          if (!rooms.has(roomId)) {
            rooms.set(roomId, new Set());
          }
          rooms.get(roomId)?.add(ws);
          ws.send(JSON.stringify({ type: 'system', message: `Joined room ${roomId}` }));
          break;
        case 'leave':
          rooms.get(roomId)?.delete(ws);
          ws.send(JSON.stringify({ type: 'system', message: `Left room ${roomId}` }));
          break;
        case 'message':
          rooms.get(roomId)?.forEach((client) => {
            if (client !== ws && client.readyState === WS.OPEN) {
              client.send(JSON.stringify({ type: 'chat', message: content }));
            }
          });
          console.log(`Received from ${clientName}: ${decodedMessage}`);
          break;
        default:
          console.error('Invalid message type', type);
      }
    }
  });

  ws.on('close', () => {
    console.log(`${clientName} disconnected`);
    rooms.forEach((clients, roomId) => {
      clients.delete(ws);
      if (clients.size === 0) {
        rooms.delete(roomId);
      }
    });
  });

  ws.send(JSON.stringify({ name: 'Server', message: `Welcome new client! You are ${clientName}` }));
});

console.log('WebSocket server is running on ws://localhost:8080');
