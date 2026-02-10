import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { channels } from "./channels.js";
import { users } from "./users.js";

export const messages = sqliteTable("messages", {
  id: text("id").primaryKey(),
  channelId: text("channel_id")
    .notNull()
    .references(() => channels.id, { onDelete: "cascade" }),
  authorId: text("author_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  replyToId: text("reply_to_id"),
  editedAt: integer("edited_at", { mode: "timestamp" }),
  pinnedAt: integer("pinned_at", { mode: "timestamp" }),
  pinnedBy: text("pinned_by"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});
