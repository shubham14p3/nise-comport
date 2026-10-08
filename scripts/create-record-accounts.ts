/**
 * One-time backfill: makes a customer account for every mobile number on the imported registers
 * that does not have one yet. Safe to run again; existing accounts are left alone.
 *
 * Usage (from the project root):   npx tsx scripts/create-record-accounts.ts
 */
import "./load-env";
import { ensureRecordAccounts } from "@/lib/records";

ensureRecordAccounts()
  .then((made) => { console.log(`Accounts made: ${made.toLocaleString("en-IN")}`); process.exit(0); })
  .catch((error) => { console.error("Stopped:", error instanceof Error ? error.message : error); process.exit(1); });
