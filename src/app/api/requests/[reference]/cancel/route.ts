import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { PublicError } from "@/lib/errors";
import { apiError, readJson } from "@/lib/http";
import { enforceRate, identity, RATE_RULES } from "@/lib/rate-limit";
import { cancelServiceRequest } from "@/lib/requests";

const schema = z.object({ reason: z.string().trim().max(300, "Keep the reason under 300 characters.").optional().default("") });

/** Lets the owner cancel a request that staff haven't finished. Cancelling twice is harmless. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ reference: string }> }) {
  try {
    const user = await requireUser();
    const { reference } = await params;
    const body = schema.parse(await readJson(request).catch(() => ({})));
    await enforceRate(RATE_RULES.cancelPerUserHour, identity("user", user.id), "Too many changes in a short time.");
    if (!/^[A-Z0-9-]{4,80}$/i.test(reference)) throw new PublicError("Request not found.", 404);
    const result = await cancelServiceRequest(user, reference, body.reason);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) { return apiError(error); }
}
