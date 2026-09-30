import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resetPasswordWithCode } from "@/lib/auth";
import { apiError, clientIp, readJson } from "@/lib/http";

const schema = z.object({
  email: z.string().trim().min(3).max(254),
  code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code from the email."),
  password: z.string().min(1, "Choose a new password.").max(128, "Passwords are at most 128 characters."),
});

/** Step 2 of "Forgot password": code + new password. Signs out every device, then signs this one in. */
export async function POST(request: NextRequest) {
  try {
    const body = schema.parse(await readJson(request));
    const user = await resetPasswordWithCode(body.email, body.code, body.password, clientIp(request));
    return NextResponse.json({ ok: true, user });
  } catch (error) { return apiError(error); }
}
