"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const wss = new ws_1.WebSocketServer({ port: 8080 });
const rooms = new Map();
let clientCounter = 1;
wss.on('connection', (ws) => {
    const clientName = `Client${clientCounter++}`;
    console.log(`${clientName} connected`);
    ws.on('message', (message, isBinary) => {
        var _a, _b, _c, _d;
        if (isBinary) {
            // Handle binary message (video data)
            const roomId = ws.roomId;
            if (roomId && rooms.has(roomId)) {
                (_a = rooms.get(roomId)) === null || _a === void 0 ? void 0 : _a.forEach((client) => {
                    if (client !== ws && client.readyState === ws_1.WebSocket.OPEN) {
                        // Ensure `message` is sent as binary data
                        client.send(message, { binary: true });
                        // console.log(message.toString());
                        console.log(`Broadcasting video data from ${clientName}`);
                    }
                });
            }
            else {
                console.error('Received binary data without a valid room ID');
            }
        }
        else {
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
                    (_b = rooms.get(roomId)) === null || _b === void 0 ? void 0 : _b.add(ws);
                    ws.send(JSON.stringify({ type: 'system', message: `Joined room ${roomId}` }));
                    break;
                case 'leave':
                    (_c = rooms.get(roomId)) === null || _c === void 0 ? void 0 : _c.delete(ws);
                    ws.send(JSON.stringify({ type: 'system', message: `Left room ${roomId}` }));
                    break;
                case 'message':
                    (_d = rooms.get(roomId)) === null || _d === void 0 ? void 0 : _d.forEach((client) => {
                        if (client !== ws && client.readyState === ws_1.WebSocket.OPEN) {
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
