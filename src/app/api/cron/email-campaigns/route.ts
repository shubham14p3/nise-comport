import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { runDueEmailCampaigns } from "@/lib/email-campaigns";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

function authorised(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization") ?? "";
  if (!secret || secret.length < 16) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(header);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

/**
 * Email campaign scheduler. Call every 5 minutes (same secret as the WhatsApp scheduler):
 *   curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://www.nisecomport.com/api/cron/email-campaigns
 */
export async function POST(request: NextRequest) {
  if (!authorised(request)) return new NextResponse(null, { status: 401 });
  try {
    return NextResponse.json(await runDueEmailCampaigns(), { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("[cron] email campaigns failed", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
