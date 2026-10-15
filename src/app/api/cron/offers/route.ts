import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { syncOffers } from "@/lib/promotions";

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
 * Daily festival & sports offers sync (run once a day, e.g. 05:00 IST):
 *   curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://www.nisecomport.com/api/cron/offers
 * Reads Google's public Indian holiday calendar, corrects festival dates, and creates promo codes
 * up to the end of 2028 (then a rolling ~27 months). Codes switched off in the admin panel stay off.
 */
async function run(request: NextRequest) {
  if (!authorised(request)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  try {
    const report = await syncOffers();
    return NextResponse.json({ ok: true, ...report });
  } catch (error) {
    console.error("[cron] offers sync failed", error);
    return NextResponse.json({ ok: false, error: "Offers sync failed; see server logs." }, { status: 500 });
  }
}

export const GET = run;
export const POST = run;
