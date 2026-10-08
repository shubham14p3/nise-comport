import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyEmailOtp } from "@/lib/auth";
import { apiError, clientIp, readJson } from "@/lib/http";
import { issueWelcomeCoupon } from "@/lib/promotions";

const verifySchema = z.object({
  email: z.string().trim().min(3).max(254),
  code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code from the email."),
  purpose: z.enum(["signup", "signin"]),
  firstName: z.string().max(200).optional(),
  lastName: z.string().max(200).optional(),
  password: z.string().max(128, "Passwords are at most 128 characters.").optional(),
  phone: z.string().max(30).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = verifySchema.parse(await readJson(request));
    if (body.purpose === "signup" && !body.password) return NextResponse.json({ error: "Password is required.", code: "invalid_input" }, { status: 400 });
    const user = await verifyEmailOtp(body.email, body.code, body.purpose, body.purpose === "signup" ? { firstName: body.firstName ?? "", lastName: body.lastName ?? "", password: body.password!, phone: body.phone } : undefined, clientIp(request));
    // Every verified customer account gets one ₹50 welcome coupon (idempotent; never blocks sign-in).
    const welcome = await issueWelcomeCoupon(user.id);
    return NextResponse.json({
      ok: true, user,
      ...(welcome?.created ? { welcomeCoupon: { code: welcome.coupon.code, amount: Number(welcome.coupon.discountValue), minimum: Number(welcome.coupon.minimumAmount), expiresAt: welcome.coupon.expiresAt?.toISOString() ?? null } } : {}),
    });
  } catch (error) { return apiError(error); }
}
