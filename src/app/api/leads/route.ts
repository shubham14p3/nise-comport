import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiError, clientIp } from "@/lib/http";
import { createLead } from "@/lib/leads";
import { requestEmailOtp } from "@/lib/auth";
import { enforceRate, identity, RATE_RULES } from "@/lib/rate-limit";
import { normalizePhone } from "@/lib/validation";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().max(120).optional(), phone: z.string().min(6).max(30), email: z.email().max(200).optional(), serviceSlug: z.string().max(80).optional(), consent: z.boolean().optional(), topic: z.string().max(120).optional(),
  message: z.string().max(800).optional(), page: z.string().max(300).optional(), locale: z.string().max(5).optional(),
  source: z.enum(["chat", "form", "wizard", "service-callback"]).optional(),
});

/** "Please call me": public, rate-limited per IP and per number. */
export async function POST(request: NextRequest) {
  try {
    const input = schema.parse(await request.json());
    if(input.source==="service-callback" && input.consent!==true)return NextResponse.json({error:"Confirm that we may contact you about this request."},{status:400});
    await enforceRate(RATE_RULES.leadsPerIpHour, identity("ip", clientIp(request)), "Too many requests.");
    const phone = normalizePhone(input.phone);
    if (phone) await enforceRate(RATE_RULES.leadsPerPhoneDay, identity("lead-phone", phone), "We already have your number and will call you.");
    const lead = await createLead(input);
    // Start signup by issuing the existing one-time email challenge.
    // A real account is only created when its email owner verifies that challenge.
    let accountEmailStatus: "sent" | "unavailable" | "not_requested" = "not_requested";
    if(input.source==="service-callback" && input.email){
      try {
        await requestEmailOtp(input.email,"signup",clientIp(request));
        accountEmailStatus="sent";
      } catch (reason) {
        console.error("[callbacks] account verification email unavailable",reason instanceof Error?reason.message:"unavailable");
        accountEmailStatus="unavailable";
      }
    }
    return NextResponse.json({ ok: true, id: lead.id, accountEmailStatus }, { status: 201 });
  } catch (error) { return apiError(error); }
}
