import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import { decideClaim, resolveFlag, sendClaimCode, staffClaims } from "@/lib/claims";
import { apiError, readJson } from "@/lib/http";
import { resetPin } from "@/lib/mobile-auth";
import { enforceRate, identity, RATE_RULES } from "@/lib/rate-limit";
import { vaultReady } from "@/lib/vault";
import { PublicError } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Record requests waiting for approval and "this isn't me" reports. */
export async function GET() {
  try {
    await requirePermission("records");
    return NextResponse.json(await staffClaims(), { headers: { "cache-control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.enum(["approve", "reject", "code", "resolve"]), id: z.uuid() }),
  z.object({ action: z.literal("reset-pin"), phone: z.string().max(30) }),
]);

export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission("records");
    if (!vaultReady()) throw new PublicError("Customer records need RECORDS_ENCRYPTION_KEY (or PAN_ENCRYPTION_KEY) in the server settings.", 503);
    await enforceRate(RATE_RULES.recordOpensPerUserHour, identity("user", user.id), "Too many actions this hour.");
    const body = schema.parse(await readJson(request));
    if (body.action === "approve" || body.action === "reject") { await decideClaim(user, body.id, body.action === "approve"); return NextResponse.json({ ok: true }); }
    if (body.action === "code") return NextResponse.json({ ok: true, ...(await sendClaimCode(user, body.id)) });
    if (body.action === "resolve") { await resolveFlag(user, body.id); return NextResponse.json({ ok: true }); }
    return NextResponse.json({ ok: true, ...(await resetPin(user, body.phone)) }, { headers: { "cache-control": "no-store" } });
  } catch (error) { return apiError(error); }
}
