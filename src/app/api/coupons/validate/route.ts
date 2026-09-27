import { NextRequest, NextResponse } from "next/server";
import { and, eq, gt, isNull, or } from "drizzle-orm";
import { z } from "zod";
import { coupons } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { couponDiscount } from "@/lib/print-pricing";

const schema = z.object({ code: z.string().trim().min(2).max(40), amount: z.number().nonnegative().max(1_000_000) });
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in before applying a coupon." }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid coupon code." }, { status: 400 });
  const [coupon] = await db.select().from(coupons).where(and(eq(coupons.code, parsed.data.code.toUpperCase()), eq(coupons.active, true), or(isNull(coupons.expiresAt), gt(coupons.expiresAt, new Date())))).limit(1);
  if (!coupon || parsed.data.amount < Number(coupon.minimumAmount)) return NextResponse.json({ error: "This coupon isn’t valid for the current order." }, { status: 400 });
  const discount = couponDiscount(coupon.discountType, Number(coupon.discountValue), parsed.data.amount);
  if (!discount) return NextResponse.json({ error: "This coupon doesn’t reduce the order total." }, { status: 400 });
  return NextResponse.json({ ok: true, code: coupon.code, discount });
}
