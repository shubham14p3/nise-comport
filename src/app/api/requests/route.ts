import { captureCustomer } from "@/lib/customer-capture";
import { NextRequest, NextResponse } from "next/server";
import { and, eq, inArray, isNull, ne } from "drizzle-orm";
import { z } from "zod";
import { addresses, serviceRequests, storedFiles } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { jobCodeForSource } from "@/lib/jobs";
import { db } from "@/lib/db";
import { isUnavailable, PublicError } from "@/lib/errors";
import { apiError, readJson } from "@/lib/http";
import { enforceRate, identity, RATE_RULES } from "@/lib/rate-limit";
import { isIdempotencyConflict, notifyNewRequest, recordEvent, withUniqueReference } from "@/lib/requests";
import { findOffer, isOfferLive, offerAppliesTo } from "@/lib/offers";
import { recordRedemption, resolveCoupon } from "@/lib/promotions";
import { resolveService } from "@/lib/site-content";
import type { ScopeContext } from "@/lib/promo-scope";
import { isServiceDetail, serviceCatalog, servicesInCategory } from "@/lib/services";
import { looksLikeEmail, normalizePhone } from "@/lib/validation";
import { detailedIntakeSchema } from "@/lib/detailed-intake";
import { storeDetailedIntake } from "@/lib/detailed-intake-server";
import { closeWizardLeads, completeInvitedServiceCallback } from "@/lib/leads";
import { createPaymentRequest } from "@/lib/payments";
import { isPanService, PAN_FIXED_RUPEES } from "@/lib/review-workflow";
import { sendDbDownFallbackWhatsApp, sendRequestWhatsApp, whatsappAlertsEnabled } from "@/lib/whatsapp-alerts";

const schema = z.object({
  serviceSlug: z.string().min(2).max(80),
  description: z.string().trim().max(1500, "Keep the description under 1,500 characters.").default(""),
  preferredContact: z.enum(["email", "phone", "whatsapp"]).optional(),
  fileId: z.uuid().optional(),
  intake: detailedIntakeSchema.optional(),
  /** Step-flow extras (all optional so older clients keep working). */
  contactName: z.string().trim().min(2).max(100).optional(),
  contactPhone: z.string().trim().max(20).optional(),
  contactEmail: z.string().trim().max(120).optional(),
  category: z.string().max(60).optional(),
  offerId: z.string().max(60).optional(),
  /** Festival / sports / welcome code; staff take it off the service charge when they bill. */
  couponCode: z.string().trim().max(40).optional(),
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
  // Hoisted (not declared inside the try) so the catch below can still reach them for the
  // DB-down WhatsApp fallback — a const declared inside try {} isn't visible in its catch.
  let user: Awaited<ReturnType<typeof requireUser>> | undefined;
  let service: { slug: string; title: string } | undefined;
  let input: z.infer<typeof schema> | undefined;
  try {
    user = await requireUser();
    input = schema.parse(await readJson(request));
    // "other" = the customer isn't sure which service they need.
    const found = input.serviceSlug === "other" ? undefined : (await resolveService(input.serviceSlug)) ?? undefined;
    if (input.serviceSlug !== "other" && !found) throw new PublicError("Choose one of the listed services.", 400, { fields: { serviceSlug: "Choose one of the listed services." } });
    service = found ?? { slug: "other", title: "General enquiry" };
    if(input.intake) {
      if(input.serviceSlug==="voter-id" && input.intake.kind!=="voter")throw new PublicError("Voter requests need the Voter ID form.",400);
      if(input.serviceSlug==="passport-driving-licence" && input.intake.kind!=="passport")throw new PublicError("Passport requests need the passport form.",400);
      if(!["voter-id","passport-driving-licence"].includes(input.serviceSlug))throw new PublicError("This service does not use that questionnaire.",400);
    }
    const storedIntake = input.intake ? storeDetailedIntake(input.intake) : null;
    // const copies so TS carries the "definitely assigned" narrowing into the closure below —
    // the hoisted `let`s above stay typed `T | undefined` inside a nested function either way.
    const currentUser = user;
    const currentService = service;
    const currentInput = input;
    const categoryCandidate = input.category ?? found?.slug;
    const category: string | null = found && isServiceDetail(found) ? found.categorySlug
      : categoryCandidate && serviceCatalog.some((group) => group.slug === categoryCandidate) ? categoryCandidate : null;

    let contactEmail: string | null = null;
    if (input.contactEmail) {
      const email = input.contactEmail.toLowerCase();
      if (!looksLikeEmail(email)) throw new PublicError("Enter a valid email address.", 400, { fields: { contactEmail: "Enter a valid email address." } });
      contactEmail = email;
    }
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
      if (existing) return NextResponse.json({ ok: true, request: existing, jobId: await jobCodeForSource("service", existing.id), duplicate: true });
    }
    const userKey = identity("user", user.id);
    await enforceRate(RATE_RULES.requestsPerUserHour, userKey, "You’ve sent several requests in the last hour. If it’s urgent, call or WhatsApp us.");
    await enforceRate(RATE_RULES.requestsPerUserDay, userKey, "You’ve reached today’s online request limit. Please call or WhatsApp us.");

    const offer = await checkOffer(input.offerId, category, user.id);
    const coupon = await checkCoupon(input.couponCode, user.id, found ? { service: found.slug, category } : { service: "other" });

    if(input.intake?.photoFileId) {
      const [photo] = await db.select({ id: storedFiles.id, requestId: storedFiles.requestId }).from(storedFiles)
        .where(and(eq(storedFiles.id,input.intake.photoFileId),eq(storedFiles.userId,user.id))).limit(1);
      if(!photo||photo.requestId)throw new PublicError("Photograph is unavailable. Upload it again.",400,{fields:{photoFileId:"Upload the photo again."}});
    }
    if (input.fileId) {
      const [file] = await db.select({ id: storedFiles.id, requestId: storedFiles.requestId }).from(storedFiles).where(and(eq(storedFiles.id, input.fileId), eq(storedFiles.userId, user.id))).limit(1);
      if (!file || file.requestId) throw new PublicError("The attached file is no longer available. Please attach it again.", 400, { fields: { fileId: "Attach the file again." } });
    }

    let created: { id: string; reference: string; status: string };
    try {
      created = await withUniqueReference("NC", async (reference) => {
        const [row] = await db.insert(serviceRequests).values({
          reference, userId: currentUser.id, serviceSlug: currentService.slug, serviceName: currentService.title,
          details: {
            description: currentInput.description,
            ...(storedIntake ? { intake: storedIntake } : {}),
            ...(currentInput.preferredContact ? { preferredContact: currentInput.preferredContact } : {}),
            ...(currentInput.contactName ? { contactName: currentInput.contactName } : {}),
            ...(contactPhone ? { contactPhone } : {}),
            ...(contactEmail ? { contactEmail } : {}),
            ...(category ? { category } : {}),
            ...(visit ? { visit } : {}),
            ...(offer.applied ? { offer: { id: offer.id, title: offer.title } } : {}),
            ...(coupon.applied ? { coupon: { code: coupon.code, value: coupon.value, minimum: coupon.minimum, title: coupon.title } } : {}),
          },
          serviceFee: "0.00", externalFee: "0.00", idempotencyKey: currentInput.idempotencyKey ?? null,
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

    if(input.intake?.photoFileId) {
      await db.update(storedFiles).set({requestId:created.id}).where(and(eq(storedFiles.id,input.intake.photoFileId),eq(storedFiles.userId,user.id),isNull(storedFiles.requestId)));
    }
    if (input.fileId) {
      await db.update(storedFiles).set({ requestId: created.id }).where(and(eq(storedFiles.id, input.fileId), eq(storedFiles.userId, user.id), isNull(storedFiles.requestId)));
    }
    if (coupon.applied) await recordRedemption(coupon.id, user.id, "service", created.id, coupon.value);
    await recordEvent("service", created.id, user.id, null, "submitted", "Created online");
    if (isPanService(currentService.slug)) {
      // One fixed charge for every PAN service, issued now so the customer can pay before staff review.
      await createPaymentRequest({ reference: created.reference, amountPaise: PAN_FIXED_RUPEES * 100, serviceFeePaise: PAN_FIXED_RUPEES * 100, externalFeePaise: 0, note: "PAN charge: official fees, service, printout, courier and photo" }, { id: user.id })
        .catch((error) => console.error("[pan] could not issue the fixed payment", error));
    }
    await notifyNewRequest(user, created.reference, service.title, [
      ...(input.description ? [`Note: ${input.description.slice(0, 300)}`] : []),
      ...(input.intake ? [`Application form: ${input.intake.kind}`, "Questionnaire saved securely — open the request in staff dashboard to view"] : []),
      ...(contactPhone ? [`Phone: ${contactPhone}${input.preferredContact ? ` (prefers ${input.preferredContact})` : ""}`] : []),
      ...(contactEmail ? [`Email: ${contactEmail}`] : []),
      ...(visit ? [`Visit: ${[visit.mode, visit.day, visit.slot, visit.address].filter(Boolean).join(" · ")}`] : []),
      ...(offer.applied ? [`Offer claimed: ${offer.title}`] : []),
      ...(coupon.applied ? [`Coupon: ${coupon.code} (₹${coupon.value} off the service charge if it is ₹${coupon.minimum} or more)`] : []),
    ], found && "categorySlug" in found ? String(found.categorySlug) : undefined);
    const replyTo = contactPhone ?? user.whatsapp ?? user.phone ?? null;
    await captureCustomer({ name: input.contactName ?? user.name, phone: replyTo, email: user.email, serviceSlug: currentService.slug, source: "request" });
    sendRequestWhatsApp({ name: input.contactName ?? user.name, phone: replyTo, reference: created.reference, service: service.title, details: input.description });
    // They finished the form: the "started a request" call-back is no longer needed.
    if (replyTo) {
      await closeWizardLeads(replyTo).catch(() => undefined);
      await completeInvitedServiceCallback(replyTo,user.email,service.slug).catch(() => undefined);
    }
    const jobId = await jobCodeForSource("service", created.id);
    return NextResponse.json({
      ok: true, request: created, jobId, whatsappSent: whatsappAlertsEnabled(),
      ...(input.offerId ? { offer: { applied: offer.applied, ...(offer.reason ? { reason: offer.reason } : {}) } } : {}),
      ...(input.couponCode ? { coupon: { applied: coupon.applied, ...(coupon.applied ? { code: coupon.code } : { reason: coupon.reason }) } } : {}),
    }, { status: 201 });
  } catch (error) {
    if (isUnavailable(error) && user) {
      sendDbDownFallbackWhatsApp({
        name: user.name, phone: user.whatsapp ?? user.phone ?? null, email: user.email, service: service?.title ?? "General enquiry",
        details: input ? `Note: ${input.description.slice(0, 300)}` : "(form details unavailable)",
      });
    }
    return apiError(error);
  }
}

type CouponCheck = { applied: true; id: string; code: string; value: number; minimum: number; title: string } | { applied: false; reason?: string };

/** Like offers, a code that can't be used doesn't stop the request; the customer is told why. */
async function checkCoupon(code: string | undefined, userId: string, context?: ScopeContext): Promise<CouponCheck> {
  if (!code) return { applied: false };
  try {
    const { coupon, view } = await resolveCoupon({ code, userId, context });
    return { applied: true, id: coupon.id, code: coupon.code, value: view.discount, minimum: view.minimum, title: `${view.emoji} ${view.names.en}` };
  } catch (error) {
    if (error instanceof PublicError) return { applied: false, reason: error.message };
    throw error;
  }
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
