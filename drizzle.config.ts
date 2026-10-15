import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { defineConfig } from "drizzle-kit";

// Next.js loads .env.local automatically at runtime, but drizzle-kit runs outside
// Next.js. Load the same file here so db:migrate/db:push/db:studio target the
// same database as the application. Existing shell/server env vars keep priority.
for (const file of [".env.local", ".env"]) {
  if (!existsSync(file)) continue;
  try {
    loadEnvFile(file);
  } catch (error) {
    console.warn(`Could not load ${file}:`, error);
  }
}

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
  throw new Error("DATABASE_URL is missing. Add it to .env.local or the server environment before running drizzle-kit.");
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: databaseUrl },
  strict: true,
  verbose: true,
});
