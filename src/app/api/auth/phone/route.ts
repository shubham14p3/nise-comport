import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiError, clientIp, readJson } from "@/lib/http";
import { requestSignInSms, signInWithSms } from "@/lib/phone-auth";

const schema = z.object({ action: z.enum(["send", "verify"]), phone: z.string().trim().min(8).max(30), code: z.string().max(10).optional(), website: z.string().max(200).optional() });

/** Sign in with a mobile number and an SMS code. Registered and unregistered numbers get the same reply. */
export async function POST(request: NextRequest) {
  try {
    const body = schema.parse(await readJson(request));
    const ip = clientIp(request);
    if (body.action === "send") {
      if (!body.website) await requestSignInSms(body.phone, ip);
      return NextResponse.json({ ok: true, message: "If this mobile number is verified on an account, we’ve sent a 6-digit code by SMS.", resendAfter: 60 });
    }
    return NextResponse.json({ ok: true, ...(await signInWithSms(body.phone, body.code ?? "", ip)) });
  } catch (error) { return apiError(error); }
}
