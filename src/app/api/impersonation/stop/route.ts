import { NextResponse } from "next/server";
import { stopImpersonation } from "@/lib/auth";
import { apiError } from "@/lib/http";

export const dynamic = "force-dynamic";

/** Ends the support view and returns the owner to their own account. */
export async function POST() {
  try {
    return NextResponse.json(await stopImpersonation(), { headers: { "cache-control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}
