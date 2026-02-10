import Fastify from "fastify";
import cors from "@fastify/cors";
import type { Config } from "./config.js";
import type { AppDatabase } from "./db/index.js";
import { AuthService } from "./services/auth.js";
import { authRoutes } from "./routes/auth.js";

export async function buildApp(config: Config, db: AppDatabase) {
  const app = Fastify({
    logger: {
      transport: {
        target: "pino-pretty",
        options: { colorize: true },
      },
    },
  });

  await app.register(cors, {
    origin: true,
    credentials: true,
  });

  const authService = new AuthService(config);
  await app.register(authRoutes(db, authService));

  return app;
}
