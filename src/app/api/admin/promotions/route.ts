import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { apiError, readJson } from "@/lib/http";
import { adminPromotions, updatePromotion } from "@/lib/promotions";

export const dynamic = "force-dynamic";

/** Festival, sports and hand-made codes with how often each was used. */
export async function GET() {
  try {
    await requireStaff();
    return NextResponse.json(await adminPromotions(), { headers: { "cache-control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a date.");
const patchSchema = z.object({
  id: z.uuid(),
  active: z.boolean().optional(),
  startsOn: day.optional(), endsOn: day.optional(), eventStarts: day.optional(), eventEnds: day.optional(),
  unlock: z.boolean().optional(),
});

/** Switch a code on/off, or correct its dates (edited codes are locked against the daily sync). */
export async function PATCH(request: NextRequest) {
  try {
    await requireStaff("admin");
    const input = patchSchema.parse(await readJson(request));
    const { id, ...patch } = input;
    const updated = await updatePromotion(id, patch);
    return NextResponse.json({ ok: true, id: updated?.id ?? id });
  } catch (error) { return apiError(error); }
}
