import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { registerSchema, loginSchema, refreshSchema, AUTH_ROUTES } from "@nexus/shared";
import type { AppDatabase } from "../db/index.js";
import { users } from "../db/schema/users.js";
import type { AuthService } from "../services/auth.js";
import { createAuthMiddleware } from "../middleware/auth.js";

function userToPublic(user: typeof users.$inferSelect) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    status: user.status,
    customStatus: user.customStatus,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export function authRoutes(db: AppDatabase, authService: AuthService) {
  return async function (app: FastifyInstance) {
    const requireAuth = createAuthMiddleware(authService);

    // POST /api/auth/register
    app.post(AUTH_ROUTES.REGISTER, async (request, reply) => {
      const parsed = registerSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: "Validation failed", issues: parsed.error.issues });
      }

      const { username, displayName, password } = parsed.data;

      const existing = await db.select().from(users).where(eq(users.username, username)).get();
      if (existing) {
        return reply.status(409).send({ error: "Username already taken" });
      }

      const passwordHash = await authService.hashPassword(password);
      const id = crypto.randomUUID();
      const now = new Date();

      await db.insert(users)
        .values({
          id,
          username,
          displayName: displayName || username,
          passwordHash,
          createdAt: now,
          updatedAt: now,
        })
        .run();

      const user = (await db.select().from(users).where(eq(users.id, id)).get())!;
      const tokens = await authService.generateTokenPair(user.id, user.username);

      return reply.status(201).send({
        user: userToPublic(user),
        tokens,
      });
    });

    // POST /api/auth/login
    app.post(AUTH_ROUTES.LOGIN, async (request, reply) => {
      const parsed = loginSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: "Validation failed", issues: parsed.error.issues });
      }

      const { username, password } = parsed.data;

      const user = await db.select().from(users).where(eq(users.username, username)).get();
      if (!user) {
        return reply.status(401).send({ error: "Invalid username or password" });
      }

      const valid = await authService.verifyPassword(user.passwordHash, password);
      if (!valid) {
        return reply.status(401).send({ error: "Invalid username or password" });
      }

      const tokens = await authService.generateTokenPair(user.id, user.username);

      return reply.status(200).send({
        user: userToPublic(user),
        tokens,
      });
    });

    // POST /api/auth/refresh
    app.post(AUTH_ROUTES.REFRESH, async (request, reply) => {
      const parsed = refreshSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: "Validation failed", issues: parsed.error.issues });
      }

      try {
        const payload = await authService.verifyRefreshToken(parsed.data.refreshToken);
        const user = await db.select().from(users).where(eq(users.id, payload.sub)).get();
        if (!user) {
          return reply.status(401).send({ error: "User not found" });
        }

        const tokens = await authService.generateTokenPair(user.id, user.username);

        return reply.status(200).send({
          user: userToPublic(user),
          tokens,
        });
      } catch {
        return reply.status(401).send({ error: "Invalid or expired refresh token" });
      }
    });

    // GET /api/auth/me
    app.get(AUTH_ROUTES.ME, { preHandler: requireAuth }, async (request, reply) => {
      const user = await db.select().from(users).where(eq(users.id, request.user.sub)).get();
      if (!user) {
        return reply.status(404).send({ error: "User not found" });
      }

      return reply.status(200).send({ user: userToPublic(user) });
    });
  };
}
