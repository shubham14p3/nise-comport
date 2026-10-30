import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { PublicError } from "@/lib/errors";
import { apiError, readJson } from "@/lib/http";
import { markCelebrated, recordNudge, welcomeStatus } from "@/lib/welcome-credit";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("status") }),
  z.object({ action: z.literal("nudge") }),
  z.object({ action: z.literal("celebrated") }),
]);

/** The signed-in customer's own welcome-credit state. Never reads anyone else's. */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role === "demo") throw new PublicError("Sign in to see your welcome credit.", 401);
    const input = schema.parse(await readJson(request));
    if (input.action === "status") return NextResponse.json(await welcomeStatus(user.id), { headers: { "cache-control": "private, no-store" } });
    if (input.action === "nudge") return NextResponse.json(await recordNudge(user.id), { headers: { "cache-control": "private, no-store" } });
    await markCelebrated(user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
