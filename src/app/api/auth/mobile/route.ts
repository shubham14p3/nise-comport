import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiError, clientIp, readJson } from "@/lib/http";
import { PublicError } from "@/lib/errors";
import { mobileSignIn, mobileSignUp } from "@/lib/mobile-auth";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("signin"), phone: z.string().max(254), pin: z.string().max(12), website: z.string().max(100).optional() }),
  z.object({ action: z.literal("signup"), phone: z.string().max(30), name: z.string().max(200), password: z.string().max(128).optional(), whatsappConsent: z.boolean().optional(), emailConsent: z.boolean().optional(), website: z.string().max(100).optional() }),
]);

/** PIN sign-in (unique email or unambiguous mobile number) and sign-up (number + name → a PIN is made and shown once). */
export async function POST(request: NextRequest) {
  try {
    const body = schema.parse(await readJson(request));
    if (body.website) throw new PublicError("Something went wrong. Please try again.", 400);
    const ip = clientIp(request);
    if (body.action === "signin") return NextResponse.json({ ok: true, ...(await mobileSignIn(body.phone, body.pin, ip)) }, { headers: { "cache-control": "no-store" } });
    return NextResponse.json({ ok: true, ...(await mobileSignUp(body, ip)) }, { headers: { "cache-control": "no-store" } });
  } catch (error) { return apiError(error); }
}
