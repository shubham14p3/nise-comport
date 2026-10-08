/**
 * Local check: runs the same query the Admin → Records screen uses and prints what it finds.
 * Usage: npx tsx scripts/records-check.ts
 */
import "./load-env";
import { sql } from "drizzle-orm";
import { customerRecords } from "@/db/schema";
import { db } from "@/lib/db";
import { listPeople } from "@/lib/records";
import { vaultReady } from "@/lib/vault";

async function main() {
  console.log("Encryption key loaded:", vaultReady());
  const [row] = await db.select({ total: sql<number>`count(*)::int` }).from(customerRecords);
  console.log("Records in database:", row?.total ?? 0);
  const listing = await listPeople({ sort: "repeat", page: 0 });
  console.log("People the Records screen would list (page 1):", listing.people.length);
  console.log("Totals:", JSON.stringify(listing.totals));
  if (listing.people[0]) console.log("First person key type:", listing.people[0].key ? "present" : "missing", "| services:", listing.people[0].services);
  process.exit(0);
}

main().catch((error) => { console.error("Check failed:", error instanceof Error ? error.message : error); process.exit(1); });
