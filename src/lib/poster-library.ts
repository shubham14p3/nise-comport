/**
 * Ready-made posters in /public/promos (the owner's insurance posters, made with ChatGPT).
 * Posters uploaded in the admin area live in the `media` table and are served from /media/<id>.
 *
 * `discountClaim` marks posters that say "Confirm discount" or "Lowest price guarantee & flat
 * discount". On an insurance advert that reads as a discount on the premium, which intermediaries
 * may not offer (Insurance Act s.41). The admin area warns before these are used.
 *
 * Plain module (no imports).
 */
export type PosterLocale = "en" | "hi" | "bn";
export type Poster = { id: string; src: string; title: string; category: string; locale: PosterLocale; vehicles: "two-wheeler" | "car-and-bike"; discountClaim: boolean };

const insurance = (id: string, title: string, vehicles: Poster["vehicles"], discountClaim: boolean): Poster =>
  ({ id: `insurance/${id}`, src: `/promos/insurance/${id}.jpg`, title, category: "insurance", locale: "en", vehicles, discountClaim });

export const POSTERS: Poster[] = [
  insurance("car-bike-quote-today", "Your ride, our protection: get your quote today", "car-and-bike", false),
  insurance("car-bike-quote-today-highway", "Your ride, our protection: quote today (highway)", "car-and-bike", false),
  insurance("car-bike-quote-today-festive", "Your ride, our protection: quote today (festive)", "car-and-bike", false),
  insurance("jamshedpur-our-city", "Jamshedpur, our city: two-wheeler insurance", "two-wheeler", true),
  insurance("jubilee-park-jamshedpur", "Jubilee Park, Jamshedpur: two-wheeler insurance", "two-wheeler", true),
  insurance("explore-jharkhand", "Explore Jharkhand: two-wheeler insurance", "two-wheeler", true),
  insurance("ride-safe-every-day", "Ride safe every day", "two-wheeler", true),
  insurance("bike-insurance-renewal", "Your bike, your protection: insurance & renewal", "two-wheeler", true),
  insurance("bike-insurance-renewal-festive", "Your bike, your protection (festive)", "two-wheeler", true),
  insurance("bikes-scooters-ride-today", "Bikes & scooters: ride today, stay secure", "two-wheeler", true),
  insurance("bikes-scooters-stay-protected", "Bikes & scooters: stay protected", "two-wheeler", true),
  insurance("bikes-scooters-ride-with-confidence", "Bikes & scooters: ride with confidence", "two-wheeler", true),
  insurance("bikes-scooters-always-protected", "Bikes & scooters: always protected", "two-wheeler", true),
  insurance("bikes-scooters-always-protected-diyas", "Bikes & scooters: always protected (diyas)", "two-wheeler", true),
  insurance("bikes-scooters-fully-protected", "Bikes & scooters: fully protected", "two-wheeler", true),
  insurance("car-bike-your-ride-suv", "Your ride, our protection: car & bike (SUV)", "car-and-bike", true),
  insurance("festive-two-four-wheeler-red-car", "Festive season: two & four-wheeler insurance", "car-and-bike", true),
  insurance("festive-two-four-wheeler-red-car-2", "Festive season: two & four-wheeler (red car)", "car-and-bike", true),
  insurance("festive-two-four-wheeler-white-car", "Festive season: two & four-wheeler (white car)", "car-and-bike", true),
  insurance("festive-two-four-wheeler-safety", "Festive season: drive with safety & happiness", "car-and-bike", true),
];

export const DISCOUNT_CLAIM_WARNING = "This poster says “Confirm discount” / “Lowest price”. On insurance that reads as a discount on the premium, which isn’t allowed. Prefer a “Get your quote” poster, or use a corrected version that says “₹50 off our service charge”.";

export function findPoster(src: string | null | undefined) {
  return src ? POSTERS.find((poster) => poster.src === src) : undefined;
}

/** Poster URLs the site accepts: the built-in library or uploaded media. */
export function isPosterUrl(value: unknown): value is string {
  return typeof value === "string" && (/^\/promos\/[a-z0-9/_-]+\.(jpg|png)$/.test(value) || /^\/media\/[0-9a-f-]{36}$/.test(value));
}

/** The poster for a language, falling back to English, then any poster. */
export function posterFor(posters: Partial<Record<PosterLocale, string>> | null | undefined, locale: PosterLocale) {
  if (!posters) return null;
  return posters[locale] || posters.en || posters.hi || posters.bn || null;
}
