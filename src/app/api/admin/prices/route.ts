import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import { apiError, readJson } from "@/lib/http";
import { allServicePrices, saveServicePrice } from "@/lib/service-prices";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ slug: z.string().max(100), amount: z.union([z.number(), z.string(), z.null()]).optional(), kind: z.string().max(10), note: z.string().max(160).nullable().optional() });

export async function GET() {
  try {
    await requirePermission("content");
    return NextResponse.json({ prices: await allServicePrices() }, { headers: { "cache-control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission("content");
    const input = schema.parse(await readJson(request));
    const raw = typeof input.amount === "string" ? input.amount.replace(/[₹,\s]/g, "") : input.amount;
    const amount = raw === "" || raw === null || raw === undefined ? null : Number(raw);
    await saveServicePrice({ slug: input.slug, amount: amount !== null && Number.isFinite(amount) ? amount : null, kind: input.kind, note: input.note }, user.id);
    return NextResponse.json({ ok: true });
  } catch (error) { return apiError(error); }
}
