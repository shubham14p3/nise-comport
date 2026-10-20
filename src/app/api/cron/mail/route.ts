import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { removeOrphanAttachments, retryFailedEmails, runAutoClose } from "@/lib/mail";
import { pollSupportMailbox } from "@/lib/mail-imap";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

function authorised(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization") ?? "";
  if (!secret || secret.length < 16) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(header);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

/**
 * Message centre housekeeping, run every 5 minutes by the scheduler:
 *   curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://www.nisecomport.com/api/cron/mail
 * Reads new mail from the support mailbox, closes tickets that waited 48 hours for the customer,
 * retries replies that could not be emailed and clears attachments that were never sent.
 */
async function run(request: NextRequest) {
  if (!authorised(request)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const mailbox = await pollSupportMailbox();
  const closing = await runAutoClose();
  const retried = await retryFailedEmails();
  const removed = await removeOrphanAttachments();
  return NextResponse.json({ ok: true, mailbox: { ok: mailbox.ok, imported: mailbox.imported, error: mailbox.error }, closed: closing.closed, retried, removed }, { headers: { "cache-control": "no-store" } });
}

export const GET = run;
export const POST = run;
