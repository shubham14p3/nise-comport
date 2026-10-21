import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { apiError } from "@/lib/http";
import { qrSummary } from "@/lib/qr-scans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Admin → QR scans: anonymous counts by day, source and device. */
export async function GET() {
  try {
    await requirePermission("campaigns");
    return NextResponse.json(await qrSummary(30), { headers: { "cache-control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}
