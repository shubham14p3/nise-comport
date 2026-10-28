import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { PublicError } from "@/lib/errors";
import { apiError, clientIp, readJson } from "@/lib/http";
import { openGuestRequest } from "@/lib/intake";
import { enforceRate, identity, RATE_RULES } from "@/lib/rate-limit";
import { resolveService } from "@/lib/site-content";
import { cleanName, looksLikeEmail, normalizeEmail, normalizePhone } from "@/lib/validation";

const schema = z.object({
  serviceSlug: z.string().min(2).max(80),
  description: z.string().trim().min(8, "Please describe what you need in a few words (at least 8 characters).").max(1500),
  name: z.string().trim().min(2, "Enter your name.").max(100),
  phone: z.string().trim().min(10, "Enter a valid 10-digit mobile number.").max(20),
  email: z.string().trim().min(5, "Enter a valid email address.").max(200),
  preferredContact: z.enum(["email", "phone", "whatsapp"]).default("whatsapp"),
  category: z.string().max(60).optional(),
  /** Both boxes must be ticked; the server refuses the request otherwise. */
  consentTerms: z.literal(true, { error: "Please accept the terms and privacy policy." }),
  consentContact: z.literal(true, { error: "Please agree to be contacted about this request." }),
});

/** A visitor's request, opened in the Query state. Signed-in customers use /api/requests instead. */
export async function POST(request: NextRequest) {
  try {
    const input = schema.parse(await readJson(request));
    const phone = normalizePhone(input.phone);
    const email = normalizeEmail(input.email);
    if (!phone) throw new PublicError("Enter a valid 10-digit mobile number.", 400, { fields: { phone: "Check the number." } });
    if (!looksLikeEmail(email)) throw new PublicError("Enter a valid email address.", 400, { fields: { email: "Enter a valid email address." } });
    const service = input.serviceSlug === "other" ? null : await resolveService(input.serviceSlug);
    if (input.serviceSlug !== "other" && !service) throw new PublicError("Choose one of the listed services.", 400, { fields: { serviceSlug: "Choose one of the listed services." } });

    await enforceRate(RATE_RULES.leadsPerIpHour, identity("ip", clientIp(request)), "Too many requests from this network. Please call or WhatsApp us.");

    const result = await openGuestRequest({
      serviceSlug: service?.slug ?? "other",
      serviceName: service?.title ?? "General enquiry",
      category: input.category ?? null,
      description: input.description,
      name: cleanName(input.name),
      phone,
      email,
      preferredContact: input.preferredContact,
      consentedAt: new Date(),
    });
    return NextResponse.json({ ok: true, reference: result.reference, accountCreated: result.accountCreated }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
