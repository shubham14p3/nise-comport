import { NextRequest, NextResponse } from "next/server";
import { and, eq, lt } from "drizzle-orm";
import { rm } from "node:fs/promises";
import { db } from "@/lib/db";
import { emailOtps, notifications, printJobs, serviceRequests, sessions, storedFiles } from "@/db/schema";
import { privateStoragePath } from "@/lib/storage";
import { sendStatusEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const cutoff = new Date();
  const expiredOtpCount = await db.delete(emailOtps).where(lt(emailOtps.expiresAt, cutoff)).returning({ id: emailOtps.id });
  const expiredSessionCount = await db.delete(sessions).where(lt(sessions.expiresAt, cutoff)).returning({ id: sessions.id });
  const expired = await db.select().from(storedFiles).where(lt(storedFiles.retainUntil, cutoff));
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
  const queued = await db.select().from(notifications).where(and(eq(notifications.channel, "email"), eq(notifications.status, "queued"))).limit(100);
  let notified = 0;
  for (const item of queued) {
    const payload = item.payload as { name?: string; email?: string; reference?: string; label?: string; status?: string };
    try {
      if (!payload.email || !payload.name || !payload.reference || !payload.label || !payload.status) throw new Error("Notification is incomplete.");
      await sendStatusEmail(payload.email, payload.name, payload.reference, payload.label, payload.status);
      await db.update(notifications).set({ status: "sent" }).where(and(eq(notifications.id, item.id), eq(notifications.status, "queued")));
      notified++;
    } catch (error) {
      console.error("Status email failed", item.id, error);
      await db.update(notifications).set({ status: "failed" }).where(eq(notifications.id, item.id));
    }
  }
  return NextResponse.json({ ok: true, deleted, notified, expiredOtps: expiredOtpCount.length, expiredSessions: expiredSessionCount.length });
}
