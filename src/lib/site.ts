/**
 * Single source of truth for the business identity (name, address, phone = "NAP").
 * Google ranks local businesses partly on NAP consistency, so every page, the footer,
 * the structured data and the Google Business Profile must use exactly these values.
 *
 * Values that only the owner can confirm (map pin, opening hours, social profiles) come
 * from environment variables and are simply omitted until they are set. Never guess them.
 */
import { parseOpeningHours, type OpeningHoursRule } from "./hours.ts";

function env(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function canonicalUrl() {
  const raw = env("NEXT_PUBLIC_SITE_URL") ?? "https://www.nisecomport.com";
  try {
    const url = new URL(raw);
    return `${url.protocol}//${url.host}`;
  } catch {
    return "https://www.nisecomport.com";
  }
}

function numberOrUndefined(value: string | undefined) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

const url = canonicalUrl();
const latitude = numberOrUndefined(env("NEXT_PUBLIC_GEO_LAT"));
const longitude = numberOrUndefined(env("NEXT_PUBLIC_GEO_LNG"));
const openingHoursText = env("NEXT_PUBLIC_OPENING_HOURS");
let openingHours: OpeningHoursRule[] = [];
try { openingHours = openingHoursText ? parseOpeningHours(openingHoursText) : []; } catch { openingHours = []; }

const whatsappPrimary = (env("NEXT_PUBLIC_WHATSAPP_PRIMARY") ?? "919771219893").replace(/\D/g, "");
const whatsappSecondary = (env("NEXT_PUBLIC_WHATSAPP_SECONDARY") ?? "919835552756").replace(/\D/g, "");

const street = "Ground Floor, Singh Building, Shop No-3, Hanuman Mandir Road";
const locality = "Kharangajhar, Telco Colony";
const mapsQuery = "NISE COMPORT, Ground Floor, Singh Building, Shop No-3, Hanuman Mandir Road, Kharangajhar, Telco Colony, Jamshedpur, Jharkhand 831004, India";

export const site = {
  name: "NISE COMPORT",
  alternateNames: ["NISE-COMPORT", "Nise Comport", "NiseComport", "NISE COMPORT Pragya Kendra", "Pragya Kendra Kharangajhar"],
  tagline: "A Move Towards Digital India e-Gov Services",
  shortDescription: "Independent CSC and Pragya Kendra service centre in Kharangajhar, Telco Colony, Jamshedpur.",
  description: "NISE COMPORT is an independent CSC / Pragya Kendra service centre in Kharangajhar, Telco Colony, Jamshedpur, Jharkhand. We help with PAN, Aadhaar guidance, Jharkhand certificates, voter services, banking (BC/AEPS), insurance, online forms, bill payments, printing and scanning.",
  url,
  locale: "en_IN",
  email: env("NEXT_PUBLIC_CONTACT_EMAIL") ?? "info@nisecomport.com",
  phones: {
    primary: { e164: "+919771219893", display: "+91 97712 19893" },
    secondary: { e164: "+919835552756", display: "+91 98355 52756" },
    landline: { e164: "+916572917622", display: "0657 291 7622" },
  },
  whatsapp: { primary: whatsappPrimary, secondary: whatsappSecondary },
  address: {
    street,
    locality,
    city: "Jamshedpur",
    district: "East Singhbhum",
    region: "Jharkhand",
    regionCode: "JH",
    postalCode: "831004",
    country: "IN",
    countryName: "India",
    lines: [`${street},`, `${locality},`, "Jamshedpur, Jharkhand 831004"],
    oneLine: `${street}, ${locality}, Jamshedpur, Jharkhand 831004`,
    hindi: "दुकान नंबर 3, भूतल, सिंह बिल्डिंग, हनुमान मंदिर रोड, खरंगाझार, टेल्को कॉलोनी, जमशेदपुर, झारखंड 831004",
  },
  geo: latitude !== undefined && longitude !== undefined ? { latitude, longitude } : null,
  /** Exact Google Business Profile link when set; otherwise a Maps search for the address. */
  mapsUrl: env("NEXT_PUBLIC_GOOGLE_MAPS_URL") ?? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`,
  mapsQuery,
  /** Link that opens the "write a review" box on Google, e.g. https://g.page/r/XXXX/review */
  reviewUrl: env("NEXT_PUBLIC_GOOGLE_REVIEW_URL"),
  openingHoursText,
  openingHours,
  /** Social and directory profiles of the business (Google Business Profile, Facebook, Justdial…). */
  sameAs: (env("NEXT_PUBLIC_SAME_AS") ?? "").split(",").map((item) => item.trim()).filter((item) => /^https:\/\//.test(item)),
  foundingYear: numberOrUndefined(env("NEXT_PUBLIC_FOUNDING_YEAR")),
  logoPath: "/images/logo/logo-footer.png",
  defaultOgImage: "/api/og?title=NISE%20COMPORT%20%E2%80%93%20CSC%20%26%20Pragya%20Kendra%20in%20Jamshedpur",
  languages: ["en-IN", "hi-IN"],
  areasServed: ["Kharangajhar", "Telco", "Govindpur", "Birsanagar", "Golmuri", "Bhalubasa", "Sakchi", "Mango", "Jugsalai", "Bistupur", "Sonari", "Kadma", "Adityapur", "Jamshedpur", "East Singhbhum", "Jharkhand"],
  verification: {
    google: env("GOOGLE_SITE_VERIFICATION"),
    bing: env("BING_SITE_VERIFICATION"),
    yandex: env("YANDEX_SITE_VERIFICATION"),
  },
} as const;

export function absoluteUrl(path = "/") {
  if (/^https?:\/\//.test(path)) return path;
  return `${site.url}${path.startsWith("/") ? path : `/${path}`}`.replace(/\/$/, "") || site.url;
}

export function whatsappLink(message?: string, number: string = site.whatsapp.primary) {
  return `https://wa.me/${number}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}

export function directionsFrom(origin: string) {
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(`${origin}, Jamshedpur, Jharkhand`)}&destination=${encodeURIComponent(site.mapsQuery)}`;
}
