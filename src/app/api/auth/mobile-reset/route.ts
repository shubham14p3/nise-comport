import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiError, clientIp, readJson } from "@/lib/http";
import { confirmMobileCredentialReset, requestMobileCredentialReset } from "@/lib/phone-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("send"), phone: z.string().trim().min(8).max(30),
    kind: z.enum(["pin", "password"]), channel: z.enum(["sms", "whatsapp"]).optional(),
    website: z.string().max(150).optional(),
  }),
  z.object({
    action: z.literal("confirm"), phone: z.string().trim().min(8).max(30),
    kind: z.enum(["pin", "password"]), code: z.string().regex(/^\d{6}$/),
    password: z.string().max(128).optional(),
  }),
]);

/** Generic recovery messages prevent account enumeration; a verified phone and valid OTP are required. */
export async function POST(request: NextRequest) {
  try {
    const body = schema.parse(await readJson(request));
    const ip = clientIp(request);
    if (body.action === "send") {
      if (!body.website) await requestMobileCredentialReset(body.phone, body.kind, ip, body.channel);
      return NextResponse.json({
        ok: true,
        message: "If this mobile number was verified for an account, a recovery code has been sent.",
        resendAfter: 60,
      }, { headers: { "cache-control": "private, no-store" } });
    }
    const result = await confirmMobileCredentialReset(body.phone, body.kind, body.code, body.password, ip);
    return NextResponse.json({ ok: true, ...result }, { headers: { "cache-control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}
