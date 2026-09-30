import { and, asc, eq, inArray, lt, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { notifications } from "@/db/schema";
import { sendRequestReceivedEmail, sendStaffAlertEmail, sendStatusEmail, smtpConfigured } from "@/lib/email";
import { site } from "@/lib/site";

const MAX_ATTEMPTS = 5;

type StatusPayload = { name: string; email: string; reference: string; label: string; status: string };
type ReceivedPayload = { name: string; email: string; reference: string; label: string };
type StaffPayload = { email: string; subject: string; lines: string[] };

/** Staff mailbox for new-request alerts. Falls back to the public contact address. */
export function staffAlertEmail() {
  return process.env.STAFF_ALERT_EMAIL?.trim() || site.email;
}

export async function queueNotification(userId: string, kind: "status_update" | "request_received" | "staff_alert", payload: StatusPayload | ReceivedPayload | StaffPayload) {
  const [row] = await db.insert(notifications).values({ userId, channel: "email", kind, payload, status: "queued" }).returning({ id: notifications.id });
  return row.id;
}

async function deliverOne(item: typeof notifications.$inferSelect) {
  const payload = item.payload as Record<string, unknown>;
  const text = (key: string) => (typeof payload[key] === "string" ? (payload[key] as string) : "");
  if (item.kind === "request_received") {
    if (!text("email") || !text("reference")) throw new Error("Notification payload is incomplete.");
    await sendRequestReceivedEmail(text("email"), text("name") || "there", text("reference"), text("label") || "service");
  } else if (item.kind === "staff_alert") {
    const lines = Array.isArray(payload.lines) ? payload.lines.filter((line): line is string => typeof line === "string") : [];
    if (!text("email") || !text("subject")) throw new Error("Notification payload is incomplete.");
    await sendStaffAlertEmail(text("email"), text("subject"), lines, `${site.url}/admin`);
  } else {
    if (!text("email") || !text("reference") || !text("status")) throw new Error("Notification payload is incomplete.");
    await sendStatusEmail(text("email"), text("name") || "there", text("reference"), text("label") || "request", text("status"));
  }
}

/**
 * Sends queued emails. Failed sends are retried on the next run, up to 5 attempts.
 * Pass ids to send specific notifications right away (e.g. just after a request is created).
 */
export async function deliverNotifications(ids?: string[], limit = 100) {
  if (!smtpConfigured()) return { sent: 0, failed: 0, skipped: true };
  const pending = and(eq(notifications.channel, "email"), or(eq(notifications.status, "queued"), eq(notifications.status, "retry")), lt(notifications.attempts, MAX_ATTEMPTS));
  const rows = await db.select().from(notifications).where(ids?.length ? and(pending, inArray(notifications.id, ids)) : pending).orderBy(asc(notifications.createdAt)).limit(limit);
  let sent = 0;
  let failed = 0;
  for (const item of rows) {
    // Claim the row first so two cron runs never send the same email twice.
    const claimed = await db.update(notifications).set({ status: "sending", attempts: item.attempts + 1 }).where(and(eq(notifications.id, item.id), eq(notifications.attempts, item.attempts), inArray(notifications.status, ["queued", "retry"]))).returning({ id: notifications.id });
    if (!claimed.length) continue;
    try {
      await deliverOne(item);
      await db.update(notifications).set({ status: "sent", sentAt: new Date(), lastError: null }).where(eq(notifications.id, item.id));
      sent++;
    } catch (error) {
      failed++;
      const message = error instanceof Error ? error.message.slice(0, 300) : "Unknown email error";
      console.error("[notifications] send failed", item.id, message);
      await db.update(notifications).set({ status: item.attempts + 1 >= MAX_ATTEMPTS ? "failed" : "retry", lastError: message }).where(eq(notifications.id, item.id));
    }
  }
  return { sent, failed, skipped: false };
}

/** Rows stuck in "sending" (server crashed mid-send) go back to the retry queue after 15 minutes. */
export async function releaseStuckNotifications() {
  const cutoff = new Date(Date.now() - 15 * 60_000);
  await db.update(notifications).set({ status: "retry" }).where(and(eq(notifications.status, "sending"), lt(notifications.createdAt, cutoff)));
}
