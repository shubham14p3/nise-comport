import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requestEmailOtp } from "@/lib/auth";
import { apiError } from "@/lib/http";

const requestSchema = z.object({ email: z.email(), purpose: z.enum(["signup", "signin"]) });
export async function POST(request: NextRequest) {
  try { const body = requestSchema.parse(await request.json()); await requestEmailOtp(body.email, body.purpose); return NextResponse.json({ ok: true, message: "Verification code sent." }); }
  catch (error) { return apiError(error); }
}
