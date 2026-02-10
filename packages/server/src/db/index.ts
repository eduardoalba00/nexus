import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema/users.js";

export function createDatabase(dbPath: string) {
  const client = createClient({ url: `file:${dbPath}` });

  const db = drizzle(client, { schema });
  return { db, client };
}

export type AppDatabase = ReturnType<typeof createDatabase>["db"];
