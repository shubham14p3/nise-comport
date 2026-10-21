import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { apiError } from "@/lib/http";
import { promoCodeReveal } from "@/lib/promotions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The real offer codes, only for a signed-in customer. Visitors get { signedIn: false } and no codes. */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ signedIn: false, codes: {} }, { headers: { "cache-control": "private, no-store" } });
    return NextResponse.json({ signedIn: true, codes: await promoCodeReveal() }, { headers: { "cache-control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}
