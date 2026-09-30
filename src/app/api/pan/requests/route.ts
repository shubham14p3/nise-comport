import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { serviceRequests } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PublicError } from "@/lib/errors";
import { apiError, readJson } from "@/lib/http";
import { panIntakeSchema, panServiceLabels } from "@/lib/pan-validation";
import { enforceRate, identity, RATE_RULES } from "@/lib/rate-limit";
import { isIdempotencyConflict, notifyNewRequest, recordEvent, withUniqueReference } from "@/lib/requests";

const envelope = z.object({ idempotencyKey: z.uuid().optional() }).passthrough();

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    if (!user.emailVerifiedAt) throw new PublicError("Verify your email first.", 403, { code: "unverified" });
    const body = await readJson(request);
    const { idempotencyKey } = envelope.parse(body);
    const parsed = panIntakeSchema.safeParse(body);
    if (!parsed.success) {
      const fields: Record<string, string> = {};
      for (const issue of parsed.error.issues) { const key = String(issue.path[0] ?? "form"); if (!fields[key]) fields[key] = issue.message; }
      throw new PublicError(parsed.error.issues[0]?.message ?? "Please check the form.", 400, { code: "invalid_input", fields });
    }
    const { fileId, ...pan } = parsed.data;
    if (fileId) throw new PublicError("Document attachments are arranged after review.", 400);

    if (idempotencyKey) {
      const [existing] = await db.select({ reference: serviceRequests.reference }).from(serviceRequests).where(and(eq(serviceRequests.userId, user.id), eq(serviceRequests.idempotencyKey, idempotencyKey))).limit(1);
      if (existing) return NextResponse.json({ reference: existing.reference, duplicate: true });
    }
    const userKey = identity("user", user.id);
    await enforceRate(RATE_RULES.requestsPerUserHour, userKey, "You’ve sent several requests in the last hour. If it’s urgent, call or WhatsApp us.");
    await enforceRate(RATE_RULES.requestsPerUserDay, userKey, "You’ve reached today’s online request limit. Please call or WhatsApp us.");

    const label = panServiceLabels[pan.service];
    let created: { id: string; reference: string };
    try {
      created = await withUniqueReference("PAN", async (reference) => {
        const [row] = await db.insert(serviceRequests).values({
          reference, userId: user.id, serviceSlug: "pan-card-jamshedpur", serviceName: label,
          details: { kind: "pan", description: pan.notes || label, pan }, serviceFee: "0.00", externalFee: "0.00", idempotencyKey: idempotencyKey ?? null,
        }).returning({ id: serviceRequests.id, reference: serviceRequests.reference });
        return row;
      });
    } catch (error) {
      if (idempotencyKey && isIdempotencyConflict(error)) {
        const [existing] = await db.select({ reference: serviceRequests.reference }).from(serviceRequests).where(and(eq(serviceRequests.userId, user.id), eq(serviceRequests.idempotencyKey, idempotencyKey))).limit(1);
        if (existing) return NextResponse.json({ reference: existing.reference, duplicate: true });
      }
      throw error;
    }
    await recordEvent("service", created.id, user.id, null, "submitted", "PAN assistance form");
    await notifyNewRequest(user, created.reference, `PAN assistance – ${label}`, [`Applicant: ${pan.fullName}`, `Contact: ${pan.contactName} · ${pan.phone}`]);
    return NextResponse.json({ reference: created.reference }, { status: 201 });
  } catch (error) { return apiError(error); }
}
