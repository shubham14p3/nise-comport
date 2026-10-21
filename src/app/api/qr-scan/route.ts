import { NextRequest, NextResponse } from "next/server";
import { apiError, readJson } from "@/lib/http";
import { recordQr } from "@/lib/qr-scans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Anonymous counter for the welcome QR page. Always answers 204 so the page never shows an error. */
export async function POST(request: NextRequest) {
  try {
    const body = (await readJson(request)) as Record<string, unknown>;
    await recordQr({ source: body.source, device: body.device, action: body.action });
    return new NextResponse(null, { status: 204 });
  } catch (error) { return apiError(error); }
}
