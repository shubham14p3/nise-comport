import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { apiError, readJson } from "@/lib/http";
import { enforceRate, identity, RATE_RULES } from "@/lib/rate-limit";
import { resolveCoupon } from "@/lib/promotions";

const schema = z.object({
  code: z.string().trim().min(2).max(40),
  /** Print order total; leave out for a service request (billed later). */
  amount: z.number().nonnegative().max(1_000_000).optional(),
});

/** Checks a coupon for the signed-in customer and returns what it's worth. */
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    await enforceRate(RATE_RULES.couponChecksPerUserHour, identity("user", user.id), "Too many coupon attempts. Please try again in a little while.");
    const input = schema.parse(await readJson(request));
    const { coupon, view, discount } = await resolveCoupon({ code: input.code, userId: user.id, amount: input.amount });
    return NextResponse.json({
      ok: true, code: coupon.code, discount: discount ?? Number(coupon.discountValue), exact: discount !== null,
      discountType: view.discountType, value: view.discount, minimum: view.minimum, names: view.names, emoji: view.emoji, endsOn: view.endsOn,
    });
  } catch (error) { return apiError(error); }
}
