// src/websocket.ts
import { Server, WebSocket } from 'ws';
import http from 'http';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';

interface ExtendedWebSocket extends WebSocket {
  userId?: string;
  connectionId?: string;
}

export const initWebSocket = (server: http.Server) => {
  const wss = new Server({ server });

  wss.on('connection', (ws: ExtendedWebSocket, req) => {
    // 1) Authenticate the user from the token query‐param
    const token = new URLSearchParams(req.url?.split('?')[1]).get('authorization');
    if (!token) return ws.close();

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { user_id: string };
      ws.userId = decoded.user_id;
      console.log(`✅ User connected: ${ws.userId}`);
    } catch {
      console.log('❌ Invalid token');
      return ws.close();
    }

    // 2) Send the very first “connect” message: 
    //    this resolves `StableWSConnection.connectionOpen`
    const connId = randomUUID();
    ws.connectionId = connId;
    ws.send(
      JSON.stringify({
        connection_id: connId,
        me: { id: ws.userId },    // minimal “me” object
      })
    );

    ws.on('message', (data) => {
      let msg: any;
      try {
        msg = JSON.parse(data.toString());
      } catch {
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
