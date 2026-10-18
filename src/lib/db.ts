import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/db/schema";

const globalForDb = globalThis as unknown as { pool?: Pool };
const sslSetting = process.env.DATABASE_SSL?.trim().toLowerCase();
const useSsl = sslSetting ? sslSetting !== "false" : process.env.NODE_ENV === "production";

const pool = globalForDb.pool ?? new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  connectionTimeoutMillis: 10_000,
  idleTimeoutMillis: 30_000,
  ssl: useSsl ? { rejectUnauthorized: false } : undefined,
});

if (process.env.NODE_ENV !== "production") globalForDb.pool = pool;

// pg's Pool emits "error" on any idle client whose connection drops (ECONNRESET, remote DB
// restart, a flaky network hop) — not just on a failed query. With no listener, Node treats that
// as an uncaught exception and kills the whole process, taking down every other request with it.
// Log it and let the pool recycle the client; the next query gets a fresh connection automatically.
if (!(globalForDb as { poolErrorHandlerAttached?: boolean }).poolErrorHandlerAttached) {
  pool.on("error", (error) => {
    console.error("[db] pool connection error (non-fatal, pool will reconnect):", error instanceof Error ? error.message : error);
  });
  (globalForDb as { poolErrorHandlerAttached?: boolean }).poolErrorHandlerAttached = true;
}

export const db = drizzle(pool, { schema });

/** True once a query actually succeeds against the database; used by health checks and the WhatsApp fallback below. */
export async function dbReachable(timeoutMs = 4_000) {
  try {
    await Promise.race([
      pool.query("select 1"),
      new Promise((_resolve, reject) => setTimeout(() => reject(new Error("db health check timed out")), timeoutMs)),
    ]);
    return true;
  } catch {
    return false;
  }
}
