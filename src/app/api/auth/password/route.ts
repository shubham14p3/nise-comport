import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createDemoSession, DEMO_LOGIN, isDemoAuthEnabled, signInWithPassword } from "@/lib/auth";
import { apiError } from "@/lib/http";

const loginSchema = z.object({ email: z.email(), password: z.string().min(1).max(128) });
export async function POST(request: NextRequest) {
  try {
    const input = loginSchema.parse(await request.json());
    if (isDemoAuthEnabled() && input.email.trim().toLowerCase() === DEMO_LOGIN.email && input.password === DEMO_LOGIN.password) {
      return NextResponse.json({ ok: true, requiresOtp: false, user: await createDemoSession() });
    }
    const result = await signInWithPassword(input.email, input.password);
    return NextResponse.json({ ok: true, ...result });
  }
  catch (error) { return apiError(error); }
}
