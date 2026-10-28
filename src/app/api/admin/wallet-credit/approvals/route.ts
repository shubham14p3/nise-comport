import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { PublicError } from "@/lib/errors";
import { apiError, readJson } from "@/lib/http";
import { decideCreditRequest, listCreditRequests } from "@/lib/wallet-credits";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("list") }),
  z.object({ action: z.literal("decide"), id: z.uuid(), decision: z.enum(["approve", "reject"]), note: z.string().trim().max(300) }),
]);

/** Pending and recent wallet credit requests. Owner only; the approver must be a different admin. */
export async function POST(request: NextRequest) {
  try {
    const actor = await getCurrentUser();
    if (actor?.role !== "admin") throw new PublicError("Only the owner can approve wallet credits.", 403, { code: "forbidden" });
    const input = schema.parse(await readJson(request));
    if (input.action === "list") {
      return NextResponse.json({ requests: await listCreditRequests(), me: actor.id }, { headers: { "cache-control": "private, no-store" } });
    }
    const result = await decideCreditRequest({ actorId: actor.id, id: input.id, decision: input.decision, note: input.note });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return apiError(error);
  }
}
