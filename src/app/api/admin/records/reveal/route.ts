import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { confirmRecordReveal, requestRecordReveal, requirePermission } from "@/lib/auth";
import { apiError, clientIp, readJson } from "@/lib/http";
import { revealPan } from "@/lib/records";

export const dynamic = "force-dynamic";

/**
 * Full PAN, in two steps:
 *  1. { recordId }            → emails a code to the signed-in staff member
 *  2. { recordId, code }      → checks the code and returns the PAN once
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission("records");
    const body = z.object({ recordId: z.string().uuid(), code: z.string().regex(/^\d{6}$/).optional() }).parse(await readJson(request));
    const headers = { "cache-control": "private, no-store" };
    if (!body.code) {
      const sent = await requestRecordReveal(user, body.recordId, clientIp(request));
      return NextResponse.json({ sent: true, ...sent }, { headers });
    }
    await confirmRecordReveal(user, body.recordId, body.code, clientIp(request));
    return NextResponse.json(await revealPan(body.recordId, user), { headers });
  } catch (error) { return apiError(error); }
}
