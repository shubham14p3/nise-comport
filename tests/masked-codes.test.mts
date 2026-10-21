import assert from "node:assert/strict";
import test from "node:test";
import { promoText, promoToOffer, shownCode, MASKED_CODE, type PromoView } from "../src/lib/promo-view.ts";

const view: PromoView = {
  code: "m1a2b3c4d5e6f", kind: "festival", eventKey: "diwali-2026", names: { en: "Diwali", hi: "दीपावली", bn: "দীপাবলি" }, blurb: null, emoji: "🪔", theme: "diya",
  communities: [], categories: null, discountType: "fixed", discount: 50, minimum: 150, startsOn: "2026-10-01", endsOn: "2026-11-30", eventStarts: "2026-11-08", eventEnds: "2026-11-08", tentative: false, masked: true,
};

test("a masked code shows as XXXXXX", () => {
  assert.equal(shownCode(view), MASKED_CODE);
  assert.equal(shownCode({ ...view, masked: false }), view.code);
});

test("text built from a masked promo never contains the token", () => {
  for (const locale of ["en", "hi", "bn"] as const) {
    const text = promoText(view, locale);
    assert.ok(!text.ticker.includes(view.code) && !text.detail.includes(view.code), locale);
    assert.ok(text.ticker.includes(MASKED_CODE) && text.detail.includes(MASKED_CODE), locale);
  }
});

test("a masked promo's offer links to /offers, not to a request with the code", () => {
  const offer = promoToOffer(view);
  assert.equal(offer.masked, true);
  assert.equal(offer.href, "/offers");
});
