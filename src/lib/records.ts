import { and, desc, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import { contacts, customerRecords, recordImports, recordSends } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { db } from "@/lib/db";
import { PublicError } from "@/lib/errors";
import { maskAadhaar, maskPan, parseWorkbook, RECORD_SERVICES, type SheetInput } from "@/lib/record-import";
import { normalizePhone } from "@/lib/validation";
import { RECORD_STATUSES, RECORD_STATUS_KEYS } from "@/lib/record-status";
import { blindIndex, open, seal } from "@/lib/vault";

type Actor = { id: string; name: string };
type Sealed = { mobile: string | null; pan: string | null; aadhaar: string | null; whatsapp?: string | null; altMobiles?: string[]; email?: string | null; address?: string | null; fields: Record<string, string> };
type ContactInfo = { whatsapp: string | null; altMobiles: string[]; email: string | null; address: string | null };

/** Which WhatsApp-contact service an imported register belongs to. */
const CONTACT_SERVICE: Record<string, string> = {
  pan: "pan", insurance: "insurance", passport: "passport", itr: "itr", "driving-licence": "driving-licence", "aadhaar-update": "aadhaar",
  ayushman: "ayushman", "voter-id": "voter-id", "bank-account": "banking", "caste-certificate": "income-caste", "income-certificate": "income-caste",
  "ews-certificate": "income-caste", "residence-certificate": "residence",
};

/**
 * Imports every sheet of a workbook. Rows already imported (from this or an earlier file) are
 * skipped, so uploading the same register again only adds what's new.
 */
export async function importRecords(fileName: string, sheets: SheetInput[], actor: Actor, options: { addContacts: boolean }) {
  const parsed = parseWorkbook(fileName.replace(/\.(xlsx|xlsm|csv)$/i, ""), sheets);
  const [batch] = await db.insert(recordImports).values({ fileName: fileName.slice(0, 200), uploadedBy: actor.id, sheets: parsed.sheets }).returning({ id: recordImports.id });
  let imported = 0;
  const people = new Map<string, { name: string; services: Map<string, string | null>; area?: string | null }>();
  for (let offset = 0; offset < parsed.records.length; offset += 400) {
    const values = parsed.records.slice(offset, offset + 400).map((record) => ({
      importId: batch.id, service: record.service, source: record.source.slice(0, 200), name: record.name,
      mobileHash: record.mobile ? blindIndex("mobile", record.mobile) : null,
      mobileEnc: record.mobile ? seal(record.mobile) : null, mobileLast4: record.mobile ? record.mobile.slice(-4) : null,
      panHash: record.pan ? blindIndex("pan", record.pan) : null, aadhaarHash: record.aadhaar ? blindIndex("aadhaar", record.aadhaar) : null,
      recordDate: record.recordDate, renewalOn: record.renewalOn,
      phoneHashes: [...new Set([record.mobile, record.whatsapp, ...record.altMobiles].filter((value): value is string => Boolean(value)))].map((value) => blindIndex("mobile", value)),
      emailHash: record.email ? blindIndex("email", record.email) : null,
      contactEnc: record.whatsapp || record.altMobiles.length || record.email || record.address ? seal({ whatsapp: record.whatsapp, altMobiles: record.altMobiles, email: record.email, address: record.address } satisfies ContactInfo) : null,
      payloadEnc: seal({ mobile: record.mobile, pan: record.pan, aadhaar: record.aadhaar, whatsapp: record.whatsapp, altMobiles: record.altMobiles, email: record.email, address: record.address, fields: record.fields } satisfies Sealed),
      rowHash: blindIndex("row", record.dedupeKey),
    }));
    imported += (await db.insert(customerRecords).values(values).onConflictDoNothing().returning({ id: customerRecords.id })).length;
    for (const record of parsed.records.slice(offset, offset + 400)) {
      // WhatsApp campaigns go to the WhatsApp number when the sheet has one.
      const phone = record.whatsapp ?? record.mobile;
      if (!phone) continue;
      const person = people.get(phone) ?? { name: record.name, services: new Map(), area: record.address };
      const service = CONTACT_SERVICE[record.service];
      if (service) {
        const previous = person.services.get(service);
        if (!previous || (record.renewalOn && record.renewalOn > previous)) person.services.set(service, record.renewalOn ?? previous ?? null);
      }
      people.set(phone, person);
    }
  }
  const contactsAdded = options.addContacts ? await addContacts(people, fileName) : 0;
  const skipped = parsed.sheets.reduce((total, sheet) => total + sheet.skipped + (sheet.service && !sheet.reason ? 0 : sheet.rows), 0);
  const totalRows = parsed.sheets.reduce((total, sheet) => total + sheet.rows, 0);
  const duplicates = parsed.records.length - imported;
  await db.update(recordImports).set({ imported, duplicates, skipped, contactsAdded, totalRows }).where(eq(recordImports.id, batch.id));
  await logActivity({ kind: "import", permission: "records", category: "records", title: `${actor.name} imported ${fileName}`, detail: `${imported} new records, ${duplicates} already there, ${contactsAdded} WhatsApp contacts added.`, refType: "import", refId: batch.id, actorId: actor.id });
  return { id: batch.id, imported, duplicates, skipped, contactsAdded, totalRows, sheets: parsed.sheets };
}

/** Adds imported people to WhatsApp contacts (consent "not asked"). Existing contacts keep their YES/STOP and gain the new services. */
async function addContacts(people: Map<string, { name: string; services: Map<string, string | null>; area?: string | null }>, fileName: string) {
  let added = 0;
  const entries = [...people.entries()];
  for (let offset = 0; offset < entries.length; offset += 300) {
    const chunk = entries.slice(offset, offset + 300);
    const existing = await db.select({ phone: contacts.phone, services: contacts.services }).from(contacts).where(inArray(contacts.phone, chunk.map(([phone]) => phone)));
    type Service = { service: string; renewalOn: string | null; note: string | null };
    const known = new Map<string, Service[]>(existing.map((row): [string, Service[]] => [row.phone, (row.services ?? []) as Service[]]));
    for (const [phone, person] of chunk) {
      const fresh = [...person.services.entries()].map(([service, renewalOn]) => ({ service, renewalOn, note: null }));
      const current = known.get(phone);
      if (!current) {
        const result = await db.insert(contacts).values({ name: person.name.slice(0, 100), phone, services: fresh, area: person.area?.slice(0, 80) || null, source: `import: ${fileName}`.slice(0, 40) }).onConflictDoNothing().returning({ id: contacts.id });
        added += result.length;
      } else {
        const merged = [...current];
        for (const item of fresh) {
          const index = merged.findIndex((old) => old.service === item.service);
          if (index < 0) merged.push(item);
          else if (item.renewalOn && (!merged[index].renewalOn || item.renewalOn > (merged[index].renewalOn ?? ""))) merged[index] = { ...merged[index], renewalOn: item.renewalOn };
        }
        if (merged.length !== current.length || JSON.stringify(merged) !== JSON.stringify(current)) await db.update(contacts).set({ services: merged.slice(0, 12), updatedAt: new Date() }).where(eq(contacts.phone, phone));
      }
    }
  }
  return added;
}

/** People across all registers: one row per mobile (or PAN), with how often they appear. */
export async function listPeople(options: { q?: string; service?: string; sort?: "repeat" | "recent" | "renewal"; page?: number }) {
  const filters: SQL[] = [];
  if (options.service && options.service in RECORD_SERVICES) filters.push(eq(customerRecords.service, options.service));
  const query = (options.q ?? "").trim().slice(0, 80);
  if (query) {
    const phone = normalizePhone(query);
    const pan = /^[A-Za-z]{5}\d{4}[A-Za-z]$/.test(query) ? query.toUpperCase() : null;
    const aadhaar = /^\d{12}$/.test(query.replace(/\s/g, "")) ? query.replace(/\s/g, "") : null;
    const email = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(query) ? query.toLowerCase() : null;
    if (phone) filters.push(sql`${customerRecords.phoneHashes} @> ARRAY[${blindIndex("mobile", phone)}]::text[]`);
    else if (email) filters.push(eq(customerRecords.emailHash, blindIndex("email", email)));
    else if (pan) filters.push(eq(customerRecords.panHash, blindIndex("pan", pan)));
    else if (aadhaar) filters.push(eq(customerRecords.aadhaarHash, blindIndex("aadhaar", aadhaar)));
    else if (/^\d{4}$/.test(query)) filters.push(eq(customerRecords.mobileLast4, query));
    else filters.push(ilike(customerRecords.name, `%${query.replace(/[\\%_]/g, "\\$&")}%`));
  }
  const personKey = sql<string>`coalesce(${customerRecords.mobileHash}, ${customerRecords.panHash}, ${customerRecords.id}::text)`;
  const where = filters.length ? and(...filters) : undefined;
  const page = Math.max(0, Math.min(options.page ?? 0, 500));
  const order = options.sort === "recent" ? sql`max(${customerRecords.recordDate}) desc nulls last`
    : options.sort === "renewal" ? sql`min(${customerRecords.renewalOn}) filter (where ${customerRecords.renewalOn} >= current_date) asc nulls last`
    : sql`count(*) desc, max(${customerRecords.recordDate}) desc nulls last`;
  // Repeat counts are over everything known about the person, not only the filtered rows.
  const keys = db.select({ key: personKey.as("key") }).from(customerRecords).where(where).groupBy(personKey);
  const rows = await db.select({
    key: personKey, name: sql<string>`(array_agg(${customerRecords.name} order by ${customerRecords.recordDate} desc nulls last))[1]`,
    mobileEnc: sql<string | null>`max(${customerRecords.mobileEnc})`,
    contacts: sql<string[] | null>`(array_agg(${customerRecords.contactEnc}) filter (where ${customerRecords.contactEnc} is not null))[1:5]`, total: sql<number>`count(*)::int`,
    services: sql<string[]>`array_agg(distinct ${customerRecords.service})`,
    lastDate: sql<string | null>`max(${customerRecords.recordDate})::text`,
    nextRenewal: sql<string | null>`(min(${customerRecords.renewalOn}) filter (where ${customerRecords.renewalOn} >= current_date))::text`,
  }).from(customerRecords).where(inArray(personKey, keys)).groupBy(personKey).orderBy(order).limit(50).offset(page * 50);
  const [totals] = await db.select({ people: sql<number>`count(distinct ${personKey})::int`, records: sql<number>`count(*)::int`,
    repeat: sql<number>`(select count(*)::int from (select 1 from ${customerRecords} group by coalesce(mobile_hash, pan_hash, id::text) having count(*) > 1) as r)` }).from(customerRecords).where(where);
  const byService = await db.select({ service: customerRecords.service, total: sql<number>`count(*)::int` }).from(customerRecords).groupBy(customerRecords.service);
  const sends = await sendHistory(rows.map((row) => row.key));
  return {
    people: rows.map((row) => ({ key: row.key, name: row.name, mobile: row.mobileEnc ? open<string>(row.mobileEnc) : null, ...mergeContacts(row.contacts), total: row.total, services: row.services, lastDate: row.lastDate, nextRenewal: row.nextRenewal, ...sends.get(row.key) ?? { sentCount: 0, lastSentAt: null, recentSends: [] } })),
    totals, byService, services: RECORD_SERVICES,
  };
}

/** Send counts for the people on one page: how many times their WhatsApp chat was opened, newest first. */
async function sendHistory(keys: string[]) {
  const result = new Map<string, { sentCount: number; lastSentAt: string | null; recentSends: string[] }>();
  if (!keys.length) return result;
  const rows = await db.select({ key: recordSends.personKey, sentAt: recordSends.sentAt }).from(recordSends)
    .where(inArray(recordSends.personKey, keys)).orderBy(desc(recordSends.sentAt));
  for (const row of rows) {
    const entry = result.get(row.key) ?? { sentCount: 0, lastSentAt: null, recentSends: [] };
    entry.sentCount += 1;
    entry.lastSentAt ??= new Date(row.sentAt).toISOString();
    if (entry.recentSends.length < 10) entry.recentSends.push(new Date(row.sentAt).toISOString());
    result.set(row.key, entry);
  }
  return result;
}

/**
 * Logs that staff opened a person's WhatsApp chat (the chat itself opens in the browser).
 * Only keys that exist in the records are accepted.
 */
export async function logRecordSend(key: string, actor: Actor) {
  const [known] = await db.select({ id: customerRecords.id }).from(customerRecords)
    .where(or(eq(customerRecords.mobileHash, key), eq(customerRecords.panHash, key))).limit(1);
  if (!known) throw new PublicError("Unknown person.", 404);
  await db.insert(recordSends).values({ personKey: key, sentBy: actor.id });
  const summary = await sendHistory([key]);
  return summary.get(key) ?? { sentCount: 0, lastSentAt: null, recentSends: [] };
}

/** Everything known about one person, decrypted. Logged: who opened whose records, and when. */
/** The full PAN of one record. Only called after the viewer confirmed the emailed code; every reveal is logged. */
export async function revealPan(recordId: string, actor: Actor) {
  if (!/^[0-9a-f-]{36}$/i.test(recordId)) throw new PublicError("Unknown record.", 404);
  const [row] = await db.select().from(customerRecords).where(eq(customerRecords.id, recordId)).limit(1);
  if (!row) throw new PublicError("Unknown record.", 404);
  const data = open<Sealed>(row.payloadEnc);
  await logActivity({ kind: "record_view", permission: "records", category: "records", title: `${actor.name} viewed a full PAN`, detail: `${row.name} · ${RECORD_SERVICES[row.service] ?? row.service}`, refType: "record", refId: row.id, actorId: actor.id });
  return { pan: data.pan ?? null };
}

export async function personRecords(key: string, actor: Actor) {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(key)) throw new PublicError("Unknown person.", 404);
  const rows = await db.select().from(customerRecords)
    .where(or(eq(customerRecords.mobileHash, key), eq(customerRecords.panHash, key), sql`${customerRecords.id}::text = ${key}`))
    .orderBy(desc(customerRecords.recordDate)).limit(100);
  if (!rows.length) throw new PublicError("Unknown person.", 404);
  const records = rows.map((row) => {
    const data = open<Sealed>(row.payloadEnc);
    return { id: row.id, service: row.service, source: row.source, name: row.name, recordDate: row.recordDate, renewalOn: row.renewalOn, status: row.status,
      mobile: data.mobile, whatsapp: data.whatsapp ?? null, altMobiles: data.altMobiles ?? [], email: data.email ?? null, address: data.address ?? null, pan: null, panMasked: maskPan(data.pan), hasPan: Boolean(data.pan), aadhaarMasked: maskAadhaar(data.aadhaar), fields: maskIds(data.fields) };
  });
  await logActivity({ kind: "record_view", permission: "records", category: "records", title: `${actor.name} opened the records of ${rows[0].name}`, detail: `${rows.length} record${rows.length === 1 ? "" : "s"} · ${[...new Set(rows.map((row) => RECORD_SERVICES[row.service] ?? row.service))].join(", ")}`, refType: "person", refId: key, actorId: actor.id });
  return { name: rows[0].name, records };
}

export async function recentImports() {
  return db.select().from(recordImports).orderBy(desc(recordImports.createdAt)).limit(20);
}

/** Aadhaar numbers stay masked even in the detail view; staff see the last four digits. */
function maskIds(fields: Record<string, string>) {
  return Object.fromEntries(Object.entries(fields).map(([label, value]) => [label, /aadha|uid/i.test(label) ? value.replace(/\d[\d\s-]{7,}(\d{4})/g, "XXXX XXXX $1") : value]));
}

/** Combines the contact details found on a person's rows (WhatsApp, other mobiles, email, address). */
function mergeContacts(sealed: string[] | null) {
  const merged = { whatsapp: null as string | null, altMobiles: [] as string[], email: null as string | null, address: null as string | null };
  for (const item of sealed ?? []) {
    const info = open<ContactInfo>(item);
    merged.whatsapp ??= info.whatsapp; merged.email ??= info.email; merged.address ??= info.address;
    for (const phone of info.altMobiles ?? []) if (!merged.altMobiles.includes(phone) && merged.altMobiles.length < 3) merged.altMobiles.push(phone);
  }
  return merged;
}

/* ----------------------------------------------------------------------------------------------
 * Service browser: one service at a time, grouped by year then month (newest first).
 * Filters work on the whole service, not only the rows already loaded.
 * -------------------------------------------------------------------------------------------- */

const SERVICE_PAGE = 100;
export type ServiceFilters = { q?: string; status?: string; from?: string; to?: string };

function serviceFilters(service: string, filters: ServiceFilters): SQL[] {
  if (!(service in RECORD_SERVICES)) throw new PublicError("Unknown service.", 404);
  const clauses: SQL[] = [eq(customerRecords.service, service)];
  if (filters.status && RECORD_STATUS_KEYS.includes(filters.status)) clauses.push(eq(customerRecords.status, filters.status));
  if (filters.from && /^\d{4}-\d{2}-\d{2}$/.test(filters.from)) clauses.push(sql`${customerRecords.recordDate} >= ${filters.from}::date`);
  if (filters.to && /^\d{4}-\d{2}-\d{2}$/.test(filters.to)) clauses.push(sql`${customerRecords.recordDate} <= ${filters.to}::date`);
  const q = (filters.q ?? "").trim().slice(0, 80);
  if (q) {
    const phone = normalizePhone(q);
    const pan = /^[A-Za-z]{5}\d{4}[A-Za-z]$/.test(q) ? q.toUpperCase() : null;
    const aadhaar = /^\d{12}$/.test(q.replace(/\s/g, "")) ? q.replace(/\s/g, "") : null;
    const options: SQL[] = [ilike(customerRecords.name, `%${q.replace(/[\\%_]/g, "\\$&")}%`)];
    if (phone) options.push(eq(customerRecords.mobileHash, blindIndex("mobile", phone)));
    else if (/^\d{4}$/.test(q)) options.push(eq(customerRecords.mobileLast4, q));
    if (pan) options.push(eq(customerRecords.panHash, blindIndex("pan", pan)));
    if (aadhaar) options.push(eq(customerRecords.aadhaarHash, blindIndex("aadhaar", aadhaar)));
    clauses.push(or(...options)!);
  }
  return clauses;
}

/** How many records a service has in each year (after the filters). Undated records have year null. */
export async function serviceYears(service: string, filters: ServiceFilters = {}) {
  const year = sql<number | null>`extract(year from ${customerRecords.recordDate})::int`;
  const rows = await db.select({ year, total: sql<number>`count(*)::int` }).from(customerRecords)
    .where(and(...serviceFilters(service, filters))).groupBy(year).orderBy(sql`${year} desc nulls last`);
  return { years: rows.map((row) => ({ year: row.year, total: row.total })) };
}

/** One page of a service's records for one year (or undated records), newest first. */
export async function serviceRecords(service: string, options: ServiceFilters & { year?: number | null; undated?: boolean; page?: number }) {
  const page = Math.max(0, Math.min(options.page ?? 0, 500));
  const scope = options.undated || options.year == null
    ? sql`${customerRecords.recordDate} is null`
    : sql`extract(year from ${customerRecords.recordDate})::int = ${options.year}`;
  const rows = await db.select({
    id: customerRecords.id, name: customerRecords.name, source: customerRecords.source, recordDate: customerRecords.recordDate, renewalOn: customerRecords.renewalOn,
    status: customerRecords.status, payloadEnc: customerRecords.payloadEnc, mobileHash: customerRecords.mobileHash, panHash: customerRecords.panHash,
  }).from(customerRecords).where(and(...serviceFilters(service, options), scope))
    .orderBy(sql`${customerRecords.recordDate} desc nulls last`, customerRecords.name)
    .limit(SERVICE_PAGE + 1).offset(page * SERVICE_PAGE);
  const items = rows.slice(0, SERVICE_PAGE).map((row) => {
    const data = open<Sealed>(row.payloadEnc);
    return { id: row.id, key: row.mobileHash ?? row.panHash ?? row.id, name: row.name, source: row.source, recordDate: row.recordDate, renewalOn: row.renewalOn,
      status: row.status, mobile: data.mobile ?? data.whatsapp ?? null, panMasked: maskPan(data.pan), hasPan: Boolean(data.pan) };
  });
  return { records: items, hasMore: rows.length > SERVICE_PAGE };
}

/** Changes one record's stage. Written to the activity log with who changed it and from what. */
export async function setRecordStatus(recordId: string, status: string, actor: Actor) {
  if (!/^[0-9a-f-]{36}$/i.test(recordId)) throw new PublicError("Unknown record.", 404);
  if (!RECORD_STATUS_KEYS.includes(status)) throw new PublicError("Unknown status.", 400);
  const [before] = await db.select({ name: customerRecords.name, service: customerRecords.service, status: customerRecords.status }).from(customerRecords).where(eq(customerRecords.id, recordId)).limit(1);
  if (!before) throw new PublicError("Unknown record.", 404);
  await db.update(customerRecords).set({ status, statusAt: new Date() }).where(eq(customerRecords.id, recordId));
  await logActivity({ kind: "status", permission: "records", category: "records", title: `${actor.name} changed ${before.name}’s ${RECORD_SERVICES[before.service] ?? before.service} to ${RECORD_STATUSES[status]}`, detail: `Was: ${RECORD_STATUSES[before.status] ?? before.status}`, refType: "record", refId: recordId, actorId: actor.id });
  return { id: recordId, status };
}
