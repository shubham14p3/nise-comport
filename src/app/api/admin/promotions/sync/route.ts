import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { apiError } from "@/lib/http";
import { syncOffers } from "@/lib/promotions";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** "Sync now" in Admin → Promotions: same as the daily job. */
export async function POST() {
  try {
    await requirePermission("promotions");
    return NextResponse.json({ ok: true, ...(await syncOffers()) });
  } catch (error) { return apiError(error); }
}
