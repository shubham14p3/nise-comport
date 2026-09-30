/**
 * How festival, sports and welcome coupons are shown: as offer cards in three languages, as a
 * Google Calendar link, as an iCalendar feed (/offers/calendar.ics) and as CSV for Google Sheets
 * (/offers/offers.csv). Plain module, so it can be tested with Node and used on both sides.
 */
import { addDays, istDate, type EventPromo, type Text3 } from "./festivals.ts";
import type { Locale, Offer, OfferTone } from "./offers.ts";

/** A coupon as the website shows it (JSON-safe; built from a `coupons` row or a fallback promo). */
export type PromoView = {
  code: string;
  kind: "festival" | "sport" | "public" | "welcome";
  /** "diwali-2026", "ipl-2027"; null for hand-made and welcome coupons. */
  eventKey: string | null;
  names: Text3;
  blurb: Text3 | null;
  emoji: string;
  theme: string;
  communities: string[];
  categories: string[] | null;
  discountType: "fixed" | "percent";
  discount: number;
  minimum: number;
  /** Inclusive India-time dates the code can be used. */
  startsOn: string;
  endsOn: string;
  eventStarts: string | null;
  eventEnds: string | null;
  tentative: boolean;
  /** Poster image per language (/promos/… or /media/…), if the owner added one. */
  posters?: Partial<Text3> | null;
};

/** A coupon on the customer's Vouchers page. */
export type CustomerVoucher = PromoView & { used: boolean; live: boolean; personal: boolean };

export function viewFromPromo(promo: EventPromo): PromoView {
  return {
    code: promo.code, kind: promo.kind, eventKey: promo.key, names: promo.names, blurb: promo.blurb ?? null,
    emoji: promo.emoji, theme: promo.theme, communities: promo.communities, categories: promo.categories ?? null,
    discountType: "fixed", discount: promo.discount, minimum: promo.minimum,
    startsOn: promo.startsOn, endsOn: promo.endsOn, eventStarts: promo.eventStarts, eventEnds: promo.eventEnds,
    tentative: Boolean(promo.tentative),
  };
}

export function isPromoLive(view: Pick<PromoView, "startsOn" | "endsOn">, now = new Date()) {
  const today = istDate(now);
  return view.startsOn <= today && today <= view.endsOn;
}

export const THEME_TONE: Record<string, OfferTone> = {
  diya: "saffron", puja: "pink", holi: "violet", harvest: "green", sun: "saffron", christmas: "green", eid: "cyan",
  sikh: "saffron", peace: "cyan", tricolour: "saffron", devotion: "violet", spring: "green", newyear: "violet",
  cricket: "cyan", games: "violet", hockey: "green", football: "green", kabaddi: "saffron", chess: "violet", welcome: "violet",
};

const rupees = (value: number) => `₹${Number.isInteger(value) ? value : value.toFixed(2)}`;

export function discountLabel(view: Pick<PromoView, "discountType" | "discount">, locale: Locale) {
  const amount = view.discountType === "percent" ? `${view.discount}%` : rupees(view.discount);
  return locale === "hi" ? `${amount} की छूट` : locale === "bn" ? `${amount} ছাড়` : `${amount} OFF`;
}

const TERMS: Text3 = {
  en: "One use per customer. Applies to our service charge or print total only, never to government fees or an insurer’s premium.",
  hi: "प्रति ग्राहक एक बार। केवल हमारे सेवा शुल्क या प्रिंट बिल पर लागू; सरकारी शुल्क या बीमा प्रीमियम पर नहीं।",
  bn: "প্রতি গ্রাহক একবার। শুধু আমাদের সার্ভিস চার্জ বা প্রিন্টের বিলে প্রযোজ্য; সরকারি ফি বা বিমার প্রিমিয়ামে নয়।",
};

/** Promo text in one language. */
export function promoText(view: PromoView, locale: Locale) {
  const name = view.names[locale] || view.names.en;
  const off = discountLabel(view, locale);
  const min = rupees(view.minimum);
  const title = view.kind === "welcome"
    ? { en: "Your welcome coupon", hi: "आपका वेलकम कूपन", bn: "আপনার ওয়েলকাম কুপন" }[locale]
    : view.kind === "public" ? name
      : { en: `${name} offer`, hi: `${name} ऑफ़र`, bn: `${name} অফার` }[locale];
  // The ticker shows `highlight` (₹50 OFF) in bold just before this text.
  const ticker = {
    en: `${name} · code ${view.code}`,
    hi: `${name} · कोड ${view.code}`,
    bn: `${name} · কোড ${view.code}`,
  }[locale];
  const detail = {
    en: `Use code ${view.code} for ${off.replace(" OFF", " off")} our service charge on orders of ${min} or more.`,
    hi: `${min} या उससे अधिक के ऑर्डर पर कोड ${view.code} से हमारे सेवा शुल्क में ${off}।`,
    bn: `${min} বা তার বেশি অর্ডারে কোড ${view.code} দিয়ে আমাদের সার্ভিস চার্জে ${off}।`,
  }[locale];
  return { name, title, highlight: off, ticker, detail, blurb: view.blurb ? view.blurb[locale] || view.blurb.en : "", terms: TERMS[locale] };
}

/** A promo as an `Offer`, so the ticker, rails and offer cards can show it next to the brand offers. */
export function promoToOffer(view: PromoView): Offer {
  const text = (locale: Locale) => promoText(view, locale);
  const each = <K extends keyof ReturnType<typeof promoText>>(key: K): Text3 => ({ en: text("en")[key], hi: text("hi")[key], bn: text("bn")[key] });
  const blurb = view.blurb;
  return {
    id: `code-${view.code}`,
    active: true,
    highlight: each("highlight"),
    title: each("title"),
    ticker: each("ticker"),
    detail: blurb ? { en: `${blurb.en}. ${text("en").detail}`, hi: `${blurb.hi}। ${text("hi").detail}`, bn: `${blurb.bn}। ${text("bn").detail}` } : each("detail"),
    terms: each("terms"),
    badge: "LIVE",
    tone: THEME_TONE[view.theme] ?? "pink",
    categories: view.categories?.length ? view.categories : "all",
    startsAt: view.startsOn,
    endsAt: view.endsOn,
    href: view.kind === "welcome" ? "/profile#vouchers" : `/request?coupon=${encodeURIComponent(view.code)}`,
    code: view.code,
    emoji: view.emoji,
    theme: view.theme,
    kind: view.kind,
    ...(view.eventStarts ? { eventDate: view.eventStarts } : {}),
    ...(view.tentative ? { tentative: true } : {}),
  };
}

/** Live promos first by soonest end, as offers. */
export function liveOfferCodes(views: PromoView[], now = new Date()) {
  return views.filter((view) => isPromoLive(view, now)).sort((a, b) => a.endsOn.localeCompare(b.endsOn) || a.code.localeCompare(b.code)).map(promoToOffer);
}

// ---------------------------------------------------------------------------------------------
// Exports: Google Calendar, iCalendar and CSV
// ---------------------------------------------------------------------------------------------

export type ExportOptions = { siteUrl: string; locale?: Locale; now?: Date };

const compact = (isoDate: string) => isoDate.replace(/-/g, "");

function eventDetails(view: PromoView, options: ExportOptions) {
  const locale = options.locale ?? "en";
  const text = promoText(view, locale);
  const lines = [
    text.blurb,
    text.detail,
    view.tentative ? { en: "Event dates are still to be confirmed by the organisers.", hi: "आयोजकों ने तारीख़ें अभी पक्की नहीं की हैं।", bn: "আয়োজকরা এখনও তারিখ চূড়ান্ত করেননি।" }[locale] : "",
    text.terms,
    `${options.siteUrl}/offers#${view.code}`,
  ].filter(Boolean);
  return { text, description: lines.join("\n") };
}

export function eventSummary(view: PromoView, locale: Locale = "en") {
  const text = promoText(view, locale);
  return `${view.emoji} ${view.code} · ${text.highlight} · ${text.name} (NISE COMPORT)`;
}

/** "Add to Google Calendar" link for one promo: an all-day event over the days the code works. */
export function googleCalendarLink(view: PromoView, options: ExportOptions) {
  const { description } = eventDetails(view, options);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: eventSummary(view, options.locale),
    dates: `${compact(view.startsOn)}/${compact(addDays(view.endsOn, 1))}`,
    details: description,
    location: "NISE COMPORT, Kharangajhar, Telco, Jamshedpur, Jharkhand",
    ctz: "Asia/Kolkata",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** Google Calendar "subscribe" link for the whole feed (stays up to date). */
export function googleSubscribeLink(feedUrl: string) {
  return `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(feedUrl.replace(/^https?:/, "webcal:"))}`;
}

function icsEscape(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

const encoder = new TextEncoder();

/** Folds a content line at 75 octets without splitting a character (RFC 5545 §3.1). */
export function foldIcsLine(line: string) {
  if (encoder.encode(line).length <= 75) return line;
  const parts: string[] = [];
  let current = "";
  let size = 0;
  for (const char of line) {
    const bytes = encoder.encode(char).length;
    const limit = parts.length ? 74 : 75;
    if (size + bytes > limit) { parts.push(current); current = ""; size = 0; }
    current += char;
    size += bytes;
  }
  parts.push(current);
  return parts.join("\r\n ");
}

export function promoIcs(views: PromoView[], options: ExportOptions) {
  const now = options.now ?? new Date();
  const stamp = `${now.toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`;
  const host = new URL(options.siteUrl).hostname;
  const lines = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//NISE COMPORT//Offers calendar//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    "X-WR-CALNAME:NISE COMPORT offers",
    `X-WR-CALDESC:${icsEscape("Festival and Team India promo codes at NISE COMPORT, Kharangajhar, Telco, Jamshedpur.")}`,
    "X-WR-TIMEZONE:Asia/Kolkata", "REFRESH-INTERVAL;VALUE=DURATION:P1D", "X-PUBLISHED-TTL:P1D",
  ];
  for (const view of views) {
    const { description } = eventDetails(view, options);
    lines.push(
      "BEGIN:VEVENT",
      `UID:${(view.eventKey ?? view.code).toLowerCase()}@${host}`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${compact(view.startsOn)}`,
      `DTEND;VALUE=DATE:${compact(addDays(view.endsOn, 1))}`,
      `SUMMARY:${icsEscape(eventSummary(view, options.locale))}`,
      `DESCRIPTION:${icsEscape(description)}`,
      `URL:${options.siteUrl}/offers#${view.code}`,
      `LOCATION:${icsEscape("NISE COMPORT, Kharangajhar, Telco, Jamshedpur")}`,
      `CATEGORIES:${view.kind === "sport" ? "Sports" : "Festival"}`,
      "TRANSP:TRANSPARENT",
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return `${lines.map(foldIcsLine).join("\r\n")}\r\n`;
}

function csvCell(value: string | number) {
  const text = String(value);
  // Neutralise spreadsheet formulas (CSV injection) and quote when needed.
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, "\"\"")}"` : safe;
}

export const CSV_HEADERS: Record<Locale, string[]> = {
  en: ["Code", "Offer", "Type", "For", "Discount", "Minimum order (₹)", "Valid from", "Valid till", "Event starts", "Event ends", "Dates confirmed", "Status", "Link"],
  hi: ["कोड", "ऑफ़र", "प्रकार", "किसके लिए", "छूट", "न्यूनतम ऑर्डर (₹)", "कब से", "कब तक", "आयोजन शुरू", "आयोजन समाप्त", "तारीख़ पक्की", "स्थिति", "लिंक"],
  bn: ["কোড", "অফার", "ধরন", "কাদের জন্য", "ছাড়", "ন্যূনতম অর্ডার (₹)", "কবে থেকে", "কবে পর্যন্ত", "শুরু", "শেষ", "তারিখ নিশ্চিত", "অবস্থা", "লিংক"],
};

const KIND_LABEL: Record<PromoView["kind"], Text3> = {
  festival: { en: "Festival", hi: "त्योहार", bn: "উৎসব" },
  sport: { en: "Sports", hi: "खेल", bn: "খেলা" },
  public: { en: "Offer", hi: "ऑफ़र", bn: "অফার" },
  welcome: { en: "Welcome", hi: "वेलकम", bn: "ওয়েলকাম" },
};

const STATUS_LABEL: Record<"live" | "upcoming" | "ended", Text3> = {
  live: { en: "Live now", hi: "अभी लाइव", bn: "এখন লাইভ" },
  upcoming: { en: "Coming soon", hi: "जल्द आ रहा है", bn: "শিগগির আসছে" },
  ended: { en: "Ended", hi: "समाप्त", bn: "শেষ" },
};

const YES_NO: Record<Locale, [string, string]> = { en: ["Yes", "Not yet"], hi: ["हाँ", "अभी नहीं"], bn: ["হ্যাঁ", "এখনও না"] };

/** Spreadsheet rows (UTF-8 CSV). Works with Google Sheets =IMPORTDATA(url) and Excel. */
export function promoCsv(views: PromoView[], options: ExportOptions & { communityLabel?: (community: string, locale: Locale) => string }) {
  const locale = options.locale ?? "en";
  const today = istDate(options.now ?? new Date());
  const rows = [CSV_HEADERS[locale]];
  for (const view of views) {
    const text = promoText(view, locale);
    const status = today < view.startsOn ? "upcoming" : today > view.endsOn ? "ended" : "live";
    rows.push([
      view.code, text.name, KIND_LABEL[view.kind][locale],
      view.communities.map((community) => options.communityLabel?.(community, locale) ?? community).join(" · "),
      text.highlight, String(view.minimum), view.startsOn, view.endsOn, view.eventStarts ?? "", view.eventEnds ?? "",
      view.tentative ? YES_NO[locale][1] : YES_NO[locale][0], STATUS_LABEL[status][locale], `${options.siteUrl}/offers#${view.code}`,
    ]);
  }
  return `${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}\r\n`;
}
