import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { users } from "./users.js";

export const readStates = sqliteTable("read_states", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  channelId: text("channel_id").notNull(),
  lastReadMessageId: text("last_read_message_id"),
  mentionCount: integer("mention_count").notNull().default(0),
});
