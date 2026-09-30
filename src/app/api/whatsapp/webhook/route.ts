import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { handleInbound } from "@/lib/campaigns";
import { parseWebhook, verifyMetaSignature } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Meta's one-time webhook verification (GET with hub.* parameters). */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const expected = process.env.WHATSAPP_VERIFY_TOKEN ?? "";
  const supplied = params.get("hub.verify_token") ?? "";
  const match = expected.length >= 16 && expected.length === supplied.length && timingSafeEqual(Buffer.from(expected), Buffer.from(supplied));
  if (params.get("hub.mode") === "subscribe" && match) return new Response(params.get("hub.challenge") ?? "", { status: 200, headers: { "content-type": "text/plain" } });
  return new Response("Forbidden", { status: 403 });
}

/** Replies (STOP / YES) and delivery receipts. Only signed calls from Meta are accepted. */
export async function POST(request: NextRequest) {
  const raw = await request.text();
  if (raw.length > 512 * 1024) return NextResponse.json({ error: "Too large." }, { status: 413 });
  if (!verifyMetaSignature(raw, request.headers.get("x-hub-signature-256"), process.env.WHATSAPP_APP_SECRET)) return NextResponse.json({ error: "Bad signature." }, { status: 401 });
  try {
    const result = await handleInbound(parseWebhook(JSON.parse(raw)));
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[whatsapp] webhook failed", error);
    // 200 so Meta doesn't retry forever on a bad payload; the error is in the logs.
    return NextResponse.json({ ok: false });
  }
}
