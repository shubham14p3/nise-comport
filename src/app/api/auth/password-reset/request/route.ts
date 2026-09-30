import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requestPasswordReset } from "@/lib/auth";
import { apiError, clientIp, readJson } from "@/lib/http";

const schema = z.object({ email: z.string().trim().min(3, "Enter your email address.").max(254), website: z.string().max(200).optional() });

/** Step 1 of "Forgot password": always answers the same way so accounts can't be discovered. */
export async function POST(request: NextRequest) {
  try {
    const body = schema.parse(await readJson(request));
    if (!body.website) await requestPasswordReset(body.email, clientIp(request));
    return NextResponse.json({ ok: true, message: "If an account exists for this email, we’ve sent a 6-digit reset code. It expires in 10 minutes.", resendAfter: 60 });
  } catch (error) { return apiError(error); }
}
