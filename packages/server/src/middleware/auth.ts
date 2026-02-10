import type { FastifyRequest, FastifyReply } from "fastify";
import type { AuthService, JwtPayload } from "../services/auth.js";

declare module "fastify" {
  interface FastifyRequest {
    user: JwtPayload;
  }
}

export function createAuthMiddleware(authService: AuthService) {
  return async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return reply.status(401).send({ error: "Missing or invalid authorization header" });
    }

    const token = authHeader.slice(7);
    try {
      request.user = await authService.verifyAccessToken(token);
    } catch {
      return reply.status(401).send({ error: "Invalid or expired token" });
    }
  };
}
