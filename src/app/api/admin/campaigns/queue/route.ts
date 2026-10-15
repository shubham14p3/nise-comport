import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import { markMessage, sendQueue } from "@/lib/campaigns";
import { apiError, readJson } from "@/lib/http";

export const dynamic = "force-dynamic";

/** Messages ready to send with one tap, and the ones scheduled next. */
export async function GET() {
  try {
    await requirePermission("campaigns");
    return NextResponse.json({ messages: await sendQueue() }, { headers: { "cache-control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}

export async function PATCH(request: NextRequest) {
  try {
    const actor = await requirePermission("campaigns");
    const { id, status } = z.object({ id: z.uuid(), status: z.enum(["sent", "skipped", "failed"]) }).parse(await readJson(request));
    await markMessage(id, status, actor.id);
    return NextResponse.json({ ok: true });
  } catch (error) { return apiError(error); }
}
