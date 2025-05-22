"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initWebSocket = void 0;
// src/websocket.ts
const ws_1 = require("ws");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = require("crypto");
const initWebSocket = (server) => {
    const wss = new ws_1.Server({ server });
    wss.on('connection', (ws, req) => {
        // 1) Authenticate the user from the token query‐param
        const token = new URLSearchParams(req.url?.split('?')[1]).get('authorization');
        if (!token)
            return ws.close();
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            ws.userId = decoded.user_id;
            console.log(`✅ User connected: ${ws.userId}`);
        }
        catch {
            console.log('❌ Invalid token');
            return ws.close();
        }
        // 2) Send the very first “connect” message: 
        //    this resolves `StableWSConnection.connectionOpen`
        const connId = (0, crypto_1.randomUUID)();
        ws.connectionId = connId;
        ws.send(JSON.stringify({
            connection_id: connId,
            me: { id: ws.userId }, // minimal “me” object
        }));
        ws.on('message', (data) => {
            let msg;
            try {
                msg = JSON.parse(data.toString());
            }
            catch {
                return;
            }
            // 3) Health‐check pings come in as an array of events
            //    echo back a single health.check event so the client marks itself healthy
            if (Array.isArray(msg) && msg.some((e) => e.type === 'health.check')) {
                ws.send(JSON.stringify({ type: 'health.check' }));
                return;
            }
            // 4) Otherwise treat it as a normal chat payload and echo to all clients
            console.log(`📨 Message from ${ws.userId}:`, msg);
            wss.clients.forEach((client) => {
                if (client.readyState === ws.OPEN) {
                    client.send(JSON.stringify({ from: ws.userId, ...msg }));
                }
            });
        });
        ws.on('close', () => {
            console.log(`🚪 Disconnected: ${ws.userId}`);
        });
    });
    return wss;
};
exports.initWebSocket = initWebSocket;
