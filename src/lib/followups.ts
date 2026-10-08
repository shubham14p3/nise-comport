import { and, asc, eq, gt, inArray, isNull, sql } from "drizzle-orm";
import { customerRecords, recordClaims, recordFollowups } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { db } from "@/lib/db";
import { PublicError } from "@/lib/errors";
import { RECORD_SERVICES } from "@/lib/record-import";
import { open, seal } from "@/lib/vault";

export type FollowUp = { id: string; byStaff: boolean; author: string; body: string; createdAt: string };
type Writer = { id: string; name: string };

const MAX_BODY = 500;
const PER_DAY = 20;
const SHOWN_PER_RECORD = 30;
/** What customers see instead of a staff member's own name. */
export const TEAM_NAME = "NISE COMPORT team";

function clean(body: string) {
  const text = body.replace(/\s+/g, " ").trim();
  if (!text) throw new PublicError("Write a few words first.", 400);
  return text.slice(0, MAX_BODY);
}

/** The threads for some records, oldest first. Customers see "the team", staff see who replied. */
export async function followupsFor(recordIds: string[], forCustomer: boolean): Promise<Map<string, FollowUp[]>> {
  const threads = new Map<string, FollowUp[]>();
  if (!recordIds.length) return threads;
  const rows = await db.select().from(recordFollowups).where(inArray(recordFollowups.recordId, recordIds)).orderBy(asc(recordFollowups.createdAt));
  for (const row of rows) {
    const list = threads.get(row.recordId) ?? [];
    list.push({ id: row.id, byStaff: row.byStaff, author: row.byStaff && forCustomer ? TEAM_NAME : row.authorName, body: open<string>(row.bodyEnc), createdAt: row.createdAt.toISOString() });
    threads.set(row.recordId, list);
  }
  for (const [id, list] of threads) if (list.length > SHOWN_PER_RECORD) threads.set(id, list.slice(-SHOWN_PER_RECORD));
  return threads;
}

async function insertFollowUp(record: { id: string; name: string; service: string }, writer: Writer, byStaff: boolean, body: string) {
  const [row] = await db.insert(recordFollowups).values({ recordId: record.id, authorId: writer.id, byStaff, authorName: writer.name.slice(0, 100), bodyEnc: seal(body) })
    .returning({ id: recordFollowups.id, createdAt: recordFollowups.createdAt });
  const service = RECORD_SERVICES[record.service] ?? record.service;
  await logActivity({
    kind: "followup", permission: "records", category: "records", actorId: writer.id, refType: "record", refId: record.id,
    title: byStaff ? `${writer.name} replied about ${record.name}’s ${service}` : `${writer.name} followed up on their ${service}`,
    detail: body.slice(0, 200),
  });
  return { id: row.id, byStaff, author: writer.name, body, createdAt: row.createdAt.toISOString() } satisfies FollowUp;
}

/** A customer says what is not working on one of their linked records. */
export async function addCustomerFollowUp(user: Writer, recordId: string, rawBody: string) {
  const body = clean(rawBody);
  const [record] = await db.select({ id: customerRecords.id, name: customerRecords.name, service: customerRecords.service, mobileHash: customerRecords.mobileHash })
    .from(customerRecords).where(and(eq(customerRecords.id, recordId), isNull(customerRecords.removedAt))).limit(1);
  // The record must belong to a person this account is linked to (same mobile and name as an approved claim).
  const linked = record?.mobileHash
    ? await db.select({ id: recordClaims.id }).from(recordClaims).where(and(
      eq(recordClaims.userId, user.id), eq(recordClaims.status, "approved"), eq(recordClaims.mobileHash, record.mobileHash),
      sql`lower(trim(${recordClaims.matchedName})) = lower(trim(${record.name}))`)).limit(1)
    : [];
  if (!record || !linked.length) throw new PublicError("That record is not linked to your account.", 404);
  const [today] = await db.select({ total: sql<number>`count(*)::int` }).from(recordFollowups)
    .where(and(eq(recordFollowups.authorId, user.id), eq(recordFollowups.byStaff, false), gt(recordFollowups.createdAt, new Date(Date.now() - 24 * 3600_000))));
  if ((today?.total ?? 0) >= PER_DAY) throw new PublicError("You have sent a lot of messages today. Please wait a while or call the centre.", 429);
  return { item: { ...(await insertFollowUp(record, user, false, body)), author: user.name } };
}

/** Staff write on a record; the customer sees it on their past records. */
export async function addStaffFollowUp(user: Writer, recordId: string, rawBody: string) {
  const body = clean(rawBody);
  const [record] = await db.select({ id: customerRecords.id, name: customerRecords.name, service: customerRecords.service })
    .from(customerRecords).where(eq(customerRecords.id, recordId)).limit(1);
  if (!record) throw new PublicError("Unknown record.", 404);
  return { item: await insertFollowUp(record, user, true, body) };
}
