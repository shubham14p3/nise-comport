import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { PublicError } from "@/lib/errors";
import { apiError, readJson } from "@/lib/http";
import { enforceRate, hitRate, identity, peekRate, RATE_RULES } from "@/lib/rate-limit";
import { resolveCoupon } from "@/lib/promotions";
import { resolveService } from "@/lib/site-content";

const schema = z.object({
  code: z.string().trim().min(2).max(40),
  /** Print order total; leave out for a service request (billed later). */
  amount: z.number().nonnegative().max(1_000_000).optional(),
  /** "print", "pan" or a service slug, so codes for other services are refused here already. */
  service: z.string().max(80).regex(/^[a-z0-9-]*$/).optional(),
});

/**
 * Checks a coupon for the signed-in customer and returns what it's worth. Wrong codes count
 * against a small hourly/daily allowance, so codes can't be guessed by trying many.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const who = identity("user", user.id);
    await enforceRate(RATE_RULES.couponChecksPerUserHour, who, "Too many coupon attempts. Please try again in a little while.");
    for (const rule of [RATE_RULES.couponFailuresPerUserHour, RATE_RULES.couponFailuresPerUserDay]) {
      const state = await peekRate(rule, who);
      if (state.count >= rule.limit) throw new PublicError("Too many wrong codes. Please try again later, or ask us on WhatsApp for a valid code.", 429, { code: "coupon_locked" });
    }
    const input = schema.parse(await readJson(request));
    const found = input.service && input.service !== "print" && input.service !== "pan" ? await resolveService(input.service) : null;
    const context = input.service ? { service: input.service, category: found ? ("categorySlug" in found ? String(found.categorySlug) : found.slug) : null } : undefined;
    try {
      const { coupon, view, discount } = await resolveCoupon({ code: input.code, userId: user.id, amount: input.amount, context });
      return NextResponse.json({
        ok: true, code: coupon.code, discount: discount ?? Number(coupon.discountValue), exact: discount !== null,
        discountType: view.discountType, value: view.discount, minimum: view.minimum, names: view.names, emoji: view.emoji, endsOn: view.endsOn,
        validOn: view.validOn ?? null, maxDiscount: view.maxDiscount ?? null,
      });
    } catch (error) {
      if (error instanceof PublicError && error.code === "coupon_invalid") {
        await hitRate(RATE_RULES.couponFailuresPerUserHour, who);
        await hitRate(RATE_RULES.couponFailuresPerUserDay, who);
      }
      throw error;
    }
  } catch (error) { return apiError(error); }
}
