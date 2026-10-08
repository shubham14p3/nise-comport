import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requestEmailOtp } from "@/lib/auth";
import { apiError, clientIp, readJson } from "@/lib/http";

const requestSchema = z.object({
  email: z.string().min(3, "Enter your email address.").max(254),
  purpose: z.enum(["signup", "signin"]),
  /** Honeypot: real people never see or fill this field. */
  website: z.string().max(200).optional(),
});

/**
 * Sends a sign-up or sign-in code. The reply is the same whether or not the email is
 * registered, so this endpoint can't be used to find out who has an account.
 */
export async function POST(request: NextRequest) {
  try {
    const body = requestSchema.parse(await readJson(request));
    if (!body.website) await requestEmailOtp(body.email, body.purpose, clientIp(request));
    return NextResponse.json({
      ok: true,
      message: body.purpose === "signup"
        ? "If this email can be used for a new account, we’ve sent a 6-digit code. Already registered? We’ve emailed you sign-in instructions instead."
        : "If an account exists for this email, we’ve sent a 6-digit sign-in code.",
      resendAfter: 60,
    });
  } catch (error) { return apiError(error); }
}
