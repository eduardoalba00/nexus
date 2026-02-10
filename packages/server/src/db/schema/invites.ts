import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { servers } from "./servers.js";
import { users } from "./users.js";

export const invites = sqliteTable("invites", {
  id: text("id").primaryKey(),
  serverId: text("server_id")
    .notNull()
    .references(() => servers.id, { onDelete: "cascade" }),
  code: text("code").notNull().unique(),
  creatorId: text("creator_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  maxUses: integer("max_uses"),
  uses: integer("uses").notNull().default(0),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});
