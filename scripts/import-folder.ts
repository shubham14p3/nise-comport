/**
 * Local, one-off import of every .xlsx register in a folder, straight into the database.
 * Files never leave your PC. Re-running is safe: rows already in the database are skipped.
 *
 * Usage (from the project root, in Git Bash / the shell):
 *   npx tsx scripts/import-folder.ts ./MYEXCEL
 *
 * Optional: IMPORT_AS=shubham14p3@gmail.com (default: the owner account) and
 *           IMPORT_CONTACTS=1 to also add people to WhatsApp contacts (off by default).
 */
import "./load-env";
import { readdir, stat } from "node:fs/promises";
import { basename, extname, join, resolve } from "node:path";
import ExcelJS from "exceljs";
import { eq } from "drizzle-orm";
import { users } from "@/db/schema";
import { db } from "@/lib/db";
import { importRecords } from "@/lib/records";
import type { SheetInput } from "@/lib/record-import";
import { vaultReady } from "@/lib/vault";

function sheetsFrom(workbook: ExcelJS.Workbook): SheetInput[] {
  return workbook.worksheets.map((sheet) => {
    const rows: unknown[][] = [];
    sheet.eachRow({ includeEmpty: false }, (row) => {
      const values = Array.isArray(row.values) ? row.values.slice(1, 81) : [];
      rows.push(values.map((value) => value ?? null));
    });
    return { name: sheet.name.slice(0, 60), rows };
  });
}

async function main() {
  const folder = resolve(process.argv[2] ?? "./MYEXCEL");
  if (!(await stat(folder)).isDirectory()) throw new Error(`Not a folder: ${folder}`);
  if (!vaultReady()) throw new Error("RECORDS_ENCRYPTION_KEY (or PAN_ENCRYPTION_KEY) is missing in .env.local.");

  const email = (process.env.IMPORT_AS ?? "shubham14p3@gmail.com").trim().toLowerCase();
  const [actor] = await db.select({ id: users.id, name: users.name, role: users.role }).from(users).where(eq(users.email, email)).limit(1);
  if (!actor || actor.role !== "admin") throw new Error(`No admin account for ${email}. Sign up with it first, then promote it.`);

  const files = (await readdir(folder))
    .filter((name) => extname(name).toLowerCase() === ".xlsx" && !name.startsWith("~$"))
    .sort();
  if (!files.length) throw new Error(`No .xlsx files found in ${folder}. Extract any zip files first.`);
  console.log(`Found ${files.length} workbook(s) in ${folder}`);

  const totals = { imported: 0, duplicates: 0, failed: 0 };
  for (const name of files) {
    const started = Date.now();
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(join(folder, name));
      const result = await importRecords(name, sheetsFrom(workbook), { id: actor.id, name: actor.name }, { addContacts: process.env.IMPORT_CONTACTS === "1" });
      totals.imported += result.imported;
      totals.duplicates += result.duplicates;
      console.log(`✓ ${name}: ${result.imported} new, ${result.duplicates} already there, ${result.skipped} skipped (${Math.round((Date.now() - started) / 1000)}s)`);
    } catch (error) {
      totals.failed += 1;
      console.log(`✗ ${name}: ${error instanceof Error ? error.message : error}`);
    }
  }
  console.log(`\nDone. ${totals.imported} new records, ${totals.duplicates} already there, ${totals.failed} file(s) failed.`);
  process.exit(0);
}

main().catch((error) => {
  console.error("Import stopped:", error instanceof Error ? error.message : error);
  process.exit(1);
});
