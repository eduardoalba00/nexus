import type { FastifyInstance } from "fastify";
import websocket from "@fastify/websocket";
import type { AuthService } from "../services/auth.js";
import type { AppDatabase } from "../db/index.js";
import { PubSub } from "./pubsub.js";
import { ConnectionManager } from "./connection.js";
import { handleConnection } from "./protocol.js";

export async function createWsHandler(
  app: FastifyInstance,
  db: AppDatabase,
  authService: AuthService,
) {
  const pubsub = new PubSub();
  const connectionManager = new ConnectionManager(pubsub);

  await app.register(websocket);

  app.get("/ws", { websocket: true }, (socket) => {
    handleConnection(socket, db, authService, connectionManager);
  });

  return { pubsub, connectionManager };
}
