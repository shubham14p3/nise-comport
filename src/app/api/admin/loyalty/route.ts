import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import { apiError, readJson } from "@/lib/http";
import { getLoyaltySettings, loyaltyHistory, saveLoyaltySettings, syncLoyalty } from "@/lib/loyalty";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  action: z.enum(["save", "preview", "apply"]),
  settings: z.unknown().optional(),
});

export async function GET() {
  try {
    await requirePermission("wallet");
    return NextResponse.json({ settings: await getLoyaltySettings(), history: await loyaltyHistory() }, { headers: { "cache-control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission("wallet");
    const input = schema.parse(await readJson(request));
    if (input.action === "save") return NextResponse.json({ ok: true, settings: await saveLoyaltySettings(input.settings, user.id) });
    return NextResponse.json({ ok: true, result: await syncLoyalty(input.action === "apply") });
  } catch (error) { return apiError(error); }
}
