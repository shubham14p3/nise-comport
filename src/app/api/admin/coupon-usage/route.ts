import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import { apiError, readJson } from "@/lib/http";
import { blockCustomer, couponUsage, unblockCustomer } from "@/lib/coupon-usage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("block"), userId: z.uuid(), couponId: z.uuid().nullable().optional(), reason: z.string().max(200).nullable().optional() }),
  z.object({ action: z.literal("unblock"), id: z.uuid() }),
]);

/** Admin → Coupon use: who used which code and how often, and who is barred from a code. */
export async function GET(request: NextRequest) {
  try {
    await requirePermission("promotions");
    const params = request.nextUrl.searchParams;
    const uuid = z.uuid();
    const couponId = uuid.safeParse(params.get("coupon")).data;
    const userId = uuid.safeParse(params.get("user")).data;
    return NextResponse.json(await couponUsage({ couponId, userId, q: params.get("q") ?? undefined, page: Number(params.get("page")) || 0, pageSize: Number(params.get("pageSize")) || 20 }), { headers: { "cache-control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission("promotions");
    const body = schema.parse(await readJson(request));
    const actor = { id: user.id, name: user.name };
    if (body.action === "block") await blockCustomer(body, actor); else await unblockCustomer(body.id, actor);
    return NextResponse.json({ ok: true });
  } catch (error) { return apiError(error); }
}
