import type { WebSocket } from "ws";
import { eq } from "drizzle-orm";
import { WsOpcode } from "@nexus/shared";
import type { AuthService } from "../services/auth.js";
import type { AppDatabase } from "../db/index.js";
import { serverMembers } from "../db/schema/servers.js";
import type { ConnectionManager } from "./connection.js";

const HEARTBEAT_INTERVAL = 30_000;
const HEARTBEAT_TIMEOUT = 45_000;

export function handleConnection(
  socket: WebSocket,
  db: AppDatabase,
  authService: AuthService,
  connectionManager: ConnectionManager,
) {
  let userId: string | null = null;
  let identified = false;

  // Must identify within 10 seconds
  const identifyTimeout = setTimeout(() => {
    if (!identified) {
      socket.close(4001, "Identify timeout");
    }
  }, 10_000);

  socket.on("message", async (raw) => {
    let msg: any;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }

    if (msg.op === WsOpcode.IDENTIFY && !identified) {
      clearTimeout(identifyTimeout);

      try {
        const payload = await authService.verifyAccessToken(msg.d?.token);
        userId = payload.sub;
        identified = true;

        // Get user's server memberships
        const memberships = await db
          .select()
          .from(serverMembers)
          .where(eq(serverMembers.userId, userId))
          .all();

        const serverIds = memberships.map((m) => m.serverId);
        const conn = connectionManager.add(userId, socket, serverIds);

        // Start heartbeat
        conn.alive = true;
        conn.heartbeatTimer = setInterval(() => {
          if (!conn.alive) {
            socket.close(4002, "Heartbeat timeout");
            return;
          }
          conn.alive = false;
        }, HEARTBEAT_TIMEOUT);

        // Send READY
        socket.send(
          JSON.stringify({
            op: WsOpcode.READY,
            d: { heartbeatInterval: HEARTBEAT_INTERVAL },
          }),
        );
      } catch {
        socket.close(4003, "Authentication failed");
      }
      return;
    }

    if (msg.op === WsOpcode.HEARTBEAT && identified && userId) {
      const conn = connectionManager.get(userId);
      if (conn) conn.alive = true;

      socket.send(
        JSON.stringify({
          op: WsOpcode.HEARTBEAT_ACK,
          d: null,
        }),
      );
      return;
    }
  });

  socket.on("close", () => {
    clearTimeout(identifyTimeout);
    if (userId) {
      connectionManager.remove(userId);
    }
  });
}
