import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { apiError } from "@/lib/http";
import { actorFor, linkedFileForStaff } from "@/lib/mail";
import { PREVIEWABLE } from "@/lib/mail-core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** A file the customer uploaded with the linked request or print order (staff only). */
export async function GET(request: NextRequest) {
  try {
    const actor = actorFor(await requireUser());
    const { file, bytes } = await linkedFileForStaff(actor, request.nextUrl.searchParams.get("t") ?? "", request.nextUrl.searchParams.get("id") ?? "");
    const inline = PREVIEWABLE.has(file.mimeType) && request.nextUrl.searchParams.get("dl") !== "1";
    return new NextResponse(new Uint8Array(bytes), { headers: {
      "Content-Type": file.mimeType, "Content-Disposition": `${inline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(file.name)}`,
      "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff",
    } });
  } catch (error) { return apiError(error); }
}
