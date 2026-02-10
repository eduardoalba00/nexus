import type { FastifyInstance } from "fastify";
import { eq, and, lt, desc, asc } from "drizzle-orm";
import { MESSAGE_ROUTES, sendMessageSchema, editMessageSchema, getMessagesSchema } from "@nexus/shared";
import type { AppDatabase } from "../db/index.js";
import { messages } from "../db/schema/messages.js";
import { channels } from "../db/schema/channels.js";
import { users } from "../db/schema/users.js";
import { serverMembers } from "../db/schema/servers.js";
import type { AuthService } from "../services/auth.js";
import { createAuthMiddleware } from "../middleware/auth.js";
import { fastifyRoute } from "../lib/route-utils.js";
import type { PubSub } from "../ws/pubsub.js";

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

export function messageRoutes(
  db: AppDatabase,
  authService: AuthService,
  pubsub: PubSub,
) {
  return async function (app: FastifyInstance) {
    const requireAuth = createAuthMiddleware(authService);

    // Helper: get channel and verify membership
    async function getChannelAndVerify(channelId: string, userId: string) {
      const channel = await db
        .select()
        .from(channels)
        .where(eq(channels.id, channelId))
        .get();

      if (!channel) return { error: "Channel not found", status: 404, channel: null };

      const member = await db
        .select()
        .from(serverMembers)
        .where(
          and(
            eq(serverMembers.serverId, channel.serverId),
            eq(serverMembers.userId, userId),
          ),
        )
        .get();

      if (!member) return { error: "Not a member of this server", status: 403, channel: null };

      return { error: null, status: 200, channel };
    }

    // POST /api/channels/:channelId/messages — send message
    app.post(fastifyRoute(MESSAGE_ROUTES.CREATE), { preHandler: requireAuth }, async (request, reply) => {
      const { channelId } = request.params as { channelId: string };

      const { error, status, channel } = await getChannelAndVerify(channelId, request.user.sub);
      if (error) return reply.status(status).send({ error });

      const parsed = sendMessageSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: "Validation failed", issues: parsed.error.issues });
      }

      const id = crypto.randomUUID();
      const now = new Date();

      await db.insert(messages).values({
        id,
        channelId,
        authorId: request.user.sub,
        content: parsed.data.content,
        createdAt: now,
      }).run();

      const author = (await db.select().from(users).where(eq(users.id, request.user.sub)).get())!;

      const messageData = {
        id,
        channelId,
        author: userToPublic(author),
        content: parsed.data.content,
        editedAt: null,
        createdAt: now.toISOString(),
      };

      pubsub.publish(`server:${channel!.serverId}`, {
        op: 0,
        t: "MESSAGE_CREATE",
        d: messageData,
      });

      return reply.status(201).send(messageData);
    });

    // GET /api/channels/:channelId/messages — list messages (cursor pagination)
    app.get(fastifyRoute(MESSAGE_ROUTES.LIST), { preHandler: requireAuth }, async (request, reply) => {
      const { channelId } = request.params as { channelId: string };

      const { error, status } = await getChannelAndVerify(channelId, request.user.sub);
      if (error) return reply.status(status).send({ error });

      const parsed = getMessagesSchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.status(400).send({ error: "Validation failed", issues: parsed.error.issues });
      }

      const { before, limit } = parsed.data;

      let query = db
        .select()
        .from(messages)
        .innerJoin(users, eq(messages.authorId, users.id))
        .where(
          before
            ? and(eq(messages.channelId, channelId), lt(messages.id, before))
            : eq(messages.channelId, channelId),
        )
        .orderBy(desc(messages.createdAt), desc(messages.id))
        .limit(limit);

      const rows = await query.all();

      const result = rows.reverse().map((row) => ({
        id: row.messages.id,
        channelId: row.messages.channelId,
        author: userToPublic(row.users),
        content: row.messages.content,
        editedAt: row.messages.editedAt?.toISOString() ?? null,
        createdAt: row.messages.createdAt.toISOString(),
      }));

      return reply.send(result);
    });

    // PATCH /api/channels/:channelId/messages/:messageId — edit message (author only)
    app.patch(fastifyRoute(MESSAGE_ROUTES.UPDATE), { preHandler: requireAuth }, async (request, reply) => {
      const { channelId, messageId } = request.params as { channelId: string; messageId: string };

      const { error, status, channel } = await getChannelAndVerify(channelId, request.user.sub);
      if (error) return reply.status(status).send({ error });

      const message = await db
        .select()
        .from(messages)
        .where(and(eq(messages.id, messageId), eq(messages.channelId, channelId)))
        .get();

      if (!message) {
        return reply.status(404).send({ error: "Message not found" });
      }

      if (message.authorId !== request.user.sub) {
        return reply.status(403).send({ error: "You can only edit your own messages" });
      }

      const parsed = editMessageSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: "Validation failed", issues: parsed.error.issues });
      }

      const now = new Date();
      await db
        .update(messages)
        .set({ content: parsed.data.content, editedAt: now })
        .where(eq(messages.id, messageId))
        .run();

      const author = (await db.select().from(users).where(eq(users.id, request.user.sub)).get())!;

      const messageData = {
        id: messageId,
        channelId,
        author: userToPublic(author),
        content: parsed.data.content,
        editedAt: now.toISOString(),
        createdAt: message.createdAt.toISOString(),
      };

      pubsub.publish(`server:${channel!.serverId}`, {
        op: 0,
        t: "MESSAGE_UPDATE",
        d: messageData,
      });

      return reply.send(messageData);
    });

    // DELETE /api/channels/:channelId/messages/:messageId — delete (author or server owner)
    app.delete(fastifyRoute(MESSAGE_ROUTES.DELETE), { preHandler: requireAuth }, async (request, reply) => {
      const { channelId, messageId } = request.params as { channelId: string; messageId: string };

      const { error, status, channel } = await getChannelAndVerify(channelId, request.user.sub);
      if (error) return reply.status(status).send({ error });

      const message = await db
        .select()
        .from(messages)
        .where(and(eq(messages.id, messageId), eq(messages.channelId, channelId)))
        .get();

      if (!message) {
        return reply.status(404).send({ error: "Message not found" });
      }

      // Allow author or server owner to delete
      const server = await db
        .select()
        .from(
          // Use channels to find the server
          channels,
        )
        .where(eq(channels.id, channelId))
        .get();

      if (message.authorId !== request.user.sub) {
        // Check if user is server owner
        const { servers } = await import("../db/schema/servers.js");
        const srv = await db
          .select()
          .from(servers)
          .where(eq(servers.id, channel!.serverId))
          .get();
        if (!srv || srv.ownerId !== request.user.sub) {
          return reply.status(403).send({ error: "You can only delete your own messages" });
        }
      }

      await db.delete(messages).where(eq(messages.id, messageId)).run();

      pubsub.publish(`server:${channel!.serverId}`, {
        op: 0,
        t: "MESSAGE_DELETE",
        d: { id: messageId, channelId },
      });

      return reply.status(204).send();
    });
  };
}
