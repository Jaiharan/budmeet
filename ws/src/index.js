"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const wss = new ws_1.WebSocketServer({ port: 8080 });
const rooms = new Map();
let clientCounter = 1;
wss.on('connection', (ws) => {
    const clientName = `Client${clientCounter++}`;
    console.log(`${clientName} connected`);
    ws.on('message', (message) => {
        var _a, _b, _c, _d;
        const decodedMessage = message.toString();
        const { type, roomId, content } = JSON.parse(decodedMessage);
        switch (type) {
            case 'join':
                if (!rooms.has(roomId)) {
                    rooms.set(roomId, new Set());
                }
                (_a = rooms.get(roomId)) === null || _a === void 0 ? void 0 : _a.add(ws);
                ws.send(JSON.stringify({ type: 'system', message: `Joined room ${roomId}` }));
                break;
            case 'leave':
                (_b = rooms.get(roomId)) === null || _b === void 0 ? void 0 : _b.delete(ws);
                ws.send(JSON.stringify({ type: 'system', message: `Left room ${roomId}` }));
                break;
            case 'message':
                (_c = rooms.get(roomId)) === null || _c === void 0 ? void 0 : _c.forEach((client) => {
                    if (client !== ws && client.readyState === ws_1.WebSocket.OPEN) {
                        client.send(JSON.stringify({ type: 'chat', message: content }));
                    }
                });
                console.log(`Received from ${clientName}: ${decodedMessage}`);
                break;
            case 'video':
                (_d = rooms.get(roomId)) === null || _d === void 0 ? void 0 : _d.forEach((client) => {
                    if (client !== ws && client.readyState === ws_1.WebSocket.OPEN) {
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
