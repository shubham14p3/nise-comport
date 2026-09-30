/**
 * Festival promotions.
 *
 * Every festival below becomes a promo code (e.g. DIWALI26) that goes live 30 days before the
 * festival and ends on the festival day. Sporting events are in sports-events.ts and both are
 * combined in promo-calendar.ts. Dates come from Google's public "Holidays in India"
 * calendar, refreshed daily by /api/cron/offers (see festival-calendar.ts). The `dates` listed
 * here are a checked fallback (Oct 2026 – Dec 2028) used when the feed is unreachable or doesn't
 * list a festival; a feed date replaces a fallback date only if it is within a week of it.
 *
 * Sources for the fallback dates: DoPT gazetted holidays, the Jharkhand holiday list and a
 * panchang calendar (dailycalendar.in). Regional or tithi-based days can differ by a day.
 *
 * This file has no imports so it can be unit-tested with plain Node and used by scripts.
 */
export type Lang = "en" | "hi" | "bn";
export type Text3 = Record<Lang, string>;
export type Community = "hindu" | "bengali" | "punjabi" | "christian" | "muslim" | "jharkhand" | "jain-buddhist" | "regional" | "national" | "sports";
export type FestivalTheme = "diya" | "puja" | "holi" | "harvest" | "sun" | "christmas" | "eid" | "sikh" | "peace" | "tricolour" | "devotion" | "spring" | "newyear"
  | "cricket" | "games" | "hockey" | "football" | "kabaddi" | "chess";

export type FestivalDef = {
  key: string;
  /** Code prefix; the two-digit year is added (DIWALI + 26). Letters only, max 12. */
  code: string;
  names: Text3;
  communities: Community[];
  emoji: string;
  theme: FestivalTheme;
  /** Patterns that identify this festival in the Google holiday feed (English titles). */
  match: RegExp[];
  /** Months (1–12) the festival can fall in; guards against e.g. Chaitra vs Sharad Navratri. */
  months?: number[];
  /** Checked fallback dates, YYYY-MM-DD, keyed by year. */
  dates: Record<number, string>;
  /** Service categories the offer suits best (for the step-flow rail); omitted = all. */
  categories?: string[];
};

export const COMMUNITY_LABELS: Record<Community, Text3> = {
  hindu: { en: "Hindu festivals", hi: "हिन्दू त्योहार", bn: "হিন্দু উৎসব" },
  bengali: { en: "Bengali", hi: "बंगाली", bn: "বাঙালি" },
  punjabi: { en: "Punjabi & Sikh", hi: "पंजाबी व सिख", bn: "পাঞ্জাবি ও শিখ" },
  christian: { en: "Christian", hi: "ईसाई", bn: "খ্রিস্টান" },
  muslim: { en: "Muslim", hi: "मुस्लिम", bn: "মুসলিম" },
  jharkhand: { en: "Jharkhand & tribal", hi: "झारखंड व आदिवासी", bn: "ঝাড়খণ্ড ও আদিবাসী" },
  "jain-buddhist": { en: "Jain & Buddhist", hi: "जैन व बौद्ध", bn: "জৈন ও বৌদ্ধ" },
  regional: { en: "Other regions", hi: "अन्य राज्य", bn: "অন্যান্য রাজ্য" },
  national: { en: "National", hi: "राष्ट्रीय", bn: "জাতীয়" },
  sports: { en: "Team India & sports", hi: "टीम इंडिया व खेल", bn: "টিম ইন্ডিয়া ও খেলা" },
};

export const FESTIVALS: FestivalDef[] = [
  { key: "navratri", code: "NAVRATRI", names: { en: "Navratri", hi: "नवरात्रि", bn: "নবরাত্রি" }, communities: ["hindu"], emoji: "🌺", theme: "puja", match: [/navratri|navaratri|sharad navratri/i], months: [9, 10], dates: { 2026: "2026-10-11", 2027: "2027-09-30", 2028: "2028-09-19" } },
  { key: "durga-puja", code: "DURGAPUJA", names: { en: "Durga Puja", hi: "दुर्गा पूजा", bn: "দুর্গাপূজা" }, communities: ["bengali", "hindu", "jharkhand"], emoji: "🔱", theme: "puja", match: [/maha ?ashtami|durga ashtami/i], months: [9, 10, 11], dates: { 2026: "2026-10-19", 2027: "2027-10-08", 2028: "2028-09-26" } },
  { key: "dussehra", code: "DUSSEHRA", names: { en: "Dussehra", hi: "दशहरा", bn: "বিজয়া দশমী" }, communities: ["hindu", "bengali"], emoji: "🏹", theme: "puja", match: [/dussehra|dasara|vijaya ?dashami/i], months: [9, 10, 11], dates: { 2026: "2026-10-20", 2027: "2027-10-09", 2028: "2028-09-27" } },
  { key: "lakshmi-puja", code: "LAKSHMI", names: { en: "Kojagari Lakshmi Puja", hi: "कोजागरी लक्ष्मी पूजा", bn: "কোজাগরী লক্ষ্মীপূজা" }, communities: ["bengali"], emoji: "🪷", theme: "diya", match: [/kojagari|lakshmi puja|sharad purnima/i], months: [10, 11], dates: { 2026: "2026-10-25", 2027: "2027-10-15", 2028: "2028-10-02" }, categories: ["banking", "fee-payments"] },
  { key: "karwa-chauth", code: "KARWA", names: { en: "Karwa Chauth", hi: "करवा चौथ", bn: "করওয়া চৌথ" }, communities: ["hindu", "punjabi"], emoji: "🌙", theme: "diya", match: [/karva chauth|karwa chauth/i], months: [10, 11], dates: { 2026: "2026-10-29", 2027: "2027-10-18", 2028: "2028-10-07" } },
  { key: "dhanteras", code: "DHANTERAS", names: { en: "Dhanteras", hi: "धनतेरस", bn: "ধনতেরাস" }, communities: ["hindu"], emoji: "🪙", theme: "diya", match: [/dhanteras|dhanatrayodashi/i], months: [10, 11], dates: { 2026: "2026-11-06", 2027: "2027-10-27", 2028: "2028-10-15" }, categories: ["banking", "insurance"] },
  { key: "diwali", code: "DIWALI", names: { en: "Diwali", hi: "दीपावली", bn: "দীপাবলি" }, communities: ["hindu", "jain-buddhist", "punjabi"], emoji: "🪔", theme: "diya", match: [/diwali|deepavali/i], months: [10, 11], dates: { 2026: "2026-11-08", 2027: "2027-10-29", 2028: "2028-10-17" } },
  { key: "kali-puja", code: "KALIPUJA", names: { en: "Kali Puja", hi: "काली पूजा", bn: "কালীপূজা" }, communities: ["bengali"], emoji: "🌺", theme: "puja", match: [/kali puja|shyama puja/i], months: [10, 11], dates: { 2026: "2026-11-08", 2027: "2027-10-29", 2028: "2028-10-17" } },
  { key: "sohrai", code: "SOHRAI", names: { en: "Sohrai", hi: "सोहराय", bn: "সোহরাই" }, communities: ["jharkhand"], emoji: "🐄", theme: "harvest", match: [/sohrai|govardhan puja/i], months: [10, 11], dates: { 2026: "2026-11-10", 2027: "2027-10-30", 2028: "2028-10-18" } },
  { key: "bhai-dooj", code: "BHAIDOOJ", names: { en: "Bhai Dooj", hi: "भाई दूज", bn: "ভাইফোঁটা" }, communities: ["hindu", "bengali"], emoji: "🎁", theme: "diya", match: [/bhai du?o?j|bhaiya dooj|bhai phonta|bhau beej/i], months: [10, 11], dates: { 2026: "2026-11-11", 2027: "2027-10-31", 2028: "2028-10-19" } },
  { key: "chhath", code: "CHHATH", names: { en: "Chhath Puja", hi: "छठ पूजा", bn: "ছট পূজা" }, communities: ["hindu", "jharkhand"], emoji: "🌅", theme: "sun", match: [/chhath|chhat puja|surya sashthi|pratihar/i], months: [10, 11], dates: { 2026: "2026-11-15", 2027: "2027-11-04", 2028: "2028-10-23" } },
  { key: "guru-nanak", code: "GURPURAB", names: { en: "Guru Nanak Jayanti", hi: "गुरु नानक जयंती", bn: "গুরু নানক জয়ন্তী" }, communities: ["punjabi"], emoji: "🙏", theme: "sikh", match: [/guru nanak/i], months: [10, 11, 12], dates: { 2026: "2026-11-24", 2027: "2027-11-14", 2028: "2028-11-02" } },
  { key: "christmas", code: "XMAS", names: { en: "Christmas", hi: "क्रिसमस", bn: "বড়দিন" }, communities: ["christian"], emoji: "🎄", theme: "christmas", match: [/christmas(?! eve)/i], months: [12], dates: { 2026: "2026-12-25", 2027: "2027-12-25", 2028: "2028-12-25" } },
  { key: "new-year", code: "NEWYEAR", names: { en: "New Year", hi: "नया साल", bn: "নতুন বছর" }, communities: ["national", "christian"], emoji: "🎉", theme: "newyear", match: [/new year'?s day/i], months: [1], dates: { 2027: "2027-01-01", 2028: "2028-01-01", 2029: "2029-01-01" } },
  { key: "lohri", code: "LOHRI", names: { en: "Lohri", hi: "लोहड़ी", bn: "লোহরি" }, communities: ["punjabi"], emoji: "🔥", theme: "harvest", match: [/lohri/i], months: [1], dates: { 2027: "2027-01-13", 2028: "2028-01-14" } },
  { key: "makar-sankranti", code: "SANKRANTI", names: { en: "Makar Sankranti & Tusu", hi: "मकर संक्रांति व टुसू पर्व", bn: "মকর সংক্রান্তি ও টুসু পরব" }, communities: ["hindu", "bengali", "jharkhand"], emoji: "🪁", theme: "harvest", match: [/makar sankranti|makara sankranti|tusu/i], months: [1], dates: { 2027: "2027-01-14", 2028: "2028-01-15" } },
  { key: "pongal-bihu", code: "PONGAL", names: { en: "Pongal & Magh Bihu", hi: "पोंगल व माघ बिहू", bn: "পোঙ্গল ও মাঘ বিহু" }, communities: ["regional"], emoji: "🍚", theme: "harvest", match: [/pongal|magh bihu|bhogali bihu/i], months: [1], dates: { 2027: "2027-01-15", 2028: "2028-01-15" } },
  { key: "republic-day", code: "REPUBLIC", names: { en: "Republic Day", hi: "गणतंत्र दिवस", bn: "প্রজাতন্ত্র দিবস" }, communities: ["national"], emoji: "🇮🇳", theme: "tricolour", match: [/republic day/i], months: [1], dates: { 2027: "2027-01-26", 2028: "2028-01-26" } },
  { key: "saraswati-puja", code: "SARASWATI", names: { en: "Saraswati Puja", hi: "सरस्वती पूजा (वसंत पंचमी)", bn: "সরস্বতী পূজা" }, communities: ["bengali", "hindu"], emoji: "📚", theme: "devotion", match: [/vasant panchami|basant panchami|saraswati puja|sri panchami/i], months: [1, 2], dates: { 2027: "2027-02-11", 2028: "2028-01-31" }, categories: ["education"] },
  { key: "maha-shivratri", code: "SHIVRATRI", names: { en: "Maha Shivratri", hi: "महाशिवरात्रि", bn: "মহাশিবরাত্রি" }, communities: ["hindu"], emoji: "🔱", theme: "devotion", match: [/shivaratri|shivratri/i], months: [2, 3], dates: { 2027: "2027-03-06", 2028: "2028-02-23" } },
  { key: "eid-ul-fitr", code: "EID", names: { en: "Eid-ul-Fitr", hi: "ईद-उल-फ़ित्र", bn: "ঈদ-উল-ফিতর" }, communities: ["muslim"], emoji: "🌙", theme: "eid", match: [/eid[- ]?ul[- ]?fit|id[- ]?ul[- ]?fit|ramzan id|ramadan eid/i], dates: { 2027: "2027-03-10", 2028: "2028-02-27" } },
  { key: "holi", code: "HOLI", names: { en: "Holi", hi: "होली", bn: "দোল ও হোলি" }, communities: ["hindu", "bengali"], emoji: "🎨", theme: "holi", match: [/^holi$|holi\b(?!ka)|dol ?jatra|dolyatra/i], months: [2, 3], dates: { 2027: "2027-03-22", 2028: "2028-03-11" } },
  { key: "easter", code: "EASTER", names: { en: "Easter", hi: "ईस्टर", bn: "ইস্টার" }, communities: ["christian"], emoji: "🐣", theme: "spring", match: [/easter (day|sunday)|^easter$/i], months: [3, 4], dates: { 2027: "2027-03-28", 2028: "2028-04-16" } },
  { key: "ugadi", code: "UGADI", names: { en: "Ugadi & Gudi Padwa", hi: "उगादी व गुड़ी पड़वा", bn: "উগাদি ও গুড়ি পাড়ওয়া" }, communities: ["regional"], emoji: "🌿", theme: "spring", match: [/ugadi|gudi padwa|chaitra sukhladi/i], months: [3, 4], dates: { 2027: "2027-04-07", 2028: "2028-03-27" } },
  { key: "sarhul", code: "SARHUL", names: { en: "Sarhul", hi: "सरहुल", bn: "সারহুল" }, communities: ["jharkhand"], emoji: "🌼", theme: "harvest", match: [/sarhul/i], months: [3, 4], dates: { 2027: "2027-04-09", 2028: "2028-03-29" } },
  { key: "baisakhi", code: "BAISAKHI", names: { en: "Baisakhi", hi: "बैसाखी", bn: "বৈশাখী" }, communities: ["punjabi"], emoji: "🌾", theme: "harvest", match: [/vaisakhi|baisakhi/i], months: [4], dates: { 2027: "2027-04-14", 2028: "2028-04-13" } },
  { key: "poila-boishakh", code: "BOISHAKH", names: { en: "Poila Boishakh (Bengali New Year)", hi: "पोइला बैशाख (बांग्ला नववर्ष)", bn: "পয়লা বৈশাখ" }, communities: ["bengali"], emoji: "🎊", theme: "newyear", match: [/poila (baisakh|boishakh)|pohela boishakh|bengali new year|naba ?barsha/i], months: [4], dates: { 2027: "2027-04-15", 2028: "2028-04-14" } },
  { key: "ram-navami", code: "RAMNAVAMI", names: { en: "Ram Navami", hi: "राम नवमी", bn: "রাম নবমী" }, communities: ["hindu"], emoji: "🏹", theme: "devotion", match: [/ram(a)? navami/i], months: [3, 4], dates: { 2027: "2027-04-15", 2028: "2028-04-03" } },
  { key: "mahavir-jayanti", code: "MAHAVIR", names: { en: "Mahavir Jayanti", hi: "महावीर जयंती", bn: "মহাবীর জয়ন্তী" }, communities: ["jain-buddhist"], emoji: "🕊️", theme: "peace", match: [/mahavir jayanti/i], months: [3, 4], dates: { 2027: "2027-04-19", 2028: "2028-04-07" } },
  { key: "hanuman-jayanti", code: "HANUMAN", names: { en: "Hanuman Jayanti", hi: "हनुमान जयंती", bn: "হনুমান জয়ন্তী" }, communities: ["hindu"], emoji: "🚩", theme: "devotion", match: [/hanuman jayanti/i], months: [3, 4], dates: { 2027: "2027-04-20", 2028: "2028-04-09" } },
  { key: "akshaya-tritiya", code: "AKSHAYA", names: { en: "Akshaya Tritiya", hi: "अक्षय तृतीया", bn: "অক্ষয় তৃতীয়া" }, communities: ["hindu", "jain-buddhist"], emoji: "✨", theme: "diya", match: [/akshaya tritiya|akha teej/i], months: [4, 5], dates: { 2027: "2027-05-09", 2028: "2028-04-27" }, categories: ["banking", "insurance"] },
  { key: "eid-al-adha", code: "BAKRID", names: { en: "Eid al-Adha (Bakrid)", hi: "ईद-उल-अज़हा (बकरीद)", bn: "ঈদ-উল-আযহা" }, communities: ["muslim"], emoji: "🌙", theme: "eid", match: [/bakri?d|eid[- ]?(ul|al)[- ]?(adha|zuha)|id[- ]?ul[- ]?zuha/i], dates: { 2027: "2027-05-17", 2028: "2028-05-05" } },
  { key: "buddha-purnima", code: "BUDDHA", names: { en: "Buddha Purnima", hi: "बुद्ध पूर्णिमा", bn: "বুদ্ধ পূর্ণিমা" }, communities: ["jain-buddhist"], emoji: "🪷", theme: "peace", match: [/buddha purnima|vesak/i], months: [4, 5, 6], dates: { 2027: "2027-05-20", 2028: "2028-05-08" } },
  { key: "jamai-sasthi", code: "JAMAI", names: { en: "Jamai Sasthi", hi: "जमाई षष्ठी", bn: "জামাইষষ্ঠী" }, communities: ["bengali"], emoji: "🍛", theme: "newyear", match: [/jamai ?sa?sthi|jamai shashthi/i], months: [5, 6], dates: { 2027: "2027-06-10", 2028: "2028-05-29" } },
  { key: "rath-yatra", code: "RATHYATRA", names: { en: "Rath Yatra", hi: "रथ यात्रा", bn: "রথযাত্রা" }, communities: ["hindu", "bengali", "regional"], emoji: "🛕", theme: "devotion", match: [/rath ?yatra|ratha ?yatra/i], months: [6, 7], dates: { 2027: "2027-07-05", 2028: "2028-06-24" } },
  { key: "independence-day", code: "AZADI", names: { en: "Independence Day", hi: "स्वतंत्रता दिवस", bn: "স্বাধীনতা দিবস" }, communities: ["national"], emoji: "🇮🇳", theme: "tricolour", match: [/independence day/i], months: [8], dates: { 2027: "2027-08-15", 2028: "2028-08-15" } },
  { key: "raksha-bandhan", code: "RAKHI", names: { en: "Raksha Bandhan", hi: "रक्षा बंधन", bn: "রাখী বন্ধন" }, communities: ["hindu"], emoji: "🎀", theme: "devotion", match: [/raksha ?bandhan|rakhi/i], months: [7, 8, 9], dates: { 2027: "2027-08-17", 2028: "2028-08-05" } },
  { key: "janmashtami", code: "JANMASHTAMI", names: { en: "Janmashtami", hi: "जन्माष्टमी", bn: "জন্মাষ্টমী" }, communities: ["hindu"], emoji: "🦚", theme: "devotion", match: [/janmashtami|janmastami/i], months: [8, 9], dates: { 2027: "2027-08-25", 2028: "2028-08-13" } },
  { key: "ganesh-chaturthi", code: "GANESHA", names: { en: "Ganesh Chaturthi", hi: "गणेश चतुर्थी", bn: "গণেশ চতুর্থী" }, communities: ["hindu", "regional"], emoji: "🐘", theme: "devotion", match: [/ganesh chaturthi|vinayaka? chaturthi|ganesha chaturthi/i], months: [8, 9], dates: { 2027: "2027-09-04", 2028: "2028-08-23" } },
  { key: "karma-puja", code: "KARMA", names: { en: "Karma Puja", hi: "करमा पूजा", bn: "করম পূজা" }, communities: ["jharkhand"], emoji: "🌳", theme: "harvest", match: [/karma puja|karam (puja|parab)/i], months: [8, 9, 10], dates: { 2027: "2027-09-11", 2028: "2028-08-30" } },
  { key: "onam", code: "ONAM", names: { en: "Onam", hi: "ओणम", bn: "ওণাম" }, communities: ["regional"], emoji: "🌸", theme: "harvest", match: [/onam|thiru ?onam/i], months: [8, 9], dates: { 2027: "2027-09-12", 2028: "2028-09-01" } },
  { key: "vishwakarma-puja", code: "VISHWAKARMA", names: { en: "Vishwakarma Puja", hi: "विश्वकर्मा पूजा", bn: "বিশ্বকর্মা পূজা" }, communities: ["jharkhand", "bengali", "hindu"], emoji: "⚙️", theme: "devotion", match: [/vishwakarma|viswakarma/i], months: [9], dates: { 2027: "2027-09-17", 2028: "2028-09-16" }, categories: ["it-services", "form-filing"] },
];

/** Promotion settings shared by every festival and sports code. */
export const FESTIVAL_PROMO = {
  /** Flat discount in rupees. */
  discount: 50,
  /** Minimum order / service charge for the code to apply. */
  minimum: 150,
  /** Days before the festival (or first match) that the code goes live. */
  leadDays: 30,
  /** How far ahead codes are created: to the end of 2028 from late 2026, then a rolling ~27 months. */
  horizonDays: 830,
  perUserLimit: 1,
};

export type PromoSettings = typeof FESTIVAL_PROMO;

export type FestivalOccurrence = { def: FestivalDef; date: string; source: "google" | "curated" };

/** One promo code for a festival or a sporting event. Dates are inclusive, India time (YYYY-MM-DD). */
export type EventPromo = {
  kind: "festival" | "sport";
  /** Festival or event family, e.g. "diwali", "ipl". */
  eventKey: string;
  /** Unique per occurrence, e.g. "diwali-2026", "ipl-2027" (stored as coupons.event_key). */
  key: string;
  code: string;
  /** Festival day, or the first day of a tournament. */
  eventStarts: string;
  /** Festival day, or the final. */
  eventEnds: string;
  startsOn: string;
  endsOn: string;
  discount: number;
  minimum: number;
  perUserLimit: number;
  names: Text3;
  blurb?: Text3;
  emoji: string;
  theme: FestivalTheme;
  communities: Community[];
  categories?: string[];
  /** Organisers haven't confirmed the dates yet. */
  tentative?: boolean;
  source: "google" | "curated";
};

const DAY = 86_400_000;

/** "YYYY-MM-DD" in India Standard Time. */
export function istDate(moment: Date) {
  return new Date(moment.getTime() + 5.5 * 3_600_000).toISOString().slice(0, 10);
}

/** Today's date in India. */
export function todayIst() {
  return istDate(new Date());
}

export function addDays(isoDate: string, days: number) {
  return new Date(Date.parse(`${isoDate}T00:00:00Z`) + days * DAY).toISOString().slice(0, 10);
}

/** Whole days from `from` to `to` (both YYYY-MM-DD). */
export function daysBetween(from: string, to: string) {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY);
}

/** Start and end of an India-time calendar day, as real instants. */
export function istDayStart(isoDate: string) { return new Date(Date.parse(`${isoDate}T00:00:00+05:30`)); }
export function istDayEnd(isoDate: string) { return new Date(Date.parse(`${isoDate}T23:59:59.999+05:30`)); }

/**
 * Combines fallback dates with dates found in the online calendar. The feed date closest to the
 * fallback wins when it is within 7 days of it (so a mis-matched title can't move a festival by
 * months); years without a fallback date use the feed alone.
 */
export function mergeOccurrences(feed: { key: string; date: string }[], defs: FestivalDef[] = FESTIVALS): FestivalOccurrence[] {
  const out: FestivalOccurrence[] = [];
  for (const def of defs) {
    const fromFeed = feed.filter((item) => item.key === def.key);
    const years = new Set<number>([...Object.keys(def.dates).map(Number), ...fromFeed.map((item) => Number(item.date.slice(0, 4)))]);
    for (const year of [...years].sort()) {
      const curated = def.dates[year];
      const feedDates = [...new Set(fromFeed.filter((item) => item.date.startsWith(`${year}-`)).map((item) => item.date))].sort();
      if (curated) {
        const near = feedDates
          .map((date) => ({ date, gap: Math.abs(daysBetween(curated, date)) }))
          .filter((item) => item.gap <= 7)
          .sort((a, b) => a.gap - b.gap || a.date.localeCompare(b.date))[0]?.date;
        out.push({ def, date: near ?? curated, source: near ? "google" : "curated" });
      } else if (feedDates.length) {
        out.push({ def, date: feedDates[0], source: "google" });
      }
    }
  }
  return out.sort((a, b) => a.date.localeCompare(b.date) || a.def.key.localeCompare(b.def.key));
}

/** Turns festival days into promo codes for festivals from today up to the horizon. */
export function festivalPromos(occurrences: FestivalOccurrence[], now = new Date(), settings: PromoSettings = FESTIVAL_PROMO): EventPromo[] {
  const today = istDate(now);
  const horizon = addDays(today, settings.horizonDays);
  return occurrences
    .filter((occurrence) => occurrence.date >= today && occurrence.date <= horizon)
    .map(({ def, date, source }) => ({
      kind: "festival" as const,
      eventKey: def.key,
      key: `${def.key}-${date.slice(0, 4)}`,
      code: `${def.code}${date.slice(2, 4)}`,
      eventStarts: date,
      eventEnds: date,
      startsOn: addDays(date, -settings.leadDays),
      endsOn: date,
      discount: settings.discount,
      minimum: settings.minimum,
      perUserLimit: settings.perUserLimit,
      names: def.names,
      emoji: def.emoji,
      theme: def.theme,
      communities: def.communities,
      ...(def.categories ? { categories: def.categories } : {}),
      source,
    }));
}

export function findFestival(key: string) {
  return FESTIVALS.find((def) => def.key === key);
}
