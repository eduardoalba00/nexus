import { loadConfig } from "./config.js";
import { createDatabase } from "./db/index.js";
import { buildApp } from "./app.js";

async function main() {
  const config = loadConfig();
  const { db, client } = createDatabase(config.databasePath);

  // Enable WAL mode and foreign keys first
  await client.execute("PRAGMA journal_mode = WAL");
  await client.execute("PRAGMA foreign_keys = ON");

  // Auto-create tables if they don't exist (ordered for FK deps)
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

  await client.execute(`
    CREATE TABLE IF NOT EXISTS servers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon_url TEXT,
      owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS server_members (
      id TEXT PRIMARY KEY,
      server_id TEXT NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      joined_at INTEGER NOT NULL
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      server_id TEXT NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      position INTEGER NOT NULL DEFAULT 0
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS channels (
      id TEXT PRIMARY KEY,
      server_id TEXT NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
      category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'text',
      topic TEXT,
      position INTEGER NOT NULL DEFAULT 0
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS invites (
      id TEXT PRIMARY KEY,
      server_id TEXT NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
      code TEXT NOT NULL UNIQUE,
      creator_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      max_uses INTEGER,
      uses INTEGER NOT NULL DEFAULT 0,
      expires_at INTEGER,
      created_at INTEGER NOT NULL
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      channel_id TEXT NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
      author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      edited_at INTEGER,
      created_at INTEGER NOT NULL
    )
  `);

  const app = await buildApp(config, db);

  await app.listen({ port: config.port, host: config.host });
  console.log(`Nexus server running on http://${config.host}:${config.port}`);
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
