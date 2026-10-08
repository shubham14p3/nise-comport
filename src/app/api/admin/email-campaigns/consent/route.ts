import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import { apiError, readJson } from "@/lib/http";
import { askForConsent } from "@/lib/email-campaigns";

export const dynamic = "force-dynamic";
export const maxDuration = 120;
const headers = { "cache-control": "private, no-store" };

/** Emails the chosen people once, asking them to click YES. */
export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission("campaigns");
    const body = z.object({ ids: z.array(z.string().uuid()).min(1).max(40) }).parse(await readJson(request));
    return NextResponse.json(await askForConsent(body.ids, user), { headers });
  } catch (error) { return apiError(error); }
}
