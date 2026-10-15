import { timingSafeEqual } from "node:crypto";
import { rm } from "node:fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { eq, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { emailOtps, printJobs, rateLimits, serviceRequests, sessions, storedFiles } from "@/db/schema";
import { deliverNotifications, releaseStuckNotifications } from "@/lib/notifications";
import { privateStoragePath } from "@/lib/storage";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorised(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization") ?? "";
  if (!secret || secret.length < 16) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(header);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

/**
 * Housekeeping, run every 10–15 minutes by a scheduler (Vercel Cron sends GET, curl/systemd can POST):
 *   curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://www.nisecomport.com/api/cron/cleanup
 * Sends queued emails (with retries), removes expired codes/sessions/rate-limit rows and
 * deletes private files whose retention period has ended.
 */
async function run(request: NextRequest) {
  if (!authorised(request)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const now = new Date();
  const report: Record<string, number | boolean | string> = {};
  try {
    report.expiredOtps = (await db.delete(emailOtps).where(lt(emailOtps.expiresAt, now)).returning({ id: emailOtps.id })).length;
    report.expiredSessions = (await db.delete(sessions).where(lt(sessions.expiresAt, now)).returning({ id: sessions.id })).length;
    report.oldRateLimits = (await db.delete(rateLimits).where(lt(rateLimits.windowStart, new Date(now.getTime() - 2 * 24 * 60 * 60_000))).returning({ key: rateLimits.key })).length;

    const expired = await db.select().from(storedFiles).where(lt(storedFiles.retainUntil, now)).limit(500);
    let deleted = 0;
    for (const file of expired) {
      const [job] = await db.select({ id: printJobs.id, status: printJobs.status }).from(printJobs).where(eq(printJobs.fileId, file.id)).limit(1);
      const [service] = file.requestId ? await db.select({ id: serviceRequests.id, status: serviceRequests.status }).from(serviceRequests).where(eq(serviceRequests.id, file.requestId)).limit(1) : [];
      if (job && !["completed", "cancelled"].includes(job.status)) continue;
      if (service && !["completed", "cancelled"].includes(service.status)) continue;
      if (job) await db.update(printJobs).set({ fileId: null }).where(eq(printJobs.id, job.id));
      await rm(privateStoragePath(file.objectKey), { force: true }).catch(() => undefined);
      await db.delete(storedFiles).where(eq(storedFiles.id, file.id));
      deleted++;
    }
    report.deletedFiles = deleted;

    await releaseStuckNotifications();
    const mail = await deliverNotifications(undefined, 100);
    report.emailsSent = mail.sent;
    report.emailsFailed = mail.failed;
    report.smtpConfigured = !mail.skipped;
    return NextResponse.json({ ok: true, ...report });
  } catch (error) {
    console.error("[cron] cleanup failed", error);
    return NextResponse.json({ ok: false, ...report, error: "Cleanup failed; see server logs." }, { status: 500 });
  }
}

export const GET = run;
export const POST = run;
