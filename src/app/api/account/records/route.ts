import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { flagRecord, myRecords, submitClaimCode } from "@/lib/claims";
import { apiError, readJson } from "@/lib/http";
import { otpChannels } from "@/lib/sms";

export const dynamic = "force-dynamic";

/** The customer's own records (after approval): service, first name and dates only. */
export async function GET() {
  try {
    const user = await requireUser();
    return NextResponse.json({ ...(await myRecords(user)), smsEnabled: otpChannels().includes("sms"), whatsappEnabled: otpChannels().includes("whatsapp") }, { headers: { "cache-control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("code"), code: z.string().max(12) }),
  z.object({ action: z.literal("flag"), recordId: z.uuid().nullable().optional(), note: z.string().max(300).optional() }),
]);

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = schema.parse(await readJson(request));
    if (body.action === "code") { await submitClaimCode(user, body.code); return NextResponse.json({ ok: true }); }
    await flagRecord(user, body.recordId ?? null, body.note ?? "");
    return NextResponse.json({ ok: true });
  } catch (error) { return apiError(error); }
}
