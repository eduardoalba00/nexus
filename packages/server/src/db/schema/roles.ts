import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { servers } from "./servers.js";

export const roles = sqliteTable("roles", {
  id: text("id").primaryKey(),
  serverId: text("server_id").notNull().references(() => servers.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  color: text("color"),
  position: integer("position").notNull().default(0),
  permissions: integer("permissions").notNull().default(0),
  isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const memberRoles = sqliteTable("member_roles", {
  id: text("id").primaryKey(),
  memberId: text("member_id").notNull(),
  roleId: text("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
  serverId: text("server_id").notNull().references(() => servers.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
});
