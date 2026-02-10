import { eq, and } from "drizzle-orm";
import type { AppDatabase } from "../db/index.js";
import { servers } from "../db/schema/servers.js";
import { serverMembers } from "../db/schema/servers.js";

export class ServerService {
  constructor(private db: AppDatabase) {}

  async getServerOrNull(serverId: string) {
    return this.db.select().from(servers).where(eq(servers.id, serverId)).get();
  }

  async isOwner(serverId: string, userId: string): Promise<boolean> {
    const server = await this.getServerOrNull(serverId);
    return server?.ownerId === userId;
  }

  async isMember(serverId: string, userId: string): Promise<boolean> {
    const member = await this.db
      .select()
      .from(serverMembers)
      .where(
        and(
          eq(serverMembers.serverId, serverId),
          eq(serverMembers.userId, userId),
        ),
      )
      .get();
    return !!member;
  }
}
