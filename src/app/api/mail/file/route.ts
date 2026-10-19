import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { apiError } from "@/lib/http";
import { actorFor, attachmentForActor } from "@/lib/mail";
import { PREVIEWABLE } from "@/lib/mail-core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const actor = actorFor(await requireUser());
    const { row, bytes } = await attachmentForActor(actor, request.nextUrl.searchParams.get("id") ?? "");
    const inline = PREVIEWABLE.has(row.mimeType) && request.nextUrl.searchParams.get("dl") !== "1";
    return new NextResponse(new Uint8Array(bytes), { headers: {
      "Content-Type": row.mimeType, "Content-Disposition": `${inline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(row.name)}`,
      "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff",
    } });
  } catch (error) { return apiError(error); }
}
