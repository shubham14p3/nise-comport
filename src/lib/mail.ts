import { randomInt, randomUUID } from "node:crypto";
import { mkdir, readFile, rm, statfs, writeFile } from "node:fs/promises";
import { dirname, extname } from "node:path";
import { and, desc, eq, inArray, isNull, lt, lte, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { mailAttachments, mailMessages, mailTickets, mailSync, printJobs, serviceRequests, storedFiles, users } from "@/db/schema";
import type { User } from "@/lib/auth";
import { PublicError } from "@/lib/errors";
import { hasPermission } from "@/lib/permissions";
import { enforceRate, identity, RATE_RULES } from "@/lib/rate-limit";
import { privateStoragePath, privateStorageRoot } from "@/lib/storage";
import { sendMail, sendTicketMail, smtpConfigured } from "@/lib/email";
import { absoluteUrl, site } from "@/lib/site";
import { MAIL_PATH } from "@/lib/mail-route";
import {
  allowedAttachmentType, autoCloseAt, cleanBody, cleanSubject, findReferences, isTicketStatus, makeTicketKey, MAX_ATTACHMENT_BYTES,
  MAX_ATTACHMENTS_PER_MESSAGE, safeFileName, snippet, STAFF_STATUS_LABEL, STATUS_LABEL, subjectWithTag, ticketCode, validSignature,
  type MailAttachmentInfo, type MailBox, type MailLinkInfo, type MailMessageView, type MailMeta, type MailTicketDetail, type MailTicketSummary, type TicketStatus,
} from "@/lib/mail-core";

export type MailActor = { user: User; staff: boolean };
export function actorFor(user: User): MailActor { return { user, staff: hasPermission(user, "mail") }; }

/* ---------------------------------------------------------------- settings from the environment */

export function supportAddress() { return (process.env.MAIL_SUPPORT_ADDRESS || process.env.MAIL_IMAP_USER || process.env.SMTP_USER || site.email).trim(); }
function supportFrom() { return process.env.MAIL_SUPPORT_FROM?.trim() || `"${site.name} Support" <${supportAddress()}>`; }
export function imapConfigured() { return Boolean(process.env.MAIL_IMAP_HOST && process.env.MAIL_IMAP_USER && process.env.MAIL_IMAP_PASSWORD); }
function mailLimitBytes() { const mb = Number(process.env.MAIL_STORAGE_LIMIT_MB); return (Number.isFinite(mb) && mb > 0 ? mb : 2048) * 1024 * 1024; }
function userLimitBytes() { const mb = Number(process.env.MAIL_USER_QUOTA_MB); return (Number.isFinite(mb) && mb > 0 ? mb : 200) * 1024 * 1024; }
function mailDomain() { const at = supportAddress().split("@")[1]; return at || site.url.replace(/^https?:\/\//, "").replace(/\/.*/, ""); }
const newRfcId = () => `<nc-${randomUUID()}@${mailDomain()}>`;
const iso = (value: Date | null) => (value ? value.toISOString() : null);
const statusLabelOf = (status: string) => (isTicketStatus(status) ? STATUS_LABEL[status] : "Open");
const firstName = (name: string) => name.trim().split(/\s+/)[0] || name;
const ticketLink = (number: number) => absoluteUrl(`${MAIL_PATH}?t=${number}`);

/* ---------------------------------------------------------------- access */

async function ticketForActor(actor: MailActor, id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new PublicError("This message could not be found.", 404, { code: "not_found" });
  const [ticket] = await db.select().from(mailTickets).where(actor.staff ? eq(mailTickets.id, id) : and(eq(mailTickets.id, id), eq(mailTickets.userId, actor.user.id))).limit(1);
  if (!ticket) throw new PublicError("This message could not be found.", 404, { code: "not_found" });
  return ticket;
}

/* ---------------------------------------------------------------- linking a ticket to a request or print order */

export async function resolveLink(userId: string | null, references: string[], anyOwner: boolean) {
  for (const reference of references) {
    const [request] = await db.select({ id: serviceRequests.id, userId: serviceRequests.userId, reference: serviceRequests.reference }).from(serviceRequests).where(eq(serviceRequests.reference, reference)).limit(1);
    if (request && (anyOwner || (userId && request.userId === userId))) return { kind: "request" as const, id: request.id, reference: request.reference };
    const [job] = await db.select({ id: printJobs.id, userId: printJobs.userId, reference: printJobs.reference }).from(printJobs).where(eq(printJobs.reference, reference)).limit(1);
    if (job && (anyOwner || (userId && job.userId === userId))) return { kind: "print" as const, id: job.id, reference: job.reference };
  }
  return null;
}

const attachmentInfo = (row: { id: string; name: string; mimeType: string; sizeBytes: number }): MailAttachmentInfo => ({ id: row.id, name: row.name, mimeType: row.mimeType, sizeBytes: row.sizeBytes });

async function linkedFiles(kind: "print" | "request", id: string) {
  if (kind === "print") {
    const [job] = await db.select({ fileId: printJobs.fileId }).from(printJobs).where(eq(printJobs.id, id)).limit(1);
    if (!job?.fileId) return [];
    return db.select({ id: storedFiles.id, name: storedFiles.originalName, mimeType: storedFiles.mimeType, sizeBytes: storedFiles.sizeBytes, objectKey: storedFiles.objectKey }).from(storedFiles).where(eq(storedFiles.id, job.fileId));
  }
  return db.select({ id: storedFiles.id, name: storedFiles.originalName, mimeType: storedFiles.mimeType, sizeBytes: storedFiles.sizeBytes, objectKey: storedFiles.objectKey }).from(storedFiles).where(eq(storedFiles.requestId, id));
}

async function linkInfo(ticket: typeof mailTickets.$inferSelect, staff: boolean): Promise<MailLinkInfo | null> {
  if (!ticket.linkKind || !ticket.linkId) return null;
  if (ticket.linkKind === "print") {
    const [job] = await db.select({ reference: printJobs.reference, status: printJobs.status, fileName: printJobs.fileName }).from(printJobs).where(eq(printJobs.id, ticket.linkId)).limit(1);
    if (!job) return null;
    return { kind: "print", id: ticket.linkId, reference: job.reference, label: `Print order · ${job.fileName}`, status: job.status, ...(staff ? { files: (await linkedFiles("print", ticket.linkId)).map(attachmentInfo) } : {}) };
  }
  const [request] = await db.select({ reference: serviceRequests.reference, status: serviceRequests.status, serviceName: serviceRequests.serviceName }).from(serviceRequests).where(eq(serviceRequests.id, ticket.linkId)).limit(1);
  if (!request) return null;
  return { kind: "request", id: ticket.linkId, reference: request.reference, label: request.serviceName, status: request.status, ...(staff ? { files: (await linkedFiles("request", ticket.linkId)).map(attachmentInfo) } : {}) };
}

/* ---------------------------------------------------------------- listing */

const PREVIEW_SQL = sql<string>`coalesce((select left(m.body, 300) from mail_messages m where m.ticket_id = ${mailTickets.id} order by m.created_at desc limit 1), '')`;
const ATTACH_COUNT_SQL = sql<number>`(select count(*)::int from mail_attachments a where a.ticket_id = ${mailTickets.id})`;

function summaryFrom(row: { id: string; number: number; subject: string; status: string; fromEmail: string; fromName: string | null; source: string; lastMessageAt: Date; linkReference: string | null; staffUnread: boolean; customerUnread: boolean; preview: string; attachmentCount: number }, staff: boolean): MailTicketSummary {
  return {
    id: row.id, number: row.number, code: ticketCode(row.number), subject: row.subject, status: isTicketStatus(row.status) ? row.status : "open",
    fromEmail: row.fromEmail, fromName: row.fromName, source: row.source, unread: staff ? row.staffUnread : row.customerUnread,
    lastMessageAt: row.lastMessageAt.toISOString(), preview: snippet(row.preview), attachmentCount: row.attachmentCount, linkReference: row.linkReference,
  };
}

export async function listTickets(actor: MailActor, options: { box?: string; q?: string; before?: string }) {
  const conditions: SQL[] = [];
  if (!actor.staff) conditions.push(eq(mailTickets.userId, actor.user.id));
  switch (options.box as MailBox | undefined) {
    case "active": conditions.push(inArray(mailTickets.status, ["open", "awaiting_customer", "get_back_soon"])); break;
    case "open": case "awaiting_customer": case "get_back_soon": case "resolved": case "closed": conditions.push(eq(mailTickets.status, options.box!)); break;
    case "unread": conditions.push(actor.staff ? eq(mailTickets.staffUnread, true) : eq(mailTickets.customerUnread, true)); break;
    default: break;
  }
  const q = (options.q ?? "").trim().slice(0, 80);
  if (q) {
    const like = `%${q.replace(/[\\%_]/g, "\\$&")}%`;
    const numberMatch = /^(?:nc-?t?)?(\d{4,9})$/i.exec(q);
    const parts: SQL[] = [
      sql`${mailTickets.subject} ilike ${like}`, sql`${mailTickets.fromEmail} ilike ${like}`, sql`coalesce(${mailTickets.fromName}, '') ilike ${like}`,
      sql`coalesce(${mailTickets.linkReference}, '') ilike ${like}`,
      sql`exists (select 1 from mail_messages m where m.ticket_id = ${mailTickets.id} and m.body ilike ${like})`,
    ];
    if (numberMatch) parts.push(eq(mailTickets.number, Number(numberMatch[1])));
    conditions.push(or(...parts)!);
  }
  const before = options.before ? new Date(options.before) : null;
  if (before && !Number.isNaN(before.getTime())) conditions.push(lt(mailTickets.lastMessageAt, before));
  const LIMIT = 40;
  const rows = await db.select({
    id: mailTickets.id, number: mailTickets.number, subject: mailTickets.subject, status: mailTickets.status, fromEmail: mailTickets.fromEmail, fromName: mailTickets.fromName,
    source: mailTickets.source, lastMessageAt: mailTickets.lastMessageAt, linkReference: mailTickets.linkReference, staffUnread: mailTickets.staffUnread, customerUnread: mailTickets.customerUnread,
    preview: PREVIEW_SQL, attachmentCount: ATTACH_COUNT_SQL,
  }).from(mailTickets).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(mailTickets.lastMessageAt)).limit(LIMIT);
  const tickets = rows.map((row) => summaryFrom(row as Parameters<typeof summaryFrom>[0], actor.staff));
  return { tickets, nextBefore: rows.length === LIMIT ? rows[rows.length - 1].lastMessageAt.toISOString() : null };
}

/* ---------------------------------------------------------------- one ticket */

export async function ticketDetail(actor: MailActor, id: string): Promise<MailTicketDetail> {
  const ticket = await ticketForActor(actor, id);
  const messages = await db.select().from(mailMessages).where(eq(mailMessages.ticketId, ticket.id)).orderBy(mailMessages.createdAt);
  const attachments = await db.select().from(mailAttachments).where(and(eq(mailAttachments.ticketId, ticket.id), sql`${mailAttachments.messageId} is not null`)).orderBy(mailAttachments.createdAt);
  const byMessage = new Map<string, MailAttachmentInfo[]>();
  for (const row of attachments) { const list = byMessage.get(row.messageId!) ?? []; list.push(attachmentInfo(row)); byMessage.set(row.messageId!, list); }
  if (actor.staff ? ticket.staffUnread : ticket.customerUnread) {
    await db.update(mailTickets).set(actor.staff ? { staffUnread: false } : { customerUnread: false }).where(eq(mailTickets.id, ticket.id));
  }
  const last = messages[messages.length - 1];
  return {
    ticket: {
      ...summaryFrom({ ...ticket, preview: last?.body ?? "", attachmentCount: attachments.length }, actor.staff),
      unread: false, createdAt: ticket.createdAt.toISOString(), closedAt: iso(ticket.closedAt), autoCloseAt: iso(ticket.autoCloseAt), closeReason: ticket.closeReason,
    },
    messages: messages.map((message): MailMessageView => ({
      id: message.id, direction: message.direction === "out" ? "out" : "in", authorName: message.authorName, body: message.body, createdAt: message.createdAt.toISOString(), source: message.source,
      ...(actor.staff && message.direction === "out" ? { emailStatus: message.emailStatus } : {}), attachments: byMessage.get(message.id) ?? [],
    })),
    link: await linkInfo(ticket, actor.staff),
  };
}

export async function mailMeta(actor: MailActor): Promise<MailMeta> {
  const scope = actor.staff ? undefined : eq(mailTickets.userId, actor.user.id);
  const unreadColumn = actor.staff ? mailTickets.staffUnread : mailTickets.customerUnread;
  const grouped = await db.select({ status: mailTickets.status, total: sql<number>`count(*)::int`, unread: sql<number>`(count(*) filter (where ${unreadColumn}))::int` }).from(mailTickets).where(scope).groupBy(mailTickets.status);
  const counts: Record<string, number> = { all: 0, active: 0 };
  let unread = 0;
  for (const row of grouped) {
    counts[row.status] = row.total; counts.all += row.total; unread += row.unread;
    if (["open", "awaiting_customer", "get_back_soon"].includes(row.status)) counts.active += row.total;
  }
  counts.unread = unread;
  const meta: MailMeta = { staff: actor.staff, counts, unread, supportAddress: supportAddress(), mailboxConnected: imapConfigured() };
  if (actor.staff) {
    // Every staff member with the Messages permission can check the mailbox; only the owner sees disk and storage figures.
    const [sync] = await db.select().from(mailSync).where(eq(mailSync.id, "main")).limit(1);
    meta.sync = { lastRunAt: iso(sync?.lastRunAt ?? null), lastError: sync?.lastError ?? null, lastImported: sync?.lastImported ?? 0 };
  }
  if (actor.user.role === "admin") meta.storage = await storageTotals();
  return meta;
}

/**
 * Owner-only storage figures. The staff screen polls every 45 seconds, so the sums over every
 * attachment are cached for a minute instead of being recalculated on each poll.
 */
const STORAGE_TTL_MS = 60_000;
let storageCache: { at: number; value: NonNullable<MailMeta["storage"]> } | null = null;
async function storageTotals(): Promise<NonNullable<MailMeta["storage"]>> {
  if (storageCache && Date.now() - storageCache.at < STORAGE_TTL_MS) return storageCache.value;
  const [mail] = await db.select({ bytes: sql<number>`coalesce(sum(${mailAttachments.sizeBytes}), 0)::float8`, files: sql<number>`count(*)::int` }).from(mailAttachments);
  const [docs] = await db.select({ bytes: sql<number>`coalesce(sum(${storedFiles.sizeBytes}), 0)::float8` }).from(storedFiles);
  let diskFree: number | null = null; let diskTotal: number | null = null;
  try { const fs = await statfs(privateStorageRoot()); diskFree = Number(fs.bavail) * Number(fs.bsize); diskTotal = Number(fs.blocks) * Number(fs.bsize); } catch { /* folder not created yet */ }
  const value = { mailBytes: mail?.bytes ?? 0, mailFiles: mail?.files ?? 0, documentsBytes: docs?.bytes ?? 0, limitBytes: mailLimitBytes(), diskFreeBytes: diskFree, diskTotalBytes: diskTotal };
  storageCache = { at: Date.now(), value };
  return value;
}

/* ---------------------------------------------------------------- attachments */

async function mailBytesUsed(uploaderId?: string) {
  const [row] = await db.select({ bytes: sql<number>`coalesce(sum(${mailAttachments.sizeBytes}), 0)::float8` }).from(mailAttachments).where(uploaderId ? eq(mailAttachments.uploaderId, uploaderId) : undefined);
  return row?.bytes ?? 0;
}

export async function storeUpload(actor: MailActor, file: File) {
  await enforceRate(RATE_RULES.mailAttachPerUserHour, identity("user", actor.user.id), "You have attached many files in a short time. Please wait a little and try again.");
  if (!file.size) throw new PublicError("This file is empty.", 400);
  if (file.size > MAX_ATTACHMENT_BYTES) throw new PublicError("Each file can be up to 15 MB.", 413, { code: "too_large" });
  const type = allowedAttachmentType(file.name, file.type);
  if (!type) throw new PublicError("Attach a picture (JPG, PNG, WEBP, GIF), a PDF, a Word or Excel file, or a CSV or text file.", 400, { code: "bad_type" });
  const bytes = Buffer.from(await file.arrayBuffer());
  if (!validSignature(type, bytes)) throw new PublicError("This file does not look like a valid file of its type.", 400, { code: "bad_signature" });
  if (!actor.staff && (await mailBytesUsed(actor.user.id)) + bytes.length > userLimitBytes()) throw new PublicError("You have reached the space allowed for attachments. Please bring further files to the service desk.", 413, { code: "quota" });
  if ((await mailBytesUsed()) + bytes.length > mailLimitBytes()) throw new PublicError("Attachments are temporarily unavailable. Please send the files to the service desk directly.", 507, { code: "storage_full" });
  const row = await writeAttachment({ bytes, name: file.name, type, uploaderId: actor.user.id, ticketId: null, messageId: null });
  return attachmentInfo(row);
}

export async function writeAttachment(input: { bytes: Buffer; name: string; type: string; uploaderId: string | null; ticketId: string | null; messageId: string | null }) {
  const month = new Date().toISOString().slice(0, 7);
  const objectKey = `mail/${month}/${randomUUID()}${extname(input.name).toLowerCase().slice(0, 8).replace(/[^.a-z0-9]/g, "")}`;
  const target = privateStoragePath(objectKey);
  await mkdir(dirname(target), { recursive: true, mode: 0o700 });
  await writeFile(target, input.bytes, { mode: 0o600, flag: "wx" });
  try {
    const [row] = await db.insert(mailAttachments).values({ objectKey, name: safeFileName(input.name), mimeType: input.type, sizeBytes: input.bytes.length, uploaderId: input.uploaderId, ticketId: input.ticketId, messageId: input.messageId }).returning();
    return row;
  } catch (error) { await rm(target, { force: true }).catch(() => undefined); throw error; }
}

export async function attachmentForActor(actor: MailActor, id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new PublicError("File not found.", 404);
  const [row] = await db.select().from(mailAttachments).where(eq(mailAttachments.id, id)).limit(1);
  if (!row) throw new PublicError("File not found.", 404);
  if (!actor.staff) {
    if (row.ticketId) { const [ticket] = await db.select({ userId: mailTickets.userId }).from(mailTickets).where(eq(mailTickets.id, row.ticketId)).limit(1); if (ticket?.userId !== actor.user.id) throw new PublicError("File not found.", 404); }
    else if (row.uploaderId !== actor.user.id) throw new PublicError("File not found.", 404);
  }
  try { return { row, bytes: await readFile(privateStoragePath(row.objectKey)) }; }
  catch { throw new PublicError("This file is no longer available.", 404); }
}

/** Files of a ticket (and, for staff, of its linked request or print order) for the "download all" zip. */
export async function ticketFilesForZip(actor: MailActor, ticketId: string) {
  const ticket = await ticketForActor(actor, ticketId);
  const own = await db.select().from(mailAttachments).where(and(eq(mailAttachments.ticketId, ticket.id), sql`${mailAttachments.messageId} is not null`)).orderBy(mailAttachments.createdAt);
  const linked = actor.staff && ticket.linkKind && ticket.linkId ? await linkedFiles(ticket.linkKind as "print" | "request", ticket.linkId) : [];
  const total = [...own, ...linked].reduce((sum, file) => sum + file.sizeBytes, 0);
  if (total > 120 * 1024 * 1024) throw new PublicError("These files are too large to download together. Download them one by one.", 413);
  const read = async (key: string) => readFile(privateStoragePath(key)).catch(() => null);
  const entries: { folder: string; name: string; data: Uint8Array }[] = [];
  for (const file of own) { const data = await read(file.objectKey); if (data) entries.push({ folder: "Ticket attachments", name: file.name, data }); }
  for (const file of linked) { const data = await read(file.objectKey); if (data) entries.push({ folder: "Request files", name: file.name, data }); }
  if (!entries.length) throw new PublicError("There are no files to download.", 404);
  return { ticket, entries };
}

export async function linkedFileForStaff(actor: MailActor, ticketId: string, fileId: string) {
  if (!actor.staff) throw new PublicError("File not found.", 404);
  const ticket = await ticketForActor(actor, ticketId);
  if (!ticket.linkKind || !ticket.linkId || !/^[0-9a-f-]{36}$/i.test(fileId)) throw new PublicError("File not found.", 404);
  const file = (await linkedFiles(ticket.linkKind as "print" | "request", ticket.linkId)).find((item) => item.id === fileId);
  if (!file) throw new PublicError("File not found.", 404);
  try { return { file, bytes: await readFile(privateStoragePath(file.objectKey)) }; } catch { throw new PublicError("This file is no longer available.", 404); }
}

async function claimAttachments(ids: string[], uploaderId: string, ticketId: string, messageId: string) {
  if (!ids.length) return 0;
  const claimed = await db.update(mailAttachments).set({ ticketId, messageId }).where(and(inArray(mailAttachments.id, ids), eq(mailAttachments.uploaderId, uploaderId), isNull(mailAttachments.messageId))).returning({ id: mailAttachments.id });
  return claimed.length;
}

function validIds(value: unknown) {
  if (!Array.isArray(value)) return [];
  const ids = value.filter((item): item is string => typeof item === "string" && /^[0-9a-f-]{36}$/i.test(item));
  if (ids.length > MAX_ATTACHMENTS_PER_MESSAGE) throw new PublicError(`You can attach up to ${MAX_ATTACHMENTS_PER_MESSAGE} files to one message.`, 400);
  return [...new Set(ids)];
}

/* ---------------------------------------------------------------- email out */

async function emailAttachmentsFor(messageId: string) {
  const rows = await db.select().from(mailAttachments).where(eq(mailAttachments.messageId, messageId));
  const total = rows.reduce((sum, row) => sum + row.sizeBytes, 0);
  if (total > 20 * 1024 * 1024) return { files: [], skipped: rows.length };
  const files: { filename: string; content: Buffer; contentType: string }[] = [];
  for (const row of rows) { try { files.push({ filename: row.name, content: await readFile(privateStoragePath(row.objectKey)), contentType: row.mimeType }); } catch { /* file gone */ } }
  return { files, skipped: 0 };
}

async function priorMessageIds(ticketId: string) {
  const rows = await db.select({ id: mailMessages.rfcMessageId }).from(mailMessages).where(and(eq(mailMessages.ticketId, ticketId), sql`${mailMessages.rfcMessageId} is not null`)).orderBy(desc(mailMessages.createdAt)).limit(10);
  return rows.map((row) => row.id!).reverse();
}

/** Sends one staff message by email and records whether it worked. Never throws. */
async function deliverStaffMessage(ticket: typeof mailTickets.$inferSelect, message: typeof mailMessages.$inferSelect, kind: "reply" | "new" = "reply") {
  try {
    if (!smtpConfigured() && process.env.NODE_ENV === "production") throw new Error("smtp not configured");
    const attachments = await emailAttachmentsFor(message.id);
    const prior = (await priorMessageIds(ticket.id)).filter((id) => id !== message.rfcMessageId);
    await sendTicketMail({
      to: ticket.fromEmail, subject: subjectWithTag(ticket.subject, ticket.number, ticket.key), kind, body: message.body,
      ticketCode: ticketCode(ticket.number), statusLabel: statusLabelOf(ticket.status), link: ticketLink(ticket.number),
      from: supportFrom(), replyTo: supportAddress(), messageId: message.rfcMessageId ?? undefined, inReplyTo: prior[prior.length - 1], references: prior,
      attachments: attachments.files, extraNote: attachments.skipped ? "The attached files were too large to send by email. Open your ticket on our website to download them." : undefined,
    });
    await db.update(mailMessages).set({ emailStatus: "sent", emailAttempts: sql`${mailMessages.emailAttempts} + 1` }).where(eq(mailMessages.id, message.id));
  } catch (error) {
    console.error("[mail] could not email a ticket reply", error instanceof Error ? error.message : error);
    await db.update(mailMessages).set({ emailStatus: "failed", emailAttempts: sql`${mailMessages.emailAttempts} + 1` }).where(eq(mailMessages.id, message.id));
  }
}

async function sendAcknowledgement(ticket: typeof mailTickets.$inferSelect, originalMessageId: string | null, subject: string, yourMessage?: string) {
  try {
    await sendTicketMail({
      to: ticket.fromEmail, subject: subjectWithTag(subject, ticket.number, ticket.key), kind: "received", ticketCode: ticketCode(ticket.number), statusLabel: STATUS_LABEL.open, ticketSubject: ticket.subject, openedAt: ticket.createdAt, yourMessage,
      link: ticketLink(ticket.number), from: supportFrom(), replyTo: supportAddress(), inReplyTo: originalMessageId ?? undefined, references: originalMessageId ? [originalMessageId] : undefined, automated: true,
    });
  } catch (error) { console.error("[mail] could not send the acknowledgement", error instanceof Error ? error.message : error); }
}

/** Everyone who should hear about new customer messages: all owners, staff with the Messages permission, and the shared alert address. */
async function alertRecipients() {
  const people = await db.select({ email: users.email }).from(users).where(and(isNull(users.deletedAt), isNull(users.disabledAt), or(eq(users.role, "admin"), and(eq(users.role, "staff"), sql`${users.permissions} @> '["mail"]'::jsonb`))));
  const shared = process.env.STAFF_ALERT_EMAIL?.trim() || site.email;
  const seen = new Set<string>();
  return [...people.map((person) => person.email), ...shared.split(/[,;\s]+/)].map((email) => email.trim()).filter((email) => /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email) && !seen.has(email.toLowerCase()) && (seen.add(email.toLowerCase()), true)).slice(0, 25);
}

export async function alertStaff(ticket: typeof mailTickets.$inferSelect, body: string, kind: "new" | "reply" = "new") {
  try {
    const recipients = await alertRecipients();
    const from = ticket.fromName ? `${ticket.fromName} <${ticket.fromEmail}>` : ticket.fromEmail;
    await Promise.allSettled(recipients.map((to) => sendMail({
      to, subject: `${kind === "new" ? "New message" : "New reply"} ${ticketCode(ticket.number)}: ${ticket.subject}`.slice(0, 200), heading: kind === "new" ? "New customer message" : "Customer replied",
      paragraphs: [snippet(body, 400)], details: [{ label: "Ticket", value: ticketCode(ticket.number), emphasis: true }, { label: "From", value: from }],
      action: { label: "Open in the staff desk", href: absoluteUrl("/desk#mail") }, extra: { headers: { "Auto-Submitted": "auto-generated" } },
    })));
  } catch (error) { console.error("[mail] could not alert staff", error instanceof Error ? error.message : error); }
}

/* ---------------------------------------------------------------- writing */

function statusFields(status: TicketStatus, now: Date): Partial<typeof mailTickets.$inferInsert> {
  return {
    status,
    autoCloseAt: status === "awaiting_customer" || status === "resolved" ? autoCloseAt(now) : null,
    closedAt: status === "closed" ? now : null,
    closeReason: status === "closed" ? "staff" : null,
    closeNoticeSentAt: null,
  };
}

export async function createTicket(actor: MailActor, input: { subject: string; body: string; attachmentIds?: unknown; to?: string; status?: string }) {
  const subject = cleanSubject(input.subject);
  const body = cleanBody(input.body);
  const ids = validIds(input.attachmentIds);
  if (subject.length < 3) throw new PublicError("Please write a short subject (at least 3 characters).", 400, { fields: { subject: "Please write a short subject." } });
  if (!body && !ids.length) throw new PublicError("Please write your message or attach a file.", 400, { fields: { body: "Please write your message." } });
  const now = new Date();
  if (actor.staff && input.to) return createStaffTicket(actor, subject, body, ids, input.to, input.status);
  await enforceRate(RATE_RULES.mailNewTicketPerUserDay, identity("user", actor.user.id), "You have sent many new messages today. Please add to an existing message or try again tomorrow.");
  await enforceRate(RATE_RULES.mailSendPerUserHour, identity("user", actor.user.id), "You are sending messages very quickly. Please wait a little.");
  const link = await resolveLink(actor.user.id, findReferences(`${subject}\n${body}`), false);
  const [ticket] = await db.insert(mailTickets).values({
    key: makeTicketKey(randomInt), userId: actor.user.id, fromEmail: actor.user.email.toLowerCase(), fromName: actor.user.name, subject, status: "open", source: "site",
    linkKind: link?.kind ?? null, linkId: link?.id ?? null, linkReference: link?.reference ?? null, staffUnread: true, customerUnread: false, lastCustomerAt: now, lastMessageAt: now,
  }).returning();
  const rfc = newRfcId();
  const [message] = await db.insert(mailMessages).values({ ticketId: ticket.id, direction: "in", authorId: actor.user.id, authorName: actor.user.name, body, source: "site", rfcMessageId: rfc }).returning();
  await claimAttachments(ids, actor.user.id, ticket.id, message.id);
  await sendAcknowledgement(ticket, rfc, subject, body);
  await alertStaff(ticket, body || "(attachment only)");
  return { id: ticket.id, number: ticket.number, code: ticketCode(ticket.number) };
}

async function createStaffTicket(actor: MailActor, subject: string, body: string, ids: string[], toRaw: string, statusRaw?: string) {
  const to = toRaw.trim().toLowerCase();
  if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(to) || to.length > 160) throw new PublicError("Enter a valid email address for the customer.", 400, { fields: { to: "Enter a valid email address." } });
  await enforceRate(RATE_RULES.mailSendPerUserHour, identity("user", actor.user.id), "You are sending messages very quickly. Please wait a little.");
  const [customer] = await db.select({ id: users.id, name: users.name }).from(users).where(and(sql`lower(${users.email}) = ${to}`, isNull(users.deletedAt))).limit(1);
  const status: TicketStatus = statusRaw && isTicketStatus(statusRaw) ? statusRaw : "awaiting_customer";
  const now = new Date();
  const link = await resolveLink(customer?.id ?? null, findReferences(`${subject}\n${body}`), true);
  const [ticket] = await db.insert(mailTickets).values({
    key: makeTicketKey(randomInt), userId: customer?.id ?? null, fromEmail: to, fromName: customer?.name ?? null, subject, source: "staff", staffUnread: false, customerUnread: true, lastStaffAt: now, lastMessageAt: now,
    linkKind: link?.kind ?? null, linkId: link?.id ?? null, linkReference: link?.reference ?? null, ...statusFields(status, now),
  }).returning();
  const [message] = await db.insert(mailMessages).values({ ticketId: ticket.id, direction: "out", authorId: actor.user.id, authorName: firstName(actor.user.name), body, source: "site", rfcMessageId: newRfcId() }).returning();
  await claimAttachments(ids, actor.user.id, ticket.id, message.id);
  await deliverStaffMessage(ticket, message, "new");
  return { id: ticket.id, number: ticket.number, code: ticketCode(ticket.number) };
}

export async function replyToTicket(actor: MailActor, input: { id: string; body: string; attachmentIds?: unknown; status?: string }) {
  const ticket = await ticketForActor(actor, input.id);
  const body = cleanBody(input.body);
  const ids = validIds(input.attachmentIds);
  if (!body && !ids.length) throw new PublicError("Please write your reply or attach a file.", 400, { fields: { body: "Please write your reply." } });
  await enforceRate(RATE_RULES.mailSendPerUserHour, identity("user", actor.user.id), "You are sending messages very quickly. Please wait a little.");
  const now = new Date();
  const rfc = newRfcId();
  if (actor.staff) {
    const status: TicketStatus = input.status && isTicketStatus(input.status) ? input.status : "awaiting_customer";
    const [message] = await db.insert(mailMessages).values({ ticketId: ticket.id, direction: "out", authorId: actor.user.id, authorName: firstName(actor.user.name), body, source: "site", rfcMessageId: rfc }).returning();
    await claimAttachments(ids, actor.user.id, ticket.id, message.id);
    const [updated] = await db.update(mailTickets).set({ ...statusFields(status, now), lastMessageAt: now, lastStaffAt: now, customerUnread: true, staffUnread: false }).where(eq(mailTickets.id, ticket.id)).returning();
    await deliverStaffMessage(updated, message);
    return { ok: true };
  }
  const [message] = await db.insert(mailMessages).values({ ticketId: ticket.id, direction: "in", authorId: actor.user.id, authorName: actor.user.name, body, source: "site", rfcMessageId: rfc }).returning();
  await claimAttachments(ids, actor.user.id, ticket.id, message.id);
  await registerCustomerMessage(ticket, body, now);
  await alertStaff(ticket, body || "(attachment only)", "reply");
  return { ok: true };
}

/** Shared by the website and by email: a customer wrote again. Reopens the ticket and tells staff. */
export async function registerCustomerMessage(ticket: typeof mailTickets.$inferSelect, body: string, now: Date) {
  const link = !ticket.linkId ? await resolveLink(ticket.userId, findReferences(body), false) : null;
  await db.update(mailTickets).set({
    status: "open", autoCloseAt: null, closedAt: null, closeReason: null, closeNoticeSentAt: null, lastMessageAt: now, lastCustomerAt: now, staffUnread: true, customerUnread: false,
    ...(link ? { linkKind: link.kind, linkId: link.id, linkReference: link.reference } : {}),
  }).where(eq(mailTickets.id, ticket.id));
}

export async function changeStatus(actor: MailActor, id: string, statusRaw: string) {
  const ticket = await ticketForActor(actor, id);
  if (!isTicketStatus(statusRaw)) throw new PublicError("Choose a valid status.", 400);
  const now = new Date();
  if (!actor.staff) {
    // Customers may close their own ticket or bring it back; nothing else.
    if (statusRaw === "closed") { await db.update(mailTickets).set({ status: "closed", closedAt: now, closeReason: "customer", autoCloseAt: null }).where(eq(mailTickets.id, ticket.id)); return { ok: true }; }
    if (statusRaw === "open") { await db.update(mailTickets).set({ status: "open", closedAt: null, closeReason: null, autoCloseAt: null, closeNoticeSentAt: null, staffUnread: true, lastMessageAt: now }).where(eq(mailTickets.id, ticket.id)); return { ok: true }; }
    throw new PublicError("You can close a message or reopen it.", 403);
  }
  await db.update(mailTickets).set(statusFields(statusRaw, now)).where(eq(mailTickets.id, ticket.id));
  return { ok: true };
}

export async function linkTicket(actor: MailActor, id: string, referenceRaw: string) {
  if (!actor.staff) throw new PublicError("Only staff can link a request.", 403);
  const ticket = await ticketForActor(actor, id);
  const reference = referenceRaw.trim().toUpperCase().slice(0, 60);
  if (!reference) { await db.update(mailTickets).set({ linkKind: null, linkId: null, linkReference: null }).where(eq(mailTickets.id, ticket.id)); return { ok: true }; }
  const link = await resolveLink(null, [reference], true);
  if (!link) throw new PublicError("No request or print order has this reference.", 404);
  await db.update(mailTickets).set({ linkKind: link.kind, linkId: link.id, linkReference: link.reference }).where(eq(mailTickets.id, ticket.id));
  return { ok: true };
}

/* ---------------------------------------------------------------- housekeeping (cron) */

export async function runAutoClose() {
  const now = new Date();
  const due = await db.select().from(mailTickets).where(and(inArray(mailTickets.status, ["awaiting_customer", "resolved"]), lte(mailTickets.autoCloseAt, now))).limit(200);
  let closed = 0; let notices = 0;
  for (const ticket of due) {
    // Re-check in the update itself: a customer reply in the meantime has already moved the ticket on.
    const [done] = await db.update(mailTickets).set({ status: "closed", closedAt: now, closeReason: "auto", autoCloseAt: null })
      .where(and(eq(mailTickets.id, ticket.id), eq(mailTickets.status, ticket.status), lte(mailTickets.autoCloseAt, now))).returning({ id: mailTickets.id });
    if (!done) continue;
    closed++;
    if (ticket.status !== "awaiting_customer") continue;
    try {
      await sendTicketMail({ to: ticket.fromEmail, subject: subjectWithTag(ticket.subject, ticket.number, ticket.key), kind: "closed", ticketCode: ticketCode(ticket.number), statusLabel: STATUS_LABEL.closed, link: ticketLink(ticket.number), from: supportFrom(), replyTo: supportAddress(), automated: true });
      await db.update(mailTickets).set({ closeNoticeSentAt: new Date() }).where(eq(mailTickets.id, ticket.id));
      notices++;
    } catch (error) { console.error("[mail] could not send the closing notice", error instanceof Error ? error.message : error); }
  }
  return { closed, notices };
}

export async function retryFailedEmails() {
  const rows = await db.select().from(mailMessages).where(and(eq(mailMessages.direction, "out"), eq(mailMessages.emailStatus, "failed"), lt(mailMessages.emailAttempts, 5), sql`${mailMessages.createdAt} > now() - interval '3 days'`)).limit(20);
  for (const message of rows) {
    const [ticket] = await db.select().from(mailTickets).where(eq(mailTickets.id, message.ticketId)).limit(1);
    if (ticket) await deliverStaffMessage(ticket, message);
  }
  return rows.length;
}

export async function removeOrphanAttachments() {
  const rows = await db.delete(mailAttachments).where(and(isNull(mailAttachments.messageId), sql`${mailAttachments.createdAt} < now() - interval '24 hours'`)).returning({ key: mailAttachments.objectKey });
  for (const row of rows) await rm(privateStoragePath(row.key), { force: true }).catch(() => undefined);
  return rows.length;
}

export { STAFF_STATUS_LABEL };
