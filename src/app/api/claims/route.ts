import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { apiError, readJson } from "@/lib/http";
import { CLAIM_METHODS, submitClaim } from "@/lib/claims";

export const dynamic = "force-dynamic";

/** Customer: ask to link past records (by PAN or reference now, or WhatsApp code / staff check). */
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = z.object({
      mobile: z.string().min(10).max(20), name: z.string().min(2).max(100),
      method: z.enum(CLAIM_METHODS), value: z.string().max(40).optional(),
    }).parse(await readJson(request));
    return NextResponse.json(await submitClaim(user, body), { headers: { "cache-control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}
