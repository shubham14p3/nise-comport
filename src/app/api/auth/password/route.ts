import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createDemoSession, DEMO_LOGIN, isDemoAuthEnabled, signInWithPassword } from "@/lib/auth";
import { apiError, clientIp, readJson } from "@/lib/http";

const loginSchema = z.object({
  email: z.string().trim().min(3, "Enter your email or mobile number.").max(254),
  password: z.string().min(1, "Enter your password.").max(128, "Passwords are at most 128 characters."),
});

/** Password sign-in. Unverified emails get a code instead (response: requiresOtp). */
export async function POST(request: NextRequest) {
  try {
    const input = loginSchema.parse(await readJson(request));
    if (isDemoAuthEnabled() && input.email.trim().toLowerCase() === DEMO_LOGIN.email && input.password === DEMO_LOGIN.password) {
      return NextResponse.json({ ok: true, requiresOtp: false, user: await createDemoSession() });
    }
    const result = await signInWithPassword(input.email, input.password, clientIp(request));
    return NextResponse.json({ ok: true, ...result });
  } catch (error) { return apiError(error); }
}
