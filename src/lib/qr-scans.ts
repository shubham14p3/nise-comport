import { desc, gte, sql } from "drizzle-orm";
import { qrScans } from "@/db/schema";
import { db } from "@/lib/db";

export const QR_DEVICES = ["ios", "android", "desktop"] as const;
export const QR_ACTIONS = ["whatsapp", "gmail", "email", "login"] as const;

/** Clean, bounded values only: the counts table can never fill up with junk. */
export function cleanSource(value: unknown) {
  const text = typeof value === "string" ? value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 20) : "";
  return text || "qr";
}

const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());

/** Counts one scan, or one button tap on the welcome page. Stores no name, IP, cookie or phone. */
export async function recordQr(input: { source: unknown; device: unknown; action?: unknown }) {
  const source = cleanSource(input.source);
  const device = (QR_DEVICES as readonly string[]).includes(String(input.device)) ? String(input.device) : "desktop";
  const action = (QR_ACTIONS as readonly string[]).find((item) => item === input.action);
  const day = today();
  if (action) {
    await db.insert(qrScans).values({ day, source, device, scans: 0, clicks: { [action]: 1 } })
      .onConflictDoUpdate({ target: [qrScans.day, qrScans.source, qrScans.device], set: { clicks: sql`jsonb_set(${qrScans.clicks}, ${`{${action}}`}, (coalesce((${qrScans.clicks}->>${action})::int, 0) + 1)::text::jsonb)` } });
  } else {
    await db.insert(qrScans).values({ day, source, device, scans: 1 })
      .onConflictDoUpdate({ target: [qrScans.day, qrScans.source, qrScans.device], set: { scans: sql`${qrScans.scans} + 1` } });
  }
}

export async function qrSummary(days = 30) {
  const since = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date(Date.now() - days * 86_400_000));
  const rows = await db.select().from(qrScans).where(gte(qrScans.day, since)).orderBy(desc(qrScans.day));
  return { days, rows: rows.map((row) => ({ day: row.day, source: row.source, device: row.device, scans: row.scans, clicks: row.clicks })) };
}
