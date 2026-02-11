import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/db/schema/*",
  out: "./drizzle",
  dbCredentials: {
    url: `file:${process.env.DATABASE_PATH || "./migo.db"}`,
  },
});
