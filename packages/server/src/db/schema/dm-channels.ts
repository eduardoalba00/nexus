import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { users } from "./users.js";

export const dmChannels = sqliteTable("dm_channels", {
  id: text("id").primaryKey(),
  lastMessageAt: integer("last_message_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const dmMembers = sqliteTable("dm_members", {
  id: text("id").primaryKey(),
  channelId: text("channel_id").notNull().references(() => dmChannels.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
});
