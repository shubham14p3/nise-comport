import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { jobs, users } from "@/db/schema";
import { db } from "@/lib/db";
import { validJobCode } from "@/lib/job-id";

/** Unambiguous, verified ownership. A WhatsApp alias is NOT evidence of phone verification. */
export async function verifiedWhatsAppUserId(phone: string): Promise<string | null> {
  const matches = await db.select({ id: users.id }).from(users).where(and(
    eq(users.phone, phone),
    isNotNull(users.phoneVerifiedAt),
    isNull(users.deletedAt),
    isNull(users.disabledAt),
  )).limit(2);
  return matches.length === 1 ? matches[0].id : null;
}

/** Triggers create the job in the same transaction as the source record. */
export async function jobCodeForSource(kind: "service" | "print" | "counter" | "historical", sourceId: string): Promise<string | null> {
  const [job] = await db.select({ code: jobs.code }).from(jobs)
    .where(and(eq(jobs.sourceKind, kind), eq(jobs.sourceId, sourceId))).limit(1);
  return job?.code ?? null;
}

export async function findOwnedJobByCode(code: string, userId: string) {
  const normalized = validJobCode(code);
  if (!normalized) return null;
  const [job] = await db.select({
    code: jobs.code, serviceName: jobs.serviceName, status: jobs.status,
    missingDocuments: jobs.missingDocuments, sourceReference: jobs.sourceReference,
    createdAt: jobs.createdAt, updatedAt: jobs.updatedAt,
  }).from(jobs).where(and(eq(jobs.code, normalized), eq(jobs.userId, userId))).limit(1);
  return job ?? null;
}
