import { WebSocketServer, WebSocket } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

let clientCounter = 1;

wss.on('connection', (ws: WebSocket) => {
  const clientName = `Client${clientCounter++}`;
  console.log(`${clientName} connected`);

  ws.on('message', (message: Buffer) => {
    const decodedMessage = message.toString();
    console.log(`Received from ${clientName}: ${decodedMessage}`);

    // Broadcast the received message to all connected clients
    wss.clients.forEach((client: WebSocket) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ name: clientName, message: decodedMessage }));
      }
    });
  });

  ws.on('close', () => {
    console.log(`${clientName} disconnected`);
  });

  ws.send(JSON.stringify({ name: 'Server', message: `Welcome new client! You are ${clientName}` }));
});

console.log('WebSocket server is running on ws://localhost:8080');
