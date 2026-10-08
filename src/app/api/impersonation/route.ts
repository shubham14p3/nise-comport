import { NextResponse } from "next/server";
import { currentImpersonation } from "@/lib/auth";
import { apiError } from "@/lib/http";

export const dynamic = "force-dynamic";

/** Status for the support banner. Returns only what the banner shows. */
export async function POST() {
  try {
    const active = await currentImpersonation();
    return NextResponse.json({ active: Boolean(active), ...(active ?? {}) }, { headers: { "cache-control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}
