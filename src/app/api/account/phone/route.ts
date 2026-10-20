import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { apiError, clientIp, readJson } from "@/lib/http";
import { confirmPhoneVerification, requestPhoneVerification } from "@/lib/phone-auth";

const schema = z.object({ action: z.enum(["send", "verify"]), phone: z.string().trim().min(8).max(30), code: z.string().max(10).optional(), channel: z.enum(["sms", "whatsapp"]).optional() });

/** A signed-in customer verifies their mobile number with an SMS code. */
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = schema.parse(await readJson(request));
    if (body.action === "send") { await requestPhoneVerification(user.id, body.phone, clientIp(request), body.channel); return NextResponse.json({ ok: true, resendAfter: 60 }); }
    return NextResponse.json({ ok: true, ...(await confirmPhoneVerification(user.id, body.phone, body.code ?? "", clientIp(request))) });
  } catch (error) { return apiError(error); }
}
