import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import { apiError, readJson } from "@/lib/http";
import { adminPromotions, createPromotion, updatePromotion } from "@/lib/promotions";

export const dynamic = "force-dynamic";

/** Festival, sports and hand-made codes with how often each was used. */
export async function GET() {
  try {
    await requirePermission("promotions");
    return NextResponse.json(await adminPromotions(), { headers: { "cache-control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a date.");
const text3 = z.object({ en: z.string().max(300).optional(), hi: z.string().max(300).optional(), bn: z.string().max(300).optional() });
const posters = z.object({ en: z.string().max(200).optional(), hi: z.string().max(200).optional(), bn: z.string().max(200).optional() });
const details = {
  names: text3.optional(), description: text3.nullable().optional(),
  discountType: z.enum(["fixed", "percent"]).optional(), discount: z.number().positive().max(100_000).optional(), minimum: z.number().min(0).max(100_000).optional(),
  perUserLimit: z.number().int().min(1).max(50).nullable().optional(), maxRedemptions: z.number().int().min(1).max(100_000).nullable().optional(),
  posters: posters.nullable().optional(), emoji: z.string().max(16).nullable().optional(),
  appliesTo: z.object({ categories: z.array(z.string().max(80)).max(60).optional(), services: z.array(z.string().max(80)).max(60).optional() }).nullable().optional(),
  maxDiscount: z.number().positive().max(5000).nullable().optional(),
};

/** Create a promotion by hand (code, text in three languages, value, dates, limits, posters). */
export async function POST(request: NextRequest) {
  try {
    const actor = await requirePermission("promotions");
    const input = z.object({ code: z.string().trim().min(3).max(20), startsOn: day, endsOn: day, active: z.boolean().optional(), ...details }).parse(await readJson(request));
    const row = await createPromotion(input, actor);
    return NextResponse.json({ ok: true, id: row.id, code: row.code }, { status: 201 });
  } catch (error) { return apiError(error); }
}

const patchSchema = z.object({
  id: z.uuid(),
  active: z.boolean().optional(),
  startsOn: day.optional(), endsOn: day.optional(), eventStarts: day.optional(), eventEnds: day.optional(),
  unlock: z.boolean().optional(),
  ...details,
});

/** Switch a code on/off, edit a hand-made promotion, add posters, or correct dates (locks the row against the daily sync). */
export async function PATCH(request: NextRequest) {
  try {
    await requirePermission("promotions");
    const { id, ...patch } = patchSchema.parse(await readJson(request));
    const updated = await updatePromotion(id, patch);
    return NextResponse.json({ ok: true, id: updated?.id ?? id });
  } catch (error) { return apiError(error); }
}
