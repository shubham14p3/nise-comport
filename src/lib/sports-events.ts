/**
 * Sporting events where India plays, turned into promo codes the same way as festivals: the code
 * goes live 30 days before the first match and stays valid until the final.
 *
 * Dates were checked on 30 Sep 2026 against Wikipedia, ICC, BCCI, Hockey India, AIFF and news
 * reports. `tentative: true` marks events whose dates the organisers haven't announced yet; the
 * site says "dates to be confirmed" on those, and the owner can correct them in Admin →
 * Promotions (an edited promotion is locked so the daily sync doesn't overwrite it).
 *
 * Codes avoid tournament trademarks (IPL, Olympic, ICC…) so they read as the shop's own offer;
 * the event is named in the banner text only, as a description.
 *
 * This file only imports types so it can be unit-tested with plain Node.
 */
import { addDays, FESTIVAL_PROMO, istDate, type Community, type EventPromo, type FestivalTheme, type PromoSettings, type Text3 } from "./festivals.ts";

export type SportEvent = {
  key: string;
  /** Family used for grouping and filters, e.g. "ipl", "cricket-world-cup". */
  family: string;
  code: string;
  names: Text3;
  blurb: Text3;
  emoji: string;
  theme: FestivalTheme;
  start: string;
  end: string;
  tentative?: boolean;
  communities?: Community[];
  categories?: string[];
};

export const SPORT_EVENTS: SportEvent[] = [
  {
    key: "asian-games-2026", family: "asian-games", code: "ASIAD26", emoji: "🏅", theme: "games", start: "2026-09-19", end: "2026-10-04",
    names: { en: "Asian Games 2026", hi: "एशियाई खेल 2026", bn: "এশিয়ান গেমস 2026" },
    blurb: { en: "Cheer for Team India in Aichi-Nagoya", hi: "आइची-नागोया में टीम इंडिया का हौसला बढ़ाएँ", bn: "আইচি-নাগোয়ায় টিম ইন্ডিয়াকে উৎসাহ দিন" },
  },
  {
    key: "asian-para-games-2026", family: "asian-para-games", code: "PARAASIAD26", emoji: "🦾", theme: "games", start: "2026-10-18", end: "2026-10-24",
    names: { en: "Asian Para Games 2026", hi: "एशियाई पैरा खेल 2026", bn: "এশিয়ান প্যারা গেমস 2026" },
    blurb: { en: "Cheer for India’s para athletes", hi: "भारत के पैरा खिलाड़ियों का हौसला बढ़ाएँ", bn: "ভারতের প্যারা অ্যাথলিটদের উৎসাহ দিন" },
  },
  {
    key: "india-tour-nz-2026", family: "india-tours", code: "INDVNZ26", emoji: "🏏", theme: "cricket", start: "2026-10-22", end: "2026-11-27",
    names: { en: "India tour of New Zealand", hi: "भारत का न्यूज़ीलैंड दौरा", bn: "ভারতের নিউজিল্যান্ড সফর" },
    blurb: { en: "2 Tests, 5 ODIs & 5 T20Is · 100 years of India–NZ cricket", hi: "2 टेस्ट, 5 वनडे और 5 टी20 · भारत-न्यूज़ीलैंड क्रिकेट के 100 साल", bn: "2 টেস্ট, 5 ওয়ানডে ও 5 টি-টোয়েন্টি · ভারত-নিউজিল্যান্ড ক্রিকেটের 100 বছর" },
  },
  {
    key: "hockey-asian-champions-2026", family: "hockey", code: "HOCKEY26", emoji: "🏑", theme: "hockey", start: "2026-10-27", end: "2026-11-05",
    names: { en: "Asian Champions Trophy (hockey)", hi: "एशियन चैंपियंस ट्रॉफी (हॉकी)", bn: "এশিয়ান চ্যাম্পিয়ন্স ট্রফি (হকি)" },
    blurb: { en: "India hosts in Mohali & Jalandhar", hi: "मोहाली और जालंधर में भारत मेज़बान", bn: "মোহালি ও জলন্ধরে আয়োজক ভারত" },
  },
  {
    key: "saff-championship-2026", family: "football", code: "KICKOFF26", emoji: "⚽", theme: "football", start: "2026-11-05", end: "2026-11-17", tentative: true,
    names: { en: "SAFF Championship 2026 (football)", hi: "सैफ़ चैंपियनशिप 2026 (फ़ुटबॉल)", bn: "সাফ চ্যাম্পিয়নশিপ 2026 (ফুটবল)" },
    blurb: { en: "India defend their title in Bangladesh", hi: "बांग्लादेश में भारत अपना ख़िताब बचाने उतरेगा", bn: "বাংলাদেশে শিরোপা ধরে রাখতে নামছে ভারত" },
  },
  {
    key: "world-chess-championship-2026", family: "chess", code: "CHECKMATE26", emoji: "♟️", theme: "chess", start: "2026-11-24", end: "2026-12-12",
    names: { en: "World Chess Championship 2026", hi: "विश्व शतरंज चैंपियनशिप 2026", bn: "বিশ্ব দাবা চ্যাম্পিয়নশিপ 2026" },
    blurb: { en: "India’s world champion defends the crown", hi: "भारत के विश्व चैंपियन ख़िताब बचाने उतरेंगे", bn: "খেতাব রক্ষায় নামছেন ভারতের বিশ্বচ্যাম্পিয়ন" },
  },
  {
    key: "pro-kabaddi-13", family: "kabaddi", code: "KABADDI26", emoji: "🤼", theme: "kabaddi", start: "2026-12-25", end: "2027-02-28", tentative: true,
    names: { en: "Pro Kabaddi League season 13", hi: "प्रो कबड्डी लीग सीज़न 13", bn: "প্রো কাবাডি লিগ সিজন 13" },
    blurb: { en: "Raid season is back", hi: "रेड का मौसम लौट आया", bn: "রেডের মরসুম ফিরে এল" },
  },
  {
    key: "wpl-2027", family: "wpl", code: "SHEPOWER27", emoji: "🏏", theme: "cricket", start: "2027-01-14", end: "2027-02-07",
    names: { en: "Women’s Premier League 2027", hi: "महिला प्रीमियर लीग 2027", bn: "উইমেন্স প্রিমিয়ার লিগ 2027" },
    blurb: { en: "India’s women’s T20 league", hi: "भारत की महिला टी20 लीग", bn: "ভারতের মহিলা টি-টোয়েন্টি লিগ" },
  },
  {
    key: "border-gavaskar-2027", family: "india-tours", code: "INDVAUS27", emoji: "🏏", theme: "cricket", start: "2027-01-21", end: "2027-03-03",
    names: { en: "Border–Gavaskar Trophy 2027", hi: "बॉर्डर-गावस्कर ट्रॉफी 2027", bn: "বর্ডার-গাভাসকর ট্রফি 2027" },
    blurb: { en: "Five home Tests against Australia, one in Ranchi", hi: "ऑस्ट्रेलिया से घर में 5 टेस्ट, एक रांची में", bn: "অস্ট্রেলিয়ার বিরুদ্ধে দেশে 5 টেস্ট, একটি রাঁচিতে" },
  },
  {
    key: "hockey-pro-league-2027", family: "hockey", code: "HOCKEY27", emoji: "🏑", theme: "hockey", start: "2027-02-13", end: "2027-02-28",
    names: { en: "FIH Pro League: India at home", hi: "FIH प्रो लीग: भारत के घरेलू मैच", bn: "FIH প্রো লিগ: ভারতের ঘরের ম্যাচ" },
    blurb: { en: "India’s men and women play at home", hi: "भारत की पुरुष और महिला टीमें घर में खेलेंगी", bn: "ভারতের পুরুষ ও মহিলা দল খেলবে দেশের মাটিতে" },
  },
  {
    key: "womens-champions-trophy-2027", family: "womens-cricket", code: "SHECHAMPS27", emoji: "🏆", theme: "cricket", start: "2027-02-14", end: "2027-02-28",
    names: { en: "Women’s Champions Trophy 2027", hi: "महिला चैंपियंस ट्रॉफी 2027", bn: "মহিলা চ্যাম্পিয়ন্স ট্রফি 2027" },
    blurb: { en: "The first edition, hosted by India", hi: "पहला संस्करण, मेज़बान भारत", bn: "প্রথম আসর, আয়োজক ভারত" },
  },
  {
    key: "ipl-2027", family: "ipl", code: "T20FEVER27", emoji: "🏏", theme: "cricket", start: "2027-03-10", end: "2027-05-15", tentative: true,
    names: { en: "IPL 2027", hi: "आईपीएल 2027", bn: "আইপিএল 2027" },
    blurb: { en: "Two months of T20 cricket", hi: "दो महीने का टी20 रोमांच", bn: "দুমাসের টি-টোয়েন্টি উত্তেজনা" },
  },
  {
    key: "asia-cup-2027", family: "asia-cup", code: "ASIACRIC27", emoji: "🏏", theme: "cricket", start: "2027-06-18", end: "2027-07-04", tentative: true,
    names: { en: "Asia Cup 2027 (cricket)", hi: "एशिया कप 2027 (क्रिकेट)", bn: "এশিয়া কাপ 2027 (ক্রিকেট)" },
    blurb: { en: "The 50-over Asia Cup in Bangladesh", hi: "बांग्लादेश में 50 ओवर का एशिया कप", bn: "বাংলাদেশে 50 ওভারের এশিয়া কাপ" },
  },
  {
    key: "cricket-world-cup-2027", family: "cricket-world-cup", code: "WORLDCUP27", emoji: "🏆", theme: "cricket", start: "2027-10-04", end: "2027-11-21",
    names: { en: "Cricket World Cup 2027", hi: "क्रिकेट विश्व कप 2027", bn: "ক্রিকেট বিশ্বকাপ 2027" },
    blurb: { en: "Team India in South Africa, Zimbabwe & Namibia", hi: "दक्षिण अफ़्रीका, ज़िम्बाब्वे और नामीबिया में टीम इंडिया", bn: "দক্ষিণ আফ্রিকা, জিম্বাবোয়ে ও নামিবিয়ায় টিম ইন্ডিয়া" },
  },
  {
    key: "wpl-2028", family: "wpl", code: "SHEPOWER28", emoji: "🏏", theme: "cricket", start: "2028-01-14", end: "2028-02-07", tentative: true,
    names: { en: "Women’s Premier League 2028", hi: "महिला प्रीमियर लीग 2028", bn: "উইমেন্স প্রিমিয়ার লিগ 2028" },
    blurb: { en: "India’s women’s T20 league", hi: "भारत की महिला टी20 लीग", bn: "ভারতের মহিলা টি-টোয়েন্টি লিগ" },
  },
  {
    key: "ipl-2028", family: "ipl", code: "T20FEVER28", emoji: "🏏", theme: "cricket", start: "2028-03-15", end: "2028-05-28", tentative: true,
    names: { en: "IPL 2028", hi: "आईपीएल 2028", bn: "আইপিএল 2028" },
    blurb: { en: "Two months of T20 cricket", hi: "दो महीने का टी20 रोमांच", bn: "দুমাসের টি-টোয়েন্টি উত্তেজনা" },
  },
  {
    key: "la-2028-games", family: "summer-games", code: "TEAMINDIA28", emoji: "🏅", theme: "games", start: "2028-07-12", end: "2028-07-30",
    names: { en: "LA 2028 Olympics", hi: "लॉस एंजेलिस ओलंपिक 2028", bn: "লস অ্যাঞ্জেলেস অলিম্পিক 2028" },
    blurb: { en: "Cricket is back at the Games. Cheer for India!", hi: "खेलों में क्रिकेट की वापसी। भारत का हौसला बढ़ाएँ!", bn: "গেমসে ক্রিকেট ফিরছে। ভারতকে উৎসাহ দিন!" },
  },
  {
    key: "la-2028-para", family: "summer-games", code: "PARA28", emoji: "🦾", theme: "games", start: "2028-08-15", end: "2028-08-27",
    names: { en: "LA 2028 Paralympics", hi: "लॉस एंजेलिस पैरालंपिक 2028", bn: "লস অ্যাঞ্জেলেস প্যারালিম্পিক 2028" },
    blurb: { en: "Cheer for India’s para athletes", hi: "भारत के पैरा खिलाड़ियों का हौसला बढ़ाएँ", bn: "ভারতের প্যারা অ্যাথলিটদের উৎসাহ দিন" },
  },
  {
    key: "t20-world-cup-2028", family: "t20-world-cup", code: "T20WORLD28", emoji: "🏆", theme: "cricket", start: "2028-10-15", end: "2028-11-12", tentative: true,
    names: { en: "Men’s T20 World Cup 2028", hi: "पुरुष टी20 विश्व कप 2028", bn: "পুরুষদের টি-টোয়েন্টি বিশ্বকাপ 2028" },
    blurb: { en: "Team India in Australia & New Zealand", hi: "ऑस्ट्रेलिया और न्यूज़ीलैंड में टीम इंडिया", bn: "অস্ট্রেলিয়া ও নিউজিল্যান্ডে টিম ইন্ডিয়া" },
  },
];

/** Sports codes for events that haven't finished and start within the horizon. */
export function sportPromos(now = new Date(), settings: PromoSettings = FESTIVAL_PROMO, events: SportEvent[] = SPORT_EVENTS): EventPromo[] {
  const today = istDate(now);
  const horizon = addDays(today, settings.horizonDays);
  return events
    .filter((event) => event.end >= today && event.start <= horizon)
    .map((event) => ({
      kind: "sport" as const,
      eventKey: event.family,
      key: event.key,
      code: event.code,
      eventStarts: event.start,
      eventEnds: event.end,
      startsOn: addDays(event.start, -settings.leadDays),
      endsOn: event.end,
      discount: settings.discount,
      minimum: settings.minimum,
      perUserLimit: settings.perUserLimit,
      names: event.names,
      blurb: event.blurb,
      emoji: event.emoji,
      theme: event.theme,
      communities: event.communities ?? ["sports"],
      ...(event.categories ? { categories: event.categories } : {}),
      ...(event.tentative ? { tentative: true } : {}),
      source: "curated" as const,
    }));
}
