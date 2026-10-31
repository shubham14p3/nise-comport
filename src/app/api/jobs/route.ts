import { NextRequest, NextResponse } from "next/server";
import { desc, eq, and } from "drizzle-orm";
import { jobs, jobEvents } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError } from "@/lib/http";
import { findOwnedJobByCode } from "@/lib/jobs";
import { validJobCode } from "@/lib/job-id";

export const dynamic = "force-dynamic";

/** Authenticated customer tracking; only work owned by the logged-in account is visible. */
export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const code = request.nextUrl.searchParams.get("code");
    if (code) {
      if (!validJobCode(code)) return NextResponse.json({ error: "Invalid Job ID" }, { status: 400 });
      const job = await findOwnedJobByCode(code, user.id);
      if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
      const [row] = await db.select({ id: jobs.id }).from(jobs)
        .where(and(eq(jobs.code, job.code), eq(jobs.userId, user.id))).limit(1);
      const events = row ? await db.select({ kind: jobEvents.kind, fromStatus: jobEvents.fromStatus, toStatus: jobEvents.toStatus, note: jobEvents.note, createdAt: jobEvents.createdAt })
        .from(jobEvents).where(and(eq(jobEvents.jobId, row.id), eq(jobEvents.publicVisible, true)))
        .orderBy(desc(jobEvents.createdAt)).limit(30) : [];
      return NextResponse.json({ job, events });
    }
    const rows = await db.select({ code: jobs.code, serviceName: jobs.serviceName, status: jobs.status, missingDocuments: jobs.missingDocuments, createdAt: jobs.createdAt, updatedAt: jobs.updatedAt })
      .from(jobs).where(eq(jobs.userId, user.id)).orderBy(desc(jobs.createdAt), desc(jobs.id)).limit(50);
    return NextResponse.json({ jobs: rows });
  } catch (error) { return apiError(error); }
}
