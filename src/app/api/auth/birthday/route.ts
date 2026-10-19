import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { birthdayGreeting } from "@/lib/birthday-coupon";
import { loadSettings } from "@/lib/outreach";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };

/** Tells the signed-in customer's browser whether to show the birthday pop-up (and the gift coupon). Never fails the page. */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ signedIn: false, greeting: null }, { headers });
    const settings = (await loadSettings()).birthday.coupon;
    return NextResponse.json({ signedIn: true, greeting: await birthdayGreeting(user, settings) }, { headers });
  } catch (error) {
    console.error("[birthday] greeting failed", error instanceof Error ? error.message : error);
    return NextResponse.json({ signedIn: false, greeting: null }, { headers });
  }
}
