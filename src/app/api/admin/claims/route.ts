import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { apiError } from "@/lib/http";
import { listClaims } from "@/lib/claims";

export const dynamic = "force-dynamic";

/** Staff: claims waiting for a check, with the names found on that number. */
export async function GET() {
  try {
    await requirePermission("records");
    return NextResponse.json(await listClaims(), { headers: { "cache-control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}
