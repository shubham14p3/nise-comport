import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { apiError } from "@/lib/http";
import { actorFor, ticketFilesForZip } from "@/lib/mail";
import { buildZip, ticketCode, uniqueNames } from "@/lib/mail-core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    const actor = actorFor(await requireUser());
    const { ticket, entries } = await ticketFilesForZip(actor, request.nextUrl.searchParams.get("id") ?? "");
    const folders = [...new Set(entries.map((entry) => entry.folder))];
    const named = folders.flatMap((folder) => {
      const group = entries.filter((entry) => entry.folder === folder);
      const names = uniqueNames(group.map((entry) => entry.name));
      return group.map((entry, index) => ({ name: `${folder}/${names[index]}`, data: entry.data }));
    });
    const zip = buildZip(named);
    return new NextResponse(new Uint8Array(zip), { headers: {
      "Content-Type": "application/zip", "Content-Disposition": `attachment; filename="${ticketCode(ticket.number)}-files.zip"`,
      "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff",
    } });
  } catch (error) { return apiError(error); }
}
