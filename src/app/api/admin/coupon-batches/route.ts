import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import { apiError, readJson } from "@/lib/http";
import { batchCodes, createBatch, listBatches, previewAudience, setBatchActive, type Audience } from "@/lib/coupon-batches";

export const runtime = "nodejs";
export const maxDuration = 60;

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const audience = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("people"), values: z.array(z.string().max(120)).max(5000) }),
  z.object({ kind: z.literal("all") }),
  z.object({ kind: z.literal("used"), services: z.array(z.string().max(80).regex(/^[a-z0-9-]+$/)).min(1).max(60) }),
  z.object({ kind: z.literal("inactive"), days: z.number().int().min(7).max(730) }),
]);
const create = z.object({
  action: z.literal("create"), name: z.string().max(100), prefix: z.string().max(12), title: z.string().max(100).optional(),
  discountType: z.enum(["fixed", "percent"]), discount: z.number().positive().max(5000), minimum: z.number().min(0).max(100_000),
  maxDiscount: z.number().positive().max(5000).nullable().optional(), usesPerCode: z.number().int().min(1).max(10),
  appliesTo: z.object({ categories: z.array(z.string().max(80)).max(60).optional(), services: z.array(z.string().max(80)).max(60).optional() }).nullable().optional(),
  audience, startsOn: day, endsOn: day, notify: z.boolean().optional(),
});

/** Batches, or the codes of one batch (?id=). */
export async function GET(request: NextRequest) {
  try {
    await requirePermission("promotions");
    const id = request.nextUrl.searchParams.get("id");
    if (id) return NextResponse.json({ codes: await batchCodes(z.uuid().parse(id)) });
    return NextResponse.json({ batches: await listBatches() });
  } catch (error) { return apiError(error); }
}

/** { action: "preview", audience } counts who would get a code; { action: "create", … } issues them. */
export async function POST(request: NextRequest) {
  try {
    const actor = await requirePermission("promotions");
    const body = await readJson(request) as { action?: string };
    if (body?.action === "preview") {
      const input = z.object({ action: z.literal("preview"), audience }).parse(body);
      return NextResponse.json(await previewAudience(input.audience as Audience));
    }
    const input = create.parse(body);
    return NextResponse.json({ ok: true, ...(await createBatch({ ...input, audience: input.audience as Audience }, actor)) }, { status: 201 });
  } catch (error) { return apiError(error); }
}

export async function PATCH(request: NextRequest) {
  try {
    const actor = await requirePermission("promotions");
    const input = z.object({ id: z.uuid(), active: z.boolean() }).parse(await readJson(request));
    return NextResponse.json({ ok: true, batch: await setBatchActive(input.id, input.active, actor) });
  } catch (error) { return apiError(error); }
}
