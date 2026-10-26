import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiError, clientIp } from "@/lib/http";
import { createLead } from "@/lib/leads";
import { enforceRate, identity, RATE_RULES } from "@/lib/rate-limit";
import { normalizePhone } from "@/lib/validation";
import { resolveService } from "@/lib/site-content";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().max(120).optional(), phone: z.string().min(6).max(30), topic: z.string().max(120).optional(),
  message: z.string().max(800).optional(), page: z.string().max(300).optional(), locale: z.string().max(5).optional(),
  source: z.enum(["chat", "form", "wizard"]).optional(),
  intent: z.literal("callback").optional(),
  email: z.email().max(254).optional(),
  serviceSlug: z.string().min(2).max(80).optional(),
  consent: z.boolean().optional(),
});

/** "Please call me": public, rate-limited per IP and per number. */
export async function POST(request: NextRequest) {
  try {
    const input = schema.parse(await request.json());
    if (input.intent === "callback" && (!input.name || input.name.trim().length < 2 || !input.email || !input.serviceSlug || !input.consent)) {
      return NextResponse.json({error:"Enter your name, mobile, email, choose a service and agree to be contacted."},{status:400});
    }
    await enforceRate(RATE_RULES.leadsPerIpHour, identity("ip", clientIp(request)), "Too many requests.");
    const phone = normalizePhone(input.phone);
    if (phone) await enforceRate(RATE_RULES.leadsPerPhoneDay, identity("lead-phone", phone), "We already have your number and will call you.");
    const found = input.intent === "callback" && input.serviceSlug !== "other"
      ? await resolveService(input.serviceSlug || "") : null;
    if (input.intent === "callback" && input.serviceSlug !== "other" && !found) {
      return NextResponse.json({error:"This service is unavailable. Choose an available service."},{status:400});
    }
    const lead = await createLead(input.intent === "callback" ? {
      name: input.name, phone: input.phone,
      topic: found?.title ?? "General service enquiry",
      message: input.message, page: input.page, locale: input.locale, source: "form",
      details: { kind:"service_callback",email:input.email!.trim().toLowerCase(),serviceSlug:input.serviceSlug },
    } : input);
    return NextResponse.json({ ok: true, id: lead.id }, { status: 201 });
  } catch (error) { return apiError(error); }
}
