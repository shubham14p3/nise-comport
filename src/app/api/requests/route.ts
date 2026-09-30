import { NextRequest, NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { serviceRequests, storedFiles } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PublicError } from "@/lib/errors";
import { apiError, readJson } from "@/lib/http";
import { enforceRate, identity, RATE_RULES } from "@/lib/rate-limit";
import { isIdempotencyConflict, notifyNewRequest, recordEvent, withUniqueReference } from "@/lib/requests";
import { findService } from "@/lib/services";

const schema = z.object({
  serviceSlug: z.string().min(2).max(80),
  description: z.string().trim().min(8, "Please describe what you need in a few words (at least 8 characters).").max(1500, "Keep the description under 1,500 characters."),
  preferredContact: z.enum(["email", "phone", "whatsapp"]).optional(),
  fileId: z.uuid().optional(),
  /** Generated once per form; a double-click or a retry after a network error can't create a duplicate. */
  idempotencyKey: z.uuid().optional(),
});

const selectFields = { id: serviceRequests.id, reference: serviceRequests.reference, status: serviceRequests.status };

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const input = schema.parse(await readJson(request));
    const service = findService(input.serviceSlug);
    if (!service) throw new PublicError("Choose one of the listed services.", 400, { fields: { serviceSlug: "Choose one of the listed services." } });

    if (input.idempotencyKey) {
      const [existing] = await db.select(selectFields).from(serviceRequests).where(and(eq(serviceRequests.userId, user.id), eq(serviceRequests.idempotencyKey, input.idempotencyKey))).limit(1);
      if (existing) return NextResponse.json({ ok: true, request: existing, duplicate: true });
    }
    const userKey = identity("user", user.id);
    await enforceRate(RATE_RULES.requestsPerUserHour, userKey, "You’ve sent several requests in the last hour. If it’s urgent, call or WhatsApp us.");
    await enforceRate(RATE_RULES.requestsPerUserDay, userKey, "You’ve reached today’s online request limit. Please call or WhatsApp us.");

    if (input.fileId) {
      const [file] = await db.select({ id: storedFiles.id, requestId: storedFiles.requestId }).from(storedFiles).where(and(eq(storedFiles.id, input.fileId), eq(storedFiles.userId, user.id))).limit(1);
      if (!file || file.requestId) throw new PublicError("The attached file is no longer available. Please attach it again.", 400, { fields: { fileId: "Attach the file again." } });
    }

    let created: { id: string; reference: string; status: string };
    try {
      created = await withUniqueReference("NC", async (reference) => {
        const [row] = await db.insert(serviceRequests).values({
          reference, userId: user.id, serviceSlug: service.slug, serviceName: service.title,
          details: { description: input.description, ...(input.preferredContact ? { preferredContact: input.preferredContact } : {}) },
          serviceFee: "0.00", externalFee: "0.00", idempotencyKey: input.idempotencyKey ?? null,
        }).returning(selectFields);
        return row;
      });
    } catch (error) {
      if (input.idempotencyKey && isIdempotencyConflict(error)) {
        const [existing] = await db.select(selectFields).from(serviceRequests).where(and(eq(serviceRequests.userId, user.id), eq(serviceRequests.idempotencyKey, input.idempotencyKey))).limit(1);
        if (existing) return NextResponse.json({ ok: true, request: existing, duplicate: true });
      }
      throw error;
    }

    if (input.fileId) {
      await db.update(storedFiles).set({ requestId: created.id }).where(and(eq(storedFiles.id, input.fileId), eq(storedFiles.userId, user.id), isNull(storedFiles.requestId)));
    }
    await recordEvent("service", created.id, user.id, null, "submitted", "Created online");
    await notifyNewRequest(user, created.reference, service.title, [`Note: ${input.description.slice(0, 300)}`]);
    return NextResponse.json({ ok: true, request: created }, { status: 201 });
  } catch (error) { return apiError(error); }
}
