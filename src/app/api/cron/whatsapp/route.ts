import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { runCampaigns } from "@/lib/campaigns";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorised(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization") ?? "";
  if (!secret || secret.length < 16) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(header);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

/**
 * WhatsApp campaign scheduler. Call every 5 minutes:
 *   curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://www.nisecomport.com/api/cron/whatsapp
 * Plans rounds (≤10 messages, random 10–30 min gaps, daily limit, 9–8 IST) and sends or queues what's due.
 */
async function run(request: NextRequest) {
  if (!authorised(request)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  try {
    return NextResponse.json({ ok: true, ...(await runCampaigns()) });
  } catch (error) {
    console.error("[cron] whatsapp campaigns failed", error);
    return NextResponse.json({ ok: false, error: "Campaign run failed; see server logs." }, { status: 500 });
  }
}

export const GET = run;
export const POST = run;
