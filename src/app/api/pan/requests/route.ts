import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { serviceRequests } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isUnavailable, PublicError } from "@/lib/errors";
import { apiError, readJson } from "@/lib/http";
import { panIntakeSchema, panServiceLabels } from "@/lib/pan-validation";
import { enforceRate, identity, RATE_RULES } from "@/lib/rate-limit";
import { isIdempotencyConflict, notifyNewRequest, recordEvent, withUniqueReference } from "@/lib/requests";
import { sendDbDownFallbackWhatsApp } from "@/lib/whatsapp-alerts";
import { storeDetailedIntake } from "@/lib/detailed-intake-server";
import { completeInvitedServiceCallback } from "@/lib/leads";

const envelope = z.object({ idempotencyKey: z.uuid().optional() }).passthrough();

export async function POST(request: NextRequest) {
  // Hoisted (not declared inside the try) so the catch below can still reach them for the
  // DB-down WhatsApp fallback — a const declared inside try {} isn't visible in its catch.
  let user: Awaited<ReturnType<typeof requireUser>> | undefined;
  let pan: Omit<z.infer<typeof panIntakeSchema>, "fileId"> | undefined;
  try {
    user = await requireUser();
    if (!user.emailVerifiedAt) throw new PublicError("Verify your email first.", 403, { code: "unverified" });
    const body = await readJson(request);
    const { idempotencyKey } = envelope.parse(body);
    const parsed = panIntakeSchema.safeParse(body);
    if (!parsed.success) {
      const fields: Record<string, string> = {};
      for (const issue of parsed.error.issues) { const key = String(issue.path[0] ?? "form"); if (!fields[key]) fields[key] = issue.message; }
      throw new PublicError(parsed.error.issues[0]?.message ?? "Please check the form.", 400, { code: "invalid_input", fields });
    }
    const { fileId, detailedIntake, ...panInput } = parsed.data;
    pan = panInput;
    const securedIntake = detailedIntake && (panInput.applicant==="individual" || ["pan49a","pan93"].includes(detailedIntake.kind)) ? storeDetailedIntake(detailedIntake) : null;
    if (fileId) throw new PublicError("Document attachments are arranged after review.", 400);
    // const copies so TS carries the "definitely assigned" narrowing into the closure below —
    // the hoisted `let`s above stay typed `T | undefined` inside a nested function either way.
    const currentUser = user;
    const currentPan = pan;

    if (idempotencyKey) {
      const [existing] = await db.select({ reference: serviceRequests.reference }).from(serviceRequests).where(and(eq(serviceRequests.userId, user.id), eq(serviceRequests.idempotencyKey, idempotencyKey))).limit(1);
      if (existing) return NextResponse.json({ reference: existing.reference, duplicate: true });
    }
    const userKey = identity("user", currentUser.id);
    await enforceRate(RATE_RULES.requestsPerUserHour, userKey, "You’ve sent several requests in the last hour. If it’s urgent, call or WhatsApp us.");
    await enforceRate(RATE_RULES.requestsPerUserDay, userKey, "You’ve reached today’s online request limit. Please call or WhatsApp us.");

    const label = panServiceLabels[currentPan.service];
    let created: { id: string; reference: string };
    try {
      created = await withUniqueReference("PAN", async (reference) => {
        const [row] = await db.insert(serviceRequests).values({
          reference, userId: currentUser.id, serviceSlug: "pan-card", serviceName: label,
          details: { kind: "pan", description: currentPan.notes || label, pan: currentPan, ...(securedIntake?{intake:securedIntake}:{}) }, serviceFee: "0.00", externalFee: "0.00", idempotencyKey: idempotencyKey ?? null,
        }).returning({ id: serviceRequests.id, reference: serviceRequests.reference });
        return row;
      });
    } catch (error) {
      if (idempotencyKey && isIdempotencyConflict(error)) {
        const [existing] = await db.select({ reference: serviceRequests.reference }).from(serviceRequests).where(and(eq(serviceRequests.userId, currentUser.id), eq(serviceRequests.idempotencyKey, idempotencyKey))).limit(1);
        if (existing) return NextResponse.json({ reference: existing.reference, duplicate: true });
      }
      throw error;
    }
    await recordEvent("service", created.id, currentUser.id, null, "submitted", "PAN assistance form");
    await notifyNewRequest(currentUser, created.reference, `PAN assistance – ${label}`, [
      `Applicant: ${currentPan.fullName}`, `Contact: ${currentPan.contactName} · ${currentPan.phone}`, `Email: ${currentPan.email}`,
      `Address: ${currentPan.address}`, `City: ${currentPan.city}`, `State / province: ${currentPan.state}`, `Country: ${currentPan.country}`, `PIN / postal code: ${currentPan.postalCode}`,
    ]);
    await completeInvitedServiceCallback(currentPan.phone,currentUser.email,"pan-card").catch(() => undefined);
    return NextResponse.json({ reference: created.reference }, { status: 201 });
  } catch (error) {
    if (isUnavailable(error) && user) {
      sendDbDownFallbackWhatsApp({
        name: user.name, phone: user.whatsapp ?? user.phone ?? null, email: user.email, service: "PAN assistance",
        details: pan ? `Applicant: ${pan.fullName} · Contact: ${pan.contactName} ${pan.phone} · ${pan.city}, ${pan.state}` : "(form details unavailable)",
      });
    }
    return apiError(error);
  }
}
