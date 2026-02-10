import { loadConfig } from "./config.js";
import { createDatabase } from "./db/index.js";
import { buildApp } from "./app.js";

async function main() {
  const config = loadConfig();
  const { db, client } = createDatabase(config.databasePath);

  // Auto-create tables if they don't exist (dev convenience)
  await client.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      avatar_url TEXT,
      password_hash TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'offline',
      custom_status TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  // Enable WAL mode
  await client.execute("PRAGMA journal_mode = WAL");
  await client.execute("PRAGMA foreign_keys = ON");

  const app = await buildApp(config, db);

  await app.listen({ port: config.port, host: config.host });
  console.log(`Nexus server running on http://${config.host}:${config.port}`);
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
