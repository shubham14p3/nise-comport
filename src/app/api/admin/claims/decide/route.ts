import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import { apiError, readJson } from "@/lib/http";
import { decideClaim } from "@/lib/claims";

export const dynamic = "force-dynamic";

/** Staff: approve (link to the name they picked) or reject a claim. */
export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission("records");
    const body = z.object({ id: z.string().uuid(), decision: z.enum(["approve", "reject"]), matchedName: z.string().min(1).max(100).optional() }).parse(await readJson(request));
    return NextResponse.json(await decideClaim(body.id, body.decision, body.matchedName, user), { headers: { "cache-control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}
