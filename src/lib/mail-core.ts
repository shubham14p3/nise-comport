/** Pure helpers for the message centre (tickets). No database or network here, so they are easy to test. */

export const TICKET_STATUSES = ["open", "awaiting_customer", "get_back_soon", "resolved", "closed"] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

export const STATUS_LABEL: Record<TicketStatus, string> = {
  open: "Open",
  awaiting_customer: "Waiting for your reply",
  get_back_soon: "We’ll get back soon",
  resolved: "Resolved",
  closed: "Closed",
};
/** Staff-side wording. */
export const STAFF_STATUS_LABEL: Record<TicketStatus, string> = {
  open: "Open", awaiting_customer: "Waiting for customer", get_back_soon: "Get back soon", resolved: "Resolved", closed: "Closed",
};

export const AUTO_CLOSE_HOURS = 48;
export const MAX_ATTACHMENT_BYTES = 15 * 1024 * 1024;
export const MAX_ATTACHMENTS_PER_MESSAGE = 10;
export const MAX_BODY_CHARS = 20000;

export function isTicketStatus(value: string): value is TicketStatus { return (TICKET_STATUSES as readonly string[]).includes(value); }

/** "NC-T1042" */
export function ticketCode(number: number) { return `NC-T${number}`; }

/** Tag put in every outgoing subject so replies find their ticket: "[NC-T1042-K7Q2]". */
export function ticketTag(number: number, key: string) { return `[${ticketCode(number)}-${key}]`; }

const TAG = /\[?NC-T(\d{1,9})-([A-Z0-9]{4})\]?/i;
export function parseTicketTag(text: string): { number: number; key: string } | null {
  const match = TAG.exec(text);
  return match ? { number: Number(match[1]), key: match[2].toUpperCase() } : null;
}

const KEY_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function makeTicketKey(random: (max: number) => number) {
  return Array.from({ length: 4 }, () => KEY_ALPHABET[random(KEY_ALPHABET.length)]).join("");
}

export function subjectWithTag(subject: string, number: number, key: string) {
  const clean = subject.replace(TAG, "").replace(/^\s*((re|fwd?)\s*:\s*)+/i, "").replace(/\s+/g, " ").trim() || "Your message";
  return `Re: ${clean} ${ticketTag(number, key)}`;
}

/** Request, print and PAN references look like NC-…, PR-… or PAN-…; returned upper case, ticket tags excluded. */
export function findReferences(text: string): string[] {
  const found = new Set<string>();
  for (const match of text.toUpperCase().matchAll(/\b(?:NC|PR|PAN)-[A-Z0-9]{3,}(?:-[A-Z0-9]{2,})*\b/g)) {
    if (/^NC-T\d/.test(match[0])) continue;
    found.add(match[0]);
  }
  return [...found].slice(0, 5);
}

/** Cuts the quoted older messages off an emailed reply so the thread stays readable. */
export function stripQuotedReply(body: string): string {
  const lines = body.replace(/\r\n?/g, "\n").split("\n");
  const out: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*-#-#-\s*please reply above this line/i.test(line)) break;
    if (/^\s*>/.test(line)) { if (!out.some((l) => l.trim())) continue; break; }
    if (/^\s*on .{5,200}wrote:\s*$/i.test(line) || /^\s*-{2,}\s*(original message|forwarded message)\s*-{2,}/i.test(line) || /^\s*_{5,}\s*$/.test(line)) break;
    if (/^\s*from:\s.+/i.test(line) && /^\s*(sent|date):\s/i.test(lines[i + 1] ?? "")) break;
    out.push(line);
  }
  const text = out.join("\n").trim();
  return text || body.trim();
}

const ALLOWED_TYPES: Record<string, string[]> = {
  "image/jpeg": [".jpg", ".jpeg"], "image/png": [".png"], "image/webp": [".webp"], "image/gif": [".gif"],
  "application/pdf": [".pdf"],
  "application/msword": [".doc"], "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/vnd.ms-excel": [".xls"], "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  "text/csv": [".csv"], "text/plain": [".txt"],
};
const EXT_TO_TYPE = new Map(Object.entries(ALLOWED_TYPES).flatMap(([type, exts]) => exts.map((ext) => [ext, type] as const)));

export function extensionOf(name: string) { const i = name.lastIndexOf("."); return i < 0 ? "" : name.slice(i).toLowerCase(); }

/** Decides from the file name (mail programs often send a wrong or generic type). Returns the type to store, or null if not allowed. */
export function allowedAttachmentType(name: string, declaredType: string): string | null {
  const type = EXT_TO_TYPE.get(extensionOf(name));
  if (!type) return null;
  if (declaredType && declaredType !== "application/octet-stream" && ALLOWED_TYPES[declaredType] && declaredType !== type) return null;
  return type;
}

export function safeFileName(name: string) {
  const cleaned = name.normalize("NFKC").replace(/[\\/\r\n\0]/g, "_").replace(/[^\p{L}\p{N}._ ()-]/gu, "_").replace(/\s+/g, " ").trim().slice(-120);
  return cleaned || "file";
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

/** When a ticket that is waiting for the customer closes by itself. */
export function autoCloseAt(from: Date) { return new Date(from.getTime() + AUTO_CLOSE_HOURS * 3600_000); }

/** Mail from machines (bounces, vacation replies, newsletters) must never open tickets or get an answer. */
export function looksAutomated(headers: { get(name: string): unknown }, from: string): boolean {
  const lower = from.toLowerCase();
  if (/(^|[<\s])(mailer-daemon|postmaster|no-?reply|do-?not-?reply|bounce)/.test(lower)) return true;
  const auto = String(headers.get("auto-submitted") ?? "").toLowerCase();
  if (auto && auto !== "no") return true;
  const precedence = String(headers.get("precedence") ?? "").toLowerCase();
  if (/bulk|junk|list|auto_reply/.test(precedence)) return true;
  if (headers.get("x-autoreply") || headers.get("x-autorespond") || headers.get("list-unsubscribe")) return true;
  return false;
}

export function cleanSubject(value: string) {
  return value.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 150);
}
export function cleanBody(value: string) {
  return value.replace(/\r\n?/g, "\n").replace(/\0/g, "").trim().slice(0, MAX_BODY_CHARS);
}

/* ---------------------------------------------------------------- text from HTML-only emails */

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", ndash: "–", mdash: "—", hellip: "…" };
export function htmlToText(html: string): string {
  return html
    .replace(/<(script|style|head)[\s\S]*?<\/\1>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|tr|li|h[1-6]|blockquote)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (whole, code: string) => {
      if (code[0] === "#") {
        const n = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
        return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : "";
      }
      return ENTITIES[code.toLowerCase()] ?? whole;
    })
    .replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

/* ---------------------------------------------------------------- ZIP (stored, no compression) */

let crcTable: Uint32Array | null = null;
export function crc32(bytes: Uint8Array): number {
  if (!crcTable) {
    crcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crcTable[n] = c >>> 0; }
  }
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) crc = crcTable[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

/** Makes names unique inside a folder: "a.pdf", "a (2).pdf". */
export function uniqueNames(names: string[]): string[] {
  const seen = new Map<string, number>();
  return names.map((name) => {
    const key = name.toLowerCase();
    const count = (seen.get(key) ?? 0) + 1;
    seen.set(key, count);
    if (count === 1) return name;
    const dot = name.lastIndexOf(".");
    return dot > 0 ? `${name.slice(0, dot)} (${count})${name.slice(dot)}` : `${name} (${count})`;
  });
}

export function buildZip(entries: { name: string; data: Uint8Array }[], now = new Date()): Uint8Array {
  const encoder = new TextEncoder();
  const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | Math.floor(now.getSeconds() / 2);
  const dosDate = ((Math.max(1980, now.getFullYear()) - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;
  for (const entry of entries) {
    const name = encoder.encode(entry.name);
    const crc = crc32(entry.data);
    const local = new Uint8Array(30 + name.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true); lv.setUint16(4, 20, true); lv.setUint16(6, 0x0800, true); lv.setUint16(8, 0, true);
    lv.setUint16(10, dosTime, true); lv.setUint16(12, dosDate, true); lv.setUint32(14, crc, true);
    lv.setUint32(18, entry.data.length, true); lv.setUint32(22, entry.data.length, true); lv.setUint16(26, name.length, true); lv.setUint16(28, 0, true);
    local.set(name, 30);
    const central = new Uint8Array(46 + name.length);
    const cv = new DataView(central.buffer);
    cv.setUint32(0, 0x02014b50, true); cv.setUint16(4, 20, true); cv.setUint16(6, 20, true); cv.setUint16(8, 0x0800, true); cv.setUint16(10, 0, true);
    cv.setUint16(12, dosTime, true); cv.setUint16(14, dosDate, true); cv.setUint32(16, crc, true);
    cv.setUint32(20, entry.data.length, true); cv.setUint32(24, entry.data.length, true); cv.setUint16(28, name.length, true);
    cv.setUint32(42, offset, true);
    central.set(name, 46);
    locals.push(local, entry.data); centrals.push(central);
    offset += local.length + entry.data.length;
  }
  const centralSize = centrals.reduce((sum, part) => sum + part.length, 0);
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true); ev.setUint16(8, entries.length, true); ev.setUint16(10, entries.length, true);
  ev.setUint32(12, centralSize, true); ev.setUint32(16, offset, true);
  const out = new Uint8Array(offset + centralSize + 22);
  let at = 0;
  for (const part of [...locals, ...centrals, end]) { out.set(part, at); at += part.length; }
  return out;
}

/** Counts the people-facing number of a thread preview: first line of the body, shortened. */
export function snippet(body: string, max = 110) {
  const flat = body.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max - 1).trimEnd()}…` : flat;
}

export const QUICK_REPLIES: { label: string; text: string }[] = [
  { label: "Received your documents", text: "Thank you. We have received your documents and will start working on them shortly." },
  { label: "Need a clearer copy", text: "The copy you sent is not clear enough for us to use. Please send a clear, full-page scan or photo of the original document, in good light." },
  { label: "Work is in progress", text: "Your request is in progress. We will update you as soon as there is a result." },
  { label: "Completed — please collect", text: "Your work is complete. You can collect it from our service desk during working hours, or reply here if you need it sent to you." },
];

/** Checks the first bytes match what the file claims to be, so a renamed program can't pass as a picture. */
export function validSignature(type: string, bytes: Uint8Array): boolean {
  const at = (i: number) => bytes[i];
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.subarray(from, to));
  switch (type) {
    case "image/jpeg": return at(0) === 0xff && at(1) === 0xd8 && at(2) === 0xff;
    case "image/png": return at(0) === 0x89 && ascii(1, 4) === "PNG";
    case "image/gif": return ascii(0, 4) === "GIF8";
    case "image/webp": return ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP";
    case "application/pdf": return ascii(0, 5) === "%PDF-";
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": return at(0) === 0x50 && at(1) === 0x4b;
    case "application/msword":
    case "application/vnd.ms-excel": return at(0) === 0xd0 && at(1) === 0xcf && at(2) === 0x11 && at(3) === 0xe0;
    case "text/csv":
    case "text/plain": return !bytes.subarray(0, 4096).includes(0);
    default: return false;
  }
}

export const PREVIEWABLE = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"]);
export const isImageType = (type: string) => type.startsWith("image/");

/* ---------------------------------------------------------------- shapes shared by server and screen */

export type MailAttachmentInfo = { id: string; name: string; mimeType: string; sizeBytes: number };
export type MailLinkInfo = {
  kind: "print" | "request"; id: string; reference: string; label: string; status: string;
  /** Only sent to staff. */
  files?: MailAttachmentInfo[];
};
export type MailTicketSummary = {
  id: string; number: number; code: string; subject: string; status: TicketStatus; fromEmail: string; fromName: string | null;
  source: string; unread: boolean; lastMessageAt: string; preview: string; attachmentCount: number; linkReference: string | null;
};
export type MailMessageView = {
  id: string; direction: "in" | "out"; authorName: string | null; body: string; createdAt: string; source: string;
  emailStatus?: string; attachments: MailAttachmentInfo[];
};
export type MailTicketDetail = {
  ticket: MailTicketSummary & { createdAt: string; closedAt: string | null; autoCloseAt: string | null; closeReason: string | null };
  messages: MailMessageView[]; link: MailLinkInfo | null;
};
export type MailBox = "all" | "active" | "open" | "awaiting_customer" | "get_back_soon" | "resolved" | "closed" | "unread";
export type MailMeta = {
  canDelete?: boolean; mailboxError?: string; mailboxSource?: string; staff: boolean; counts: Record<string, number>; unread: number; supportAddress: string; mailboxConnected: boolean;
  storage?: { mailBytes: number; mailFiles: number; documentsBytes: number; limitBytes: number; diskFreeBytes: number | null; diskTotalBytes: number | null };
  sync?: { lastRunAt: string | null; lastError: string | null; lastImported: number };
};
