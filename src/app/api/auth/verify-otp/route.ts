import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyEmailOtp } from "@/lib/auth";
import { apiError } from "@/lib/http";

const verifySchema = z.object({ email: z.email(), code: z.string().regex(/^\d{6}$/), purpose: z.enum(["signup", "signin"]), name: z.string().min(2).max(100).optional(), password: z.string().min(10).max(128).optional(), phone: z.string().max(30).optional() });
export async function POST(request: NextRequest) {
  try {
    const body = verifySchema.parse(await request.json());
    if (body.purpose === "signup" && (!body.name || !body.password)) return NextResponse.json({ error: "Name and password are required." }, { status: 400 });
    const user = await verifyEmailOtp(body.email, body.code, body.purpose, body.purpose === "signup" ? { name: body.name!, password: body.password!, phone: body.phone } : undefined);
    return NextResponse.json({ ok: true, user });
  } catch (error) { return apiError(error); }
}
