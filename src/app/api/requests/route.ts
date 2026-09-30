import { NextRequest, NextResponse } from "next/server";
import { and, eq, inArray, isNull, ne } from "drizzle-orm";
import { z } from "zod";
import { addresses, serviceRequests, storedFiles } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PublicError } from "@/lib/errors";
import { apiError, readJson } from "@/lib/http";
import { enforceRate, identity, RATE_RULES } from "@/lib/rate-limit";
import { isIdempotencyConflict, notifyNewRequest, recordEvent, withUniqueReference } from "@/lib/requests";
import { findOffer, isOfferLive, offerAppliesTo } from "@/lib/offers";
import { findService, isServiceDetail, serviceCatalog, servicesInCategory } from "@/lib/services";
import { normalizePhone } from "@/lib/validation";

const schema = z.object({
  serviceSlug: z.string().min(2).max(80),
  description: z.string().trim().min(8, "Please describe what you need in a few words (at least 8 characters).").max(1500, "Keep the description under 1,500 characters."),
  preferredContact: z.enum(["email", "phone", "whatsapp"]).optional(),
  fileId: z.uuid().optional(),
  /** Step-flow extras (all optional so older clients keep working). */
  contactName: z.string().trim().min(2).max(100).optional(),
  contactPhone: z.string().trim().max(20).optional(),
  category: z.string().max(60).optional(),
  offerId: z.string().max(60).optional(),
  visit: z.object({
    mode: z.enum(["walkin", "callback", "doorstep", "online"]),
    day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    slot: z.enum(["morning", "afternoon", "evening"]).optional(),
    addressId: z.uuid().optional(),
    address: z.string().trim().min(8).max(400).optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
  }).optional(),
  /** Generated once per form; a double-click or a retry after a network error can't create a duplicate. */
  idempotencyKey: z.uuid().optional(),
});

const selectFields = { id: serviceRequests.id, reference: serviceRequests.reference, status: serviceRequests.status };

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const input = schema.parse(await readJson(request));
    // "other" = the customer isn't sure which service they need.
    const found = input.serviceSlug === "other" ? undefined : findService(input.serviceSlug);
    if (input.serviceSlug !== "other" && !found) throw new PublicError("Choose one of the listed services.", 400, { fields: { serviceSlug: "Choose one of the listed services." } });
    const service = found ?? { slug: "other", title: "General enquiry" };
    const categoryCandidate = input.category ?? found?.slug;
    const category: string | null = found && isServiceDetail(found) ? found.categorySlug
      : categoryCandidate && serviceCatalog.some((group) => group.slug === categoryCandidate) ? categoryCandidate : null;

    let contactPhone: string | null = null;
    if (input.contactPhone) {
      contactPhone = normalizePhone(input.contactPhone);
      if (!contactPhone) throw new PublicError("Enter a valid 10-digit mobile number.", 400, { fields: { contactPhone: "Enter a valid 10-digit mobile number." } });
    }
    let visit: Record<string, unknown> | undefined;
    if (input.visit) {
      const { mode, day, slot, addressId, address, latitude, longitude } = input.visit;
      visit = { mode };
      if (mode === "walkin") {
        if (!day) throw new PublicError("Pick a preferred day.", 400, { fields: { day: "Pick a preferred day." } });
        visit.day = day; if (slot) visit.slot = slot;
      }
      if (mode === "doorstep") {
        if (addressId) {
          const [saved] = await db.select().from(addresses).where(and(eq(addresses.id, addressId), eq(addresses.userId, user.id))).limit(1);
          if (!saved) throw new PublicError("That saved address was not found.", 400, { fields: { addressId: "Choose the address again." } });
          visit.address = [saved.line1, saved.line2, saved.city, saved.state, saved.postalCode].filter(Boolean).join(", ");
          visit.addressId = saved.id;
        } else if (address) {
          visit.address = address;
          if (latitude !== undefined && longitude !== undefined) { visit.latitude = latitude; visit.longitude = longitude; }
        } else throw new PublicError("Add the address for doorstep help.", 400, { fields: { address: "Add the address for doorstep help." } });
      }
    }

    if (input.idempotencyKey) {
      const [existing] = await db.select(selectFields).from(serviceRequests).where(and(eq(serviceRequests.userId, user.id), eq(serviceRequests.idempotencyKey, input.idempotencyKey))).limit(1);
      if (existing) return NextResponse.json({ ok: true, request: existing, duplicate: true });
    }
    const userKey = identity("user", user.id);
    await enforceRate(RATE_RULES.requestsPerUserHour, userKey, "You’ve sent several requests in the last hour. If it’s urgent, call or WhatsApp us.");
    await enforceRate(RATE_RULES.requestsPerUserDay, userKey, "You’ve reached today’s online request limit. Please call or WhatsApp us.");

    const offer = await checkOffer(input.offerId, category, user.id);

    if (input.fileId) {
      const [file] = await db.select({ id: storedFiles.id, requestId: storedFiles.requestId }).from(storedFiles).where(and(eq(storedFiles.id, input.fileId), eq(storedFiles.userId, user.id))).limit(1);
      if (!file || file.requestId) throw new PublicError("The attached file is no longer available. Please attach it again.", 400, { fields: { fileId: "Attach the file again." } });
    }

    let created: { id: string; reference: string; status: string };
    try {
      created = await withUniqueReference("NC", async (reference) => {
        const [row] = await db.insert(serviceRequests).values({
          reference, userId: user.id, serviceSlug: service.slug, serviceName: service.title,
          details: {
            description: input.description,
            ...(input.preferredContact ? { preferredContact: input.preferredContact } : {}),
            ...(input.contactName ? { contactName: input.contactName } : {}),
            ...(contactPhone ? { contactPhone } : {}),
            ...(category ? { category } : {}),
            ...(visit ? { visit } : {}),
            ...(offer.applied ? { offer: { id: offer.id, title: offer.title } } : {}),
          },
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
    await notifyNewRequest(user, created.reference, service.title, [
      `Note: ${input.description.slice(0, 300)}`,
      ...(contactPhone ? [`Phone: ${contactPhone}${input.preferredContact ? ` (prefers ${input.preferredContact})` : ""}`] : []),
      ...(visit ? [`Visit: ${[visit.mode, visit.day, visit.slot, visit.address].filter(Boolean).join(" · ")}`] : []),
      ...(offer.applied ? [`Offer claimed: ${offer.title}`] : []),
    ]);
    return NextResponse.json({ ok: true, request: created, ...(input.offerId ? { offer: { applied: offer.applied, ...(offer.reason ? { reason: offer.reason } : {}) } } : {}) }, { status: 201 });
  } catch (error) { return apiError(error); }
}

type OfferCheck = { applied: boolean; id?: string; title?: string; reason?: string };

/**
 * Validates an offer claimed in the step flow. The request is always created; an ineligible offer
 * is simply not attached, and the customer is told why.
 */
async function checkOffer(offerId: string | undefined, category: string | null, userId: string): Promise<OfferCheck> {
  if (!offerId) return { applied: false };
  const offer = findOffer(offerId);
  if (!offer || !isOfferLive(offer)) return { applied: false, reason: "This offer has ended." };
  if (category && !offerAppliesTo(offer, category)) return { applied: false, reason: "This offer doesn’t apply to the chosen service." };
  if (offer.firstTimeOnly) {
    const slugs = offer.categories === "all" ? [] : offer.categories.flatMap((slug) => [slug, ...servicesInCategory(slug).map((service) => service.slug)]);
    const earlier = await db.select({ id: serviceRequests.id }).from(serviceRequests)
      .where(and(eq(serviceRequests.userId, userId), ne(serviceRequests.status, "cancelled"), ...(slugs.length ? [inArray(serviceRequests.serviceSlug, slugs)] : [])))
      .limit(1);
    if (earlier.length) return { applied: false, reason: "It’s only for your first request of this kind." };
  }
  return { applied: true, id: offer.id, title: `${offer.highlight.en} · ${offer.title.en}` };
}
