/**
 * Local, read-only audit of every imported record. Changes nothing.
 * Reports, per service, how many records follow the expected pattern and shows examples of the rest:
 *   mobile (+91 and 10 digits, starting 6–9), PAN (AAAAA9999A), Aadhaar (12 digits),
 *   date (year 1950–today), renewal date, and the shape of reference numbers (e.g. JHEWS/2022/36620).
 *
 * Usage (from the project root):   npx tsx scripts/records-audit.ts
 */
import "./load-env";
import { customerRecords } from "@/db/schema";
import { db } from "@/lib/db";
import { open } from "@/lib/vault";
import { RECORD_SERVICES } from "@/lib/record-import";

type Sealed = { mobile: string | null; whatsapp?: string | null; pan: string | null; aadhaar: string | null; fields: Record<string, string> };

const MOBILE = /^\+91[6-9]\d{9}$/;
const PAN = /^[A-Z]{5}\d{4}[A-Z]$/;
const AADHAAR = /^[2-9]\d{11}$/;
/** Reference numbers: letters become A, digits become 9, so JHEWS/2022/36620 → AAAAA/9999/99999. */
const shape = (value: string) => value.replace(/[A-Za-z]/g, "A").replace(/\d/g, "9").replace(/A+/g, "A").replace(/9+/g, "9");
const today = new Date().toISOString().slice(0, 10);

async function main() {
  const rows = await db.select({
    service: customerRecords.service, recordDate: customerRecords.recordDate, renewalOn: customerRecords.renewalOn,
    payloadEnc: customerRecords.payloadEnc, source: customerRecords.source,
  }).from(customerRecords);
  console.log(`Auditing ${rows.length.toLocaleString("en-IN")} records (read-only)\n`);

  type Stat = { total: number; noMobile: number; badMobile: number; badPan: number; badAadhaar: number; noDate: number; badDate: number; refShapes: Map<string, number>; examples: string[] };
  const stats = new Map<string, Stat>();
  for (const row of rows) {
    const stat = stats.get(row.service) ?? { total: 0, noMobile: 0, badMobile: 0, badPan: 0, badAadhaar: 0, noDate: 0, badDate: 0, refShapes: new Map(), examples: [] };
    stats.set(row.service, stat);
    stat.total++;
    const data = open<Sealed>(row.payloadEnc);
    const mobile = data.mobile ?? data.whatsapp ?? null;
    if (!mobile) stat.noMobile++;
    else if (!MOBILE.test(mobile)) { stat.badMobile++; if (stat.examples.length < 3) stat.examples.push(`mobile "${mobile}" in ${row.source}`); }
    if (data.pan && !PAN.test(data.pan)) stat.badPan++;
    if (data.aadhaar && !AADHAAR.test(data.aadhaar)) stat.badAadhaar++;
    if (!row.recordDate) stat.noDate++;
    else if (row.recordDate < "1950-01-01" || row.recordDate > today) { stat.badDate++; if (stat.examples.length < 3) stat.examples.push(`date ${row.recordDate} in ${row.source}`); }
    for (const [label, value] of Object.entries(data.fields ?? {})) {
      if (!/ref|receipt|token|application|acknow|form no|reg/i.test(label) || !value) continue;
      const key = `${label}: ${shape(value).slice(0, 40)}`;
      stat.refShapes.set(key, (stat.refShapes.get(key) ?? 0) + 1);
    }
  }

  for (const [service, stat] of [...stats.entries()].sort((a, b) => b[1].total - a[1].total)) {
    const pct = (n: number) => `${stat.total ? Math.round(((stat.total - n) / stat.total) * 100) : 100}% ok`;
    console.log(`${RECORD_SERVICES[service] ?? service}  (${stat.total.toLocaleString("en-IN")} records)`);
    console.log(`  mobile:   ${pct(stat.badMobile + stat.noMobile)}  · no mobile ${stat.noMobile}, not +91 10-digit ${stat.badMobile}`);
    if (stat.badPan) console.log(`  PAN:      ${stat.badPan} not in AAAAA9999A form`);
    if (stat.badAadhaar) console.log(`  Aadhaar:  ${stat.badAadhaar} not 12 digits`);
    console.log(`  date:     ${pct(stat.noDate + stat.badDate)}  · no date ${stat.noDate}, outside 1950–today ${stat.badDate}`);
    const shapes = [...stat.refShapes.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
    for (const [key, count] of shapes) console.log(`  reference: ${key}  × ${count}`);
    for (const example of stat.examples) console.log(`  e.g. ${example}`);
    console.log("");
  }
  process.exit(0);
}

main().catch((error) => { console.error("Audit stopped:", error instanceof Error ? error.message : error); process.exit(1); });
