import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyEmailOtp } from "@/lib/auth";
import { apiError, clientIp, readJson } from "@/lib/http";

const verifySchema = z.object({
  email: z.string().trim().min(3).max(254),
  code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code from the email."),
  purpose: z.enum(["signup", "signin"]),
  name: z.string().max(200).optional(),
  password: z.string().max(128, "Passwords are at most 128 characters.").optional(),
  phone: z.string().max(30).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = verifySchema.parse(await readJson(request));
    if (body.purpose === "signup" && (!body.name || !body.password)) return NextResponse.json({ error: "Name and password are required.", code: "invalid_input" }, { status: 400 });
    const user = await verifyEmailOtp(body.email, body.code, body.purpose, body.purpose === "signup" ? { name: body.name!, password: body.password!, phone: body.phone } : undefined, clientIp(request));
    return NextResponse.json({ ok: true, user });
  } catch (error) { return apiError(error); }
}
