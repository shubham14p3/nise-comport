/**
 * The full promotion calendar: festival codes (festivals.ts, dates refreshed from Google's
 * holiday feed) plus sports codes (sports-events.ts). Plain module, no imports beyond siblings.
 */
import { FESTIVAL_PROMO, festivalPromos, istDate, mergeOccurrences, type EventPromo, type PromoSettings } from "./festivals.ts";
import { sportPromos } from "./sports-events.ts";

export function eventPromos(feed: { key: string; date: string }[] = [], now = new Date(), settings: PromoSettings = FESTIVAL_PROMO): EventPromo[] {
  const promos = [...festivalPromos(mergeOccurrences(feed), now, settings), ...sportPromos(now, settings)];
  return promos.sort((a, b) => a.eventStarts.localeCompare(b.eventStarts) || a.code.localeCompare(b.code));
}

/** Promotions from the checked fallback dates only (no network, no database). */
export function curatedEventPromos(now = new Date()) {
  return eventPromos([], now);
}

export type PromoStatus = "live" | "upcoming" | "ended";

export function promoStatus(promo: { startsOn: string; endsOn: string }, now = new Date()): PromoStatus {
  const today = istDate(now);
  if (today < promo.startsOn) return "upcoming";
  if (today > promo.endsOn) return "ended";
  return "live";
}

/** Codes must be unique across festivals and sports; returns duplicates (should be empty). */
export function duplicateCodes(promos: EventPromo[]) {
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const promo of promos) { if (seen.has(promo.code)) dupes.add(promo.code); seen.add(promo.code); }
  return [...dupes];
}
