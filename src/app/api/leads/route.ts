import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiError, clientIp } from "@/lib/http";
import { createLead } from "@/lib/leads";
import { enforceRate, identity, RATE_RULES } from "@/lib/rate-limit";
import { normalizePhone } from "@/lib/validation";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().max(120).optional(), phone: z.string().min(6).max(30), topic: z.string().max(120).optional(),
  message: z.string().max(800).optional(), page: z.string().max(300).optional(), locale: z.string().max(5).optional(),
  source: z.enum(["chat", "form", "wizard"]).optional(),
});

/** "Please call me": public, rate-limited per IP and per number. */
export async function POST(request: NextRequest) {
  try {
    const input = schema.parse(await request.json());
    await enforceRate(RATE_RULES.leadsPerIpHour, identity("ip", clientIp(request)), "Too many requests.");
    const phone = normalizePhone(input.phone);
    if (phone) await enforceRate(RATE_RULES.leadsPerPhoneDay, identity("lead-phone", phone), "We already have your number and will call you.");
    const lead = await createLead(input);
    return NextResponse.json({ ok: true, id: lead.id }, { status: 201 });
  } catch (error) { return apiError(error); }
}
