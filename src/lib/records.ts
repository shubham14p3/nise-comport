import { and, desc, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import { contacts, customerRecords, recordImports } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { db } from "@/lib/db";
import { PublicError } from "@/lib/errors";
import { maskAadhaar, maskPan, parseWorkbook, RECORD_SERVICES, type SheetInput } from "@/lib/record-import";
import { normalizePhone } from "@/lib/validation";
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
  return {
    people: rows.map((row) => ({ key: row.key, name: row.name, mobile: row.mobileEnc ? open<string>(row.mobileEnc) : null, ...mergeContacts(row.contacts), total: row.total, services: row.services, lastDate: row.lastDate, nextRenewal: row.nextRenewal })),
    totals, byService, services: RECORD_SERVICES,
  };
}

/** Everything known about one person, decrypted. Logged: who opened whose records, and when. */
export async function personRecords(key: string, actor: Actor) {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(key)) throw new PublicError("Unknown person.", 404);
  const rows = await db.select().from(customerRecords)
    .where(or(eq(customerRecords.mobileHash, key), eq(customerRecords.panHash, key), sql`${customerRecords.id}::text = ${key}`))
    .orderBy(desc(customerRecords.recordDate)).limit(100);
  if (!rows.length) throw new PublicError("Unknown person.", 404);
  const records = rows.map((row) => {
    const data = open<Sealed>(row.payloadEnc);
    return { id: row.id, service: row.service, source: row.source, name: row.name, recordDate: row.recordDate, renewalOn: row.renewalOn,
      mobile: data.mobile, whatsapp: data.whatsapp ?? null, altMobiles: data.altMobiles ?? [], email: data.email ?? null, address: data.address ?? null, pan: data.pan, panMasked: maskPan(data.pan), aadhaarMasked: maskAadhaar(data.aadhaar), fields: maskIds(data.fields) };
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
