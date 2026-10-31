import { trashMail } from "@/lib/mail-trash";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { apiError, readJson } from "@/lib/http";
import { PublicError } from "@/lib/errors";
import { enforceRate, identity, RATE_RULES } from "@/lib/rate-limit";
import { actorFor, changeStatus, createTicket, linkTicket, listTickets, mailMeta, replyToTicket, ticketDetail } from "@/lib/mail";
import { pollSupportMailbox } from "@/lib/mail-imap";
import { runAutoClose } from "@/lib/mail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
const NO_STORE = { "cache-control": "private, no-store" };

export async function GET(request: NextRequest) {
  try {
    const actor = actorFor(await requireUser());
    const params = request.nextUrl.searchParams;
    const view = params.get("view") ?? "list";
    if (view === "meta") return NextResponse.json(await mailMeta(actor), { headers: NO_STORE });
    if (view === "ticket") return NextResponse.json(await ticketDetail(actor, params.get("id") ?? ""), { headers: NO_STORE });
    return NextResponse.json(await listTickets(actor, { box: params.get("box") ?? undefined, q: params.get("q") ?? undefined, before: params.get("before") ?? undefined }), { headers: NO_STORE });
  } catch (error) { return apiError(error); }
}

const attachmentIds = z.array(z.string()).max(10).optional();
const body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("delete-selected"), ids: z.array(z.uuid()).min(1).max(100) }),
  z.object({ action: z.literal("create"), subject: z.string().max(300), body: z.string().max(40000), attachmentIds, to: z.string().max(200).optional(), status: z.string().max(30).optional() }),
  z.object({ action: z.literal("reply"), id: z.string().max(60), body: z.string().max(40000), attachmentIds, status: z.string().max(30).optional() }),
  z.object({ action: z.literal("status"), id: z.string().max(60), status: z.string().max(30) }),
  z.object({ action: z.literal("link"), id: z.string().max(60), reference: z.string().max(80) }),
  z.object({ action: z.literal("sync") }),
]);

export async function POST(request: NextRequest) {
  try {
    const actor = actorFor(await requireUser());
    const input = body.parse(await readJson(request, 128 * 1024));
    switch (input.action) {
      case "delete-selected": return NextResponse.json({ ok: true, ...(await trashMail(actor, input.ids)) }, { headers: NO_STORE });
      case "create": return NextResponse.json({ ok: true, ...(await createTicket(actor, input)) }, { status: 201, headers: NO_STORE });
      case "reply": return NextResponse.json(await replyToTicket(actor, input), { headers: NO_STORE });
      case "status": return NextResponse.json(await changeStatus(actor, input.id, input.status), { headers: NO_STORE });
      case "link": return NextResponse.json(await linkTicket(actor, input.id, input.reference), { headers: NO_STORE });
      case "sync": {
        if (!actor.staff) throw new PublicError("Staff access is required.", 403);
        await enforceRate(RATE_RULES.mailSyncPerUserMinute, identity("user", actor.user.id), "Please wait a moment before checking again.");
        const result = await pollSupportMailbox();
        await runAutoClose();
        return NextResponse.json({ ok: result.ok, imported: result.imported, error: result.error }, { headers: NO_STORE });
      }
    }
  } catch (error) { return apiError(error); }
}
