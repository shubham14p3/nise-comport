import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { apiError } from "@/lib/http";
import { hasPermission } from "@/lib/permissions";
import { googleBusinessSyncConfigured, syncGoogleReviews } from "@/lib/google-business-reviews";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Whether the automated Google Business Profile sync is set up, for the "Sync from Google" button's state. */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "content")) return NextResponse.json({ error: "Site content access is required." }, { status: 403 });
    return NextResponse.json({ configured: googleBusinessSyncConfigured() });
  } catch (error) { return apiError(error); }
}

/** Pulls every review from the Business Profile API and upserts into testimonials. See src/lib/google-business-reviews.ts for setup. */
export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "content")) return NextResponse.json({ error: "Site content access is required." }, { status: 403 });
    const result = await syncGoogleReviews();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) { return apiError(error); }
}
