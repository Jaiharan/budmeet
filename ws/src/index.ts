import { WebSocketServer, WebSocket } from 'ws';

const wss = new WebSocketServer({ port: 8080 });
const rooms = new Map<string, Set<WebSocket>>();

let clientCounter = 1;

wss.on('connection', (ws: WebSocket) => {
  const clientName = `Client${clientCounter++}`;
  console.log(`${clientName} connected`);

  ws.on('message', (message: Buffer) => {
    const decodedMessage = message.toString();
    const { type, roomId, content } = JSON.parse(decodedMessage);

    switch (type) {
      case 'join':
        if(!rooms.has(roomId)) {
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
          if(client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'chat', message: content }));
          }
        });
        console.log(`Received from ${clientName}: ${decodedMessage}`);
        break;
      case 'video':
        rooms.get(roomId)?.forEach((client) => {
          if(client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(message);
          }
        });
        break;
      default:
        console.error('Invalid message type', type);
    }
  });

  ws.on('close', () => {
    console.log(`${clientName} disconnected`);
  });

  ws.send(JSON.stringify({ name: 'Server', message: `Welcome new client! You are ${clientName}` }));
});

console.log('WebSocket server is running on ws://localhost:8080');
