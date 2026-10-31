import { mailboxSyncKey } from "@/lib/mail-config";
import { randomInt } from "node:crypto";
import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { mailMessages, mailSync, mailTickets, users } from "@/db/schema";
import {
  allowedAttachmentType, cleanBody, cleanSubject, findReferences, htmlToText, looksAutomated, makeTicketKey, MAX_ATTACHMENT_BYTES, MAX_ATTACHMENTS_PER_MESSAGE,
  parseTicketTag, safeFileName, stripQuotedReply, validSignature,
} from "@/lib/mail-core";
import { alertStaff, imapConnection, registerCustomerMessage, resolveLink, supportAddress, writeAttachment } from "@/lib/mail";
import { sendTicketMail } from "@/lib/email";
import { absoluteUrl, site } from "@/lib/site";
import { MAIL_PATH } from "@/lib/mail-route";
import { STATUS_LABEL, subjectWithTag, ticketCode } from "@/lib/mail-core";

/** The parts of imapflow / mailparser used here. They are loaded at run time so the website itself never depends on them. */
type Address = { address?: string; name?: string };
type Parsed = {
  subject?: string; text?: string; html?: string | false; messageId?: string; inReplyTo?: string; references?: string | string[];
  from?: { value: Address[] }; headers: Map<string, unknown>;
  attachments: { filename?: string; contentType: string; content: Buffer; size: number; related?: boolean; contentDisposition?: string }[];
};
type ImapClient = {
  connect(): Promise<void>; logout(): Promise<void>; close(): void;
  getMailboxLock(path: string): Promise<{ release(): void }>;
  mailbox: { uidValidity?: bigint | number } | false;
  search(query: Record<string, unknown>, options?: { uid?: boolean }): Promise<number[] | false>;
  fetchOne(range: string, query: Record<string, unknown>, options?: { uid?: boolean }): Promise<{ uid: number; size?: number; source?: Buffer } | false>;
  on(event: "error", handler: (error: Error) => void): void;
};
const moduleName = (name: string) => name;

export async function ingestInbound(input: { fromEmail: string; fromName: string | null; subject: string; text: string; rfcMessageId: string | null; inReplyTo: string | null; references: string[]; attachments: { name: string; contentType: string; content: Buffer }[] }) {
  const email = input.fromEmail.trim().toLowerCase();
  if (input.rfcMessageId) {
    const [seen] = await db.select({ id: mailMessages.id }).from(mailMessages).where(eq(mailMessages.rfcMessageId, input.rfcMessageId)).limit(1);
    if (seen) return "duplicate" as const;
  }
  const [account] = await db.select({ id: users.id, name: users.name }).from(users).where(and(sql`lower(${users.email}) = ${email}`, sql`${users.deletedAt} is null`)).limit(1);
  const now = new Date();

  // 1. Is it an answer in an existing conversation? The tag in the subject must match and the sender must be the ticket's owner.
  let ticket: typeof mailTickets.$inferSelect | undefined;
  const tag = parseTicketTag(input.subject);
  if (tag) {
    const [candidate] = await db.select().from(mailTickets).where(and(eq(mailTickets.number, tag.number), eq(mailTickets.key, tag.key))).limit(1);
    if (candidate && candidate.fromEmail.toLowerCase() === email) ticket = candidate;
  }
  if (!ticket) {
    const ids = [input.inReplyTo, ...input.references].filter((id): id is string => Boolean(id));
    if (ids.length) {
      const [hit] = await db.select({ ticketId: mailMessages.ticketId }).from(mailMessages).where(sql`${mailMessages.rfcMessageId} in (${sql.join(ids.map((id) => sql`${id}`), sql`, `)})`).limit(1);
      if (hit) { const [candidate] = await db.select().from(mailTickets).where(eq(mailTickets.id, hit.ticketId)).limit(1); if (candidate && candidate.fromEmail.toLowerCase() === email) ticket = candidate; }
    }
  }

  if (!ticket) {
    const [recent] = await db.select({ n: sql<number>`count(*)::int` }).from(mailTickets).where(and(eq(mailTickets.fromEmail, email), gte(mailTickets.createdAt, new Date(Date.now() - 24 * 3600_000))));
    if ((recent?.n ?? 0) >= 10) return "limited" as const;
  }

  const body = cleanBody(ticket ? stripQuotedReply(input.text) : input.text);
  const subject = cleanSubject(input.subject.replace(/\[?NC-T\d{1,9}-[A-Z0-9]{4}\]?/gi, "").replace(/^\s*((re|fwd?)\s*:\s*)+/i, "")) || "Message by email";

  let created = false;
  if (!ticket) {
    const link = await resolveLink(account?.id ?? null, findReferences(`${subject}\n${body}`), false);
    [ticket] = await db.insert(mailTickets).values({
      key: makeTicketKey(randomInt), userId: account?.id ?? null, fromEmail: email, fromName: account?.name ?? input.fromName, subject, status: "open", source: "email",
      linkKind: link?.kind ?? null, linkId: link?.id ?? null, linkReference: link?.reference ?? null, staffUnread: true, lastCustomerAt: now, lastMessageAt: now,
    }).returning();
    created = true;
  }

  const [message] = await db.insert(mailMessages).values({ ticketId: ticket.id, direction: "in", authorId: account?.id ?? null, authorName: account?.name ?? input.fromName ?? email, body: body || "(no text)", source: "email", rfcMessageId: input.rfcMessageId }).returning();

  const notes: string[] = [];
  let kept = 0;
  for (const file of input.attachments) {
    const name = safeFileName(file.name);
    const type = allowedAttachmentType(name, file.contentType);
    if (kept >= MAX_ATTACHMENTS_PER_MESSAGE) { notes.push(`${name} (too many files)`); continue; }
    if (!type) { notes.push(`${name} (file type not accepted)`); continue; }
    if (file.content.length > MAX_ATTACHMENT_BYTES) { notes.push(`${name} (over 15 MB)`); continue; }
    if (!validSignature(type, file.content)) { notes.push(`${name} (not a valid file)`); continue; }
    try { await writeAttachment({ bytes: file.content, name, type, uploaderId: null, ticketId: ticket.id, messageId: message.id }); kept++; } catch { notes.push(`${name} (could not be saved)`); }
  }
  if (notes.length) await db.update(mailMessages).set({ body: `${body || "(no text)"}\n\n[Not stored: ${notes.join("; ")}]` }).where(eq(mailMessages.id, message.id));

  if (created) {
    try {
      await sendTicketMail({
        to: email, subject: subjectWithTag(subject, ticket.number, ticket.key), kind: "received", ticketCode: ticketCode(ticket.number), statusLabel: STATUS_LABEL.open, ticketSubject: ticket.subject, openedAt: ticket.createdAt, yourMessage: body || undefined, link: absoluteUrl(`${MAIL_PATH}?t=${ticket.number}`),
        from: `"${site.name} Support" <${supportAddress()}>`, replyTo: supportAddress(), inReplyTo: input.rfcMessageId ?? undefined, references: input.rfcMessageId ? [input.rfcMessageId] : undefined, automated: true,
      });
    } catch (error) { console.error("[mail] could not acknowledge an emailed message", error instanceof Error ? error.message : error); }
    await alertStaff(ticket, body || "(no text)", "new");
    return "created" as const;
  }
  await registerCustomerMessage(ticket, body, now);
  await alertStaff(ticket, body || "(no text)", "reply");
  return "added" as const;
}

/** Reads new mail from the support mailbox. Safe to call often; returns quickly when nothing is new. */
export async function pollSupportMailbox(): Promise<{ ok: boolean; imported: number; skipped: number; error?: string }> {
  const settings = await imapConnection();
  if (!settings) return { ok: false, imported: 0, skipped: 0, error: "Incoming IMAP is not configured. Set MAIL_IMAP_HOST/USER/PASSWORD in the server environment, or IMAP credentials in the encrypted Email integration." };
  let client: ImapClient | null = null;
  let imported = 0; let skipped = 0;
  const own = (process.env.MAIL_SUPPORT_ADDRESS?.trim() || settings.user || supportAddress()).toLowerCase();
  try {
    const { ImapFlow } = (await import(/* webpackIgnore: true */ moduleName("imapflow"))) as { ImapFlow: new (options: Record<string, unknown>) => ImapClient };
    const { simpleParser } = (await import(/* webpackIgnore: true */ moduleName("mailparser"))) as { simpleParser: (source: Buffer) => Promise<Parsed> };
    client = new ImapFlow({
      host: settings.host, port: settings.port, secure: settings.secure,
      auth: { user: settings.user, pass: settings.password }, logger: false,
      ...(settings.tlsServername ? { tls: { servername: settings.tlsServername } } : {}),
    });
    client.on("error", (error) => console.error("[mail] imap connection error", error.message));
    await client.connect();
    const lock = await client.getMailboxLock(settings.folder);
    try {
      const validity = client.mailbox ? String(client.mailbox.uidValidity ?? "") : "";
      const [state] = await db.select().from(mailSync).where(eq(mailSync.id, mailboxSyncKey(settings))).limit(1);
      const fresh = !state || state.uidValidity !== validity;
      // First run (or a rebuilt mailbox): only the last 3 days, so old mail never floods the desk.
      const found = fresh ? await client.search({ since: new Date(Date.now() - 3 * 24 * 3600_000) }, { uid: true }) : await client.search({ uid: `${state.lastUid + 1}:*` }, { uid: true });
      const base = fresh ? 0 : state.lastUid;
      const uids = (found || []).filter((uid) => uid > base).sort((a, b) => a - b).slice(0, 40);
      let lastUid = base;
      for (const uid of uids) {
        try {
          const raw = await client.fetchOne(String(uid), { source: true, size: true }, { uid: true });
          if (raw && raw.source && (raw.size ?? raw.source.length) <= 40 * 1024 * 1024) {
            const parsed = await simpleParser(raw.source);
            const from = parsed.from?.value?.[0];
            const address = from?.address?.toLowerCase() ?? "";
            if (!address || address === own || looksAutomated(parsed.headers, `${from?.name ?? ""} <${address}>`)) { skipped++; }
            else {
              const text = (parsed.text && parsed.text.trim()) || (typeof parsed.html === "string" ? htmlToText(parsed.html) : "");
              const refs = parsed.references ? (Array.isArray(parsed.references) ? parsed.references : parsed.references.split(/\s+/)) : [];
              const outcome = await ingestInbound({
                fromEmail: address, fromName: from?.name || null, subject: parsed.subject ?? "", text, rfcMessageId: parsed.messageId ?? null, inReplyTo: parsed.inReplyTo ?? null, references: refs.filter(Boolean),
                attachments: parsed.attachments.filter((file) => !(file.related && file.size < 40_000)).map((file) => ({ name: file.filename || "attachment", contentType: file.contentType, content: file.content })),
              });
              if (outcome === "created" || outcome === "added") imported++; else skipped++;
            }
          } else skipped++;
          lastUid = uid;
        } catch (error) {
          console.error("[mail] could not read one message", uid, error instanceof Error ? error.message : error);
          break; // try this one again next time rather than skipping past it
        }
      }
      await db.insert(mailSync).values({ id: mailboxSyncKey(settings), uidValidity: validity, lastUid, lastRunAt: new Date(), lastError: null, lastImported: imported })
        .onConflictDoUpdate({ target: mailSync.id, set: { uidValidity: validity, lastUid, lastRunAt: new Date(), lastError: null, lastImported: imported } });
    } finally { lock.release(); }
    await client.logout();
    return { ok: true, imported, skipped };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Mailbox error";
    console.error("[mail] mailbox check failed", message);
    try { client?.close(); } catch { /* already closed */ }
    await db.insert(mailSync).values({ id: mailboxSyncKey(settings), lastRunAt: new Date(), lastError: message.slice(0, 300) }).onConflictDoUpdate({ target: mailSync.id, set: { lastRunAt: new Date(), lastError: message.slice(0, 300) } }).catch(() => undefined);
    return { ok: false, imported, skipped, error: message };
  }
}
