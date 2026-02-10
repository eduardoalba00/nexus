import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { servers } from "./servers.js";

export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(),
  serverId: text("server_id")
    .notNull()
    .references(() => servers.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  position: integer("position").notNull().default(0),
});

export const channels = sqliteTable("channels", {
  id: text("id").primaryKey(),
  serverId: text("server_id")
    .notNull()
    .references(() => servers.id, { onDelete: "cascade" }),
  categoryId: text("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  name: text("name").notNull(),
  type: text("type", { enum: ["text", "voice"] }).notNull().default("text"),
  topic: text("topic"),
  position: integer("position").notNull().default(0),
});
