"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const wss = new ws_1.WebSocketServer({ port: 8080 });
let clientCounter = 1;
wss.on('connection', (ws) => {
    const clientName = `Client${clientCounter++}`;
    console.log(`${clientName} connected`);
    ws.on('message', (message) => {
        const decodedMessage = message.toString();
        console.log(`Received from ${clientName}: ${decodedMessage}`);
        // Broadcast the received message to all connected clients
        wss.clients.forEach((client) => {
            if (client.readyState === ws_1.WebSocket.OPEN) {
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
