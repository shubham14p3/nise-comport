import { NextRequest, NextResponse } from "next/server";
import { desc, eq, ilike, or } from "drizzle-orm";
import { z } from "zod";
import { jobs, jobEvents } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PublicError } from "@/lib/errors";
import { apiError, readJson } from "@/lib/http";
import { validJobCode } from "@/lib/job-id";

const patchSchema = z.object({
  code: z.string().max(40),
  missingDocuments: z.array(z.string().trim().min(2).max(100)).max(20).optional(),
  internalNote: z.string().trim().max(2000).optional(),
  customerUpdate: z.string().trim().min(2).max(500).optional(),
});

async function requireAdmin() {
  const actor = await getCurrentUser();
  // Narrow to admins until source-kind and category-scoped staff permissions are audited.
  if (!actor || actor.role !== "admin") throw new PublicError("Admin access required.", 403);
  return actor;
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const code = validJobCode(request.nextUrl.searchParams.get("code") ?? "");
    if (!code) {
      const search = (request.nextUrl.searchParams.get("query") ?? "").trim().slice(0, 80);
      const requestedPage = Number(request.nextUrl.searchParams.get("page") ?? 0);
      const page = Number.isSafeInteger(requestedPage) ? Math.max(0, Math.min(10000, requestedPage)) : 0;
      const like = `%${search.replace(/[\\%_]/g, "\\    if (!code) throw new PublicError("Enter a valid Job ID.", 400);
    const [job]")}%`;
      const where = search ? or(ilike(jobs.code, like), ilike(jobs.serviceName, like), ilike(jobs.sourceReference, like)) : undefined;
      const rows = await db.select({
        code: jobs.code, serviceName: jobs.serviceName, sourceKind: jobs.sourceKind,
        sourceReference: jobs.sourceReference, status: jobs.status, missingDocuments: jobs.missingDocuments,
        createdAt: jobs.createdAt,
      }).from(jobs).where(where).orderBy(desc(jobs.createdAt), desc(jobs.id)).limit(20).offset(page * 20);
      return NextResponse.json({ jobs: rows, page, pageSize: 20 });
    }
    const [job] = await db.select().from(jobs).where(eq(jobs.code, code)).limit(1);
    if (!job) throw new PublicError("Job not found.", 404);
    const events = await db.select().from(jobEvents).where(eq(jobEvents.jobId, job.id)).orderBy(desc(jobEvents.createdAt)).limit(50);
    return NextResponse.json({ job, events });
  } catch (error) { return apiError(error); }
}

export async function PATCH(request: NextRequest) {
  try {
    const actor = await requireAdmin();
    const origin = request.headers.get("origin");
    if (!origin || new URL(origin).host !== request.nextUrl.host) throw new PublicError("Invalid request origin.", 403);
    const input = patchSchema.parse(await readJson(request));
    const code = validJobCode(input.code);
    if (!code) throw new PublicError("Invalid Job ID.", 400);
    if (input.missingDocuments === undefined && input.internalNote === undefined && input.customerUpdate === undefined) throw new PublicError("Nothing to update.", 400);
    const updated = await db.transaction(async (tx) => {
      const [before] = await tx.select().from(jobs).where(eq(jobs.code, code)).limit(1);
      if (!before) throw new PublicError("Job not found.", 404);
      const [job] = await tx.update(jobs).set({
        ...(input.missingDocuments !== undefined ? { missingDocuments: [...new Set(input.missingDocuments)] } : {}),
        ...(input.internalNote !== undefined ? { internalNote: input.internalNote } : {}),
        updatedAt: new Date(),
      }).where(eq(jobs.id, before.id)).returning();
      if (input.missingDocuments !== undefined || input.internalNote !== undefined) {
        await tx.insert(jobEvents).values({
          jobId: job.id, actorId: actor.id, kind: "staff_note",
          note: input.missingDocuments !== undefined ? "Missing-document checklist updated" : "Internal note updated",
          publicVisible: false,
        });
      }
      if (input.customerUpdate) {
        await tx.insert(jobEvents).values({
          jobId: job.id, actorId: actor.id, kind: "customer_update",
          note: input.customerUpdate, publicVisible: true,
        });
      }
      return job;
    });
    return NextResponse.json({ ok: true, job: updated });
  } catch (error) { return apiError(error); }
}
