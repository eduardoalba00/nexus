import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as usersSchema from "./schema/users.js";
import * as serversSchema from "./schema/servers.js";
import * as channelsSchema from "./schema/channels.js";
import * as invitesSchema from "./schema/invites.js";
import * as messagesSchema from "./schema/messages.js";

const schema = {
  ...usersSchema,
  ...serversSchema,
  ...channelsSchema,
  ...invitesSchema,
  ...messagesSchema,
};

export function createDatabase(dbPath: string) {
  const client = createClient({ url: `file:${dbPath}` });

  const db = drizzle(client, { schema });
  return { db, client };
}

export type AppDatabase = ReturnType<typeof createDatabase>["db"];
