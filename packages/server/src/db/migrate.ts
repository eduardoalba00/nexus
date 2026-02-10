import { migrate } from "drizzle-orm/libsql/migrator";
import { loadConfig } from "../config.js";
import { createDatabase } from "./index.js";

const config = loadConfig();
const { db } = createDatabase(config.databasePath);

await migrate(db, { migrationsFolder: "./drizzle" });
console.log("Migrations applied successfully");
