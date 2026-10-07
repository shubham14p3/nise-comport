/**
 * Offers shown in the top ticker, on /offers, on the home page and beside every step of the
 * request, print and PAN flows (the blinking "LIVE" rail).
 *
 * HOW TO EDIT
 * - Set `active: false` to hide an offer everywhere without deleting it.
 * - `endsAt` (inclusive, India time) hides it automatically after that date.
 * - `categories` decides where the offer appears in the step flows ("all" = every flow).
 * - `firstTimeOnly` offers are checked on the server when a request is submitted: the customer
 *   must not have an earlier, non-cancelled request in the same category.
 * - Keep terms honest: an offer on OUR service charge must never be described as a discount on
 *   government fees or on an insurer's premium.
 *
 * Festival and sports promo codes come from the database (see promotions.ts / promo-view.ts) and
 * are merged in by passing them as `extra` to the helpers below.
 *
 * This file has no imports so it can be unit-tested with plain Node.
 */
export type Locale = "en" | "hi" | "bn";
export type Text = Record<Locale, string>;
export type OfferTone = "pink" | "saffron" | "green" | "violet" | "cyan";

export type Offer = {
  id: string;
  /** Services a promo code is limited to (see promo-scope.ts); absent = all. */
  appliesTo?: { categories: string[]; services: string[] } | null;
  validOn?: string | null;
  active: boolean;
  /** Big headline, e.g. "₹100 OFF". */
  highlight: Text;
  title: Text;
  /** One short line for the scrolling ticker. */
  ticker: Text;
  detail: Text;
  terms: Text;
  badge: "LIVE" | "NEW" | "FREE";
  tone: OfferTone;
  categories: string[] | "all";
  firstTimeOnly?: boolean;
  /** ISO dates (YYYY-MM-DD), India time, both inclusive. */
  startsAt?: string;
  endsAt?: string;
  /** Where "Claim" goes. */
  href: string;
  /** Festival / sports / welcome promotions: the code to type in, plus how to decorate the card. */
  code?: string;
  emoji?: string;
  theme?: string;
  kind?: "festival" | "sport" | "welcome" | "public";
  /** Festival day or first match (YYYY-MM-DD), for "Diwali is on 8 Nov" style labels. */
  eventDate?: string;
  tentative?: boolean;
};

export const offers: Offer[] = [
  {
    id: "first-insurance-100",
    active: true,
    highlight: { en: "₹100 OFF", hi: "₹100 की छूट", bn: "₹100 ছাড়" },
    title: { en: "Your first insurance with us", hi: "हमारे साथ आपका पहला बीमा", bn: "আমাদের সঙ্গে আপনার প্রথম বিমা" },
    ticker: { en: "₹100 off our service charge on your first insurance", hi: "पहले बीमा पर हमारे सेवा शुल्क में ₹100 की छूट", bn: "প্রথম বিমায় আমাদের সার্ভিস চার্জে ₹100 ছাড়" },
    detail: {
      en: "Bike, car, health or life: get ₹100 off NISE COMPORT’s service charge on your first insurance request.",
      hi: "बाइक, कार, हेल्थ या लाइफ: पहले बीमा अनुरोध पर NISE COMPORT के सेवा शुल्क में ₹100 की छूट।",
      bn: "বাইক, গাড়ি, হেলথ বা লাইফ: প্রথম বিমা অনুরোধে NISE COMPORT-এর সার্ভিস চার্জে ₹100 ছাড়।",
    },
    terms: {
      en: "One per customer, on the first insurance request from your account. Applies to our service charge only; it does not change the insurer’s premium.",
      hi: "प्रति ग्राहक एक बार, आपके खाते से पहले बीमा अनुरोध पर। केवल हमारे सेवा शुल्क पर लागू; बीमा कंपनी का प्रीमियम नहीं बदलता।",
      bn: "প্রতি গ্রাহক একবার, আপনার অ্যাকাউন্টের প্রথম বিমা অনুরোধে। শুধু আমাদের সার্ভিস চার্জে প্রযোজ্য; বিমা কোম্পানির প্রিমিয়াম বদলায় না।",
    },
    badge: "LIVE",
    tone: "pink",
    categories: ["insurance"],
    firstTimeOnly: true,
    endsAt: "2026-12-31",
    href: "/request?category=insurance&offer=first-insurance-100",
  },
  {
    id: "free-document-check",
    active: true,
    highlight: { en: "FREE", hi: "मुफ़्त", bn: "ফ্রি" },
    title: { en: "Document check before you visit", hi: "आने से पहले दस्तावेज़ जाँच", bn: "আসার আগে ডকুমেন্ট চেক" },
    ticker: { en: "Free document checklist on WhatsApp before you visit", hi: "आने से पहले व्हाट्सऐप पर मुफ़्त दस्तावेज़ सूची", bn: "আসার আগে হোয়াটসঅ্যাপে ফ্রি ডকুমেন্ট চেকলিস্ট" },
    detail: {
      en: "Send your request online and we confirm exactly what to bring, so you finish in one visit.",
      hi: "ऑनलाइन अनुरोध भेजें, हम बताएँगे क्या लाना है, ताकि एक ही बार में काम हो जाए।",
      bn: "অনলাইনে অনুরোধ পাঠান, কী আনতে হবে আমরা জানিয়ে দেব, যাতে একবারেই কাজ হয়ে যায়।",
    },
    terms: {
      en: "Guidance only. Official requirements are set by the relevant department or provider.",
      hi: "केवल मार्गदर्शन। आधिकारिक आवश्यकताएँ संबंधित विभाग या संस्था तय करती है।",
      bn: "শুধু পরামর্শ। সরকারি নিয়ম সংশ্লিষ্ট দপ্তর বা সংস্থা ঠিক করে।",
    },
    badge: "FREE",
    tone: "green",
    categories: "all",
    href: "/request",
  },
  {
    id: "welcome-50",
    active: true,
    highlight: { en: "₹50 WELCOME", hi: "₹50 वेलकम", bn: "₹50 ওয়েলকাম" },
    title: { en: "Coupon when you verify your account", hi: "खाता वेरिफ़ाई करने पर कूपन", bn: "অ্যাকাউন্ট ভেরিফাই করলেই কুপন" },
    ticker: { en: "Sign up & verify your email: ₹50 welcome coupon in your account", hi: "साइन अप करके ईमेल वेरिफ़ाई करें: खाते में ₹50 का वेलकम कूपन", bn: "সাইন আপ করে ইমেল ভেরিফাই করুন: অ্যাকাউন্টে ₹50-এর ওয়েলকাম কুপন" },
    detail: {
      en: "Create your free account and confirm the 6-digit email code. A personal ₹50 coupon appears under Profile → Vouchers straight away.",
      hi: "मुफ़्त खाता बनाएँ और ईमेल पर आया 6 अंकों का कोड डालें। ₹50 का निजी कूपन तुरंत प्रोफ़ाइल → वाउचर में दिखेगा।",
      bn: "বিনামূল্যে অ্যাকাউন্ট খুলে ইমেলের 6 সংখ্যার কোড দিন। ₹50-এর ব্যক্তিগত কুপন সঙ্গে সঙ্গে প্রোফাইল → ভাউচারে দেখা যাবে।",
    },
    terms: {
      en: "One per verified account. ₹50 off orders of ₹150 or more, valid 90 days. Applies to our service charge or print total only.",
      hi: "प्रति वेरिफ़ाइड खाता एक। ₹150 या अधिक के ऑर्डर पर ₹50 की छूट, 90 दिन तक मान्य। केवल हमारे सेवा शुल्क या प्रिंट बिल पर।",
      bn: "প্রতি ভেরিফায়েড অ্যাকাউন্টে একটি। ₹150 বা বেশি অর্ডারে ₹50 ছাড়, 90 দিন বৈধ। শুধু আমাদের সার্ভিস চার্জ বা প্রিন্টের বিলে।",
    },
    badge: "NEW",
    tone: "violet",
    categories: "all",
    kind: "welcome",
    href: "/signup",
  },
  {
    // EXAMPLE — confirm with the shop, then set active: true.
    id: "student-photo-resize",
    active: false,
    highlight: { en: "FREE", hi: "मुफ़्त", bn: "ফ্রি" },
    title: { en: "Photo & signature resize for exam forms", hi: "परीक्षा फॉर्म के लिए फोटो-सिग्नेचर रीसाइज़", bn: "পরীক্ষার ফর্মের জন্য ছবি ও সই রিসাইজ" },
    ticker: { en: "Students: free photo & signature resize with any exam form", hi: "छात्र: किसी भी परीक्षा फॉर्म के साथ फोटो-सिग्नेचर रीसाइज़ मुफ़्त", bn: "ছাত্রছাত্রী: যেকোনো পরীক্ষার ফর্মের সঙ্গে ছবি ও সই রিসাইজ ফ্রি" },
    detail: {
      en: "Filling an exam, admission or scholarship form with us? We resize your photo and signature to the portal’s size at no extra charge.",
      hi: "हमारे साथ परीक्षा, एडमिशन या स्कॉलरशिप फॉर्म भर रहे हैं? पोर्टल के साइज़ में फोटो-सिग्नेचर बिना अतिरिक्त शुल्क के।",
      bn: "আমাদের কাছে পরীক্ষা, ভর্তি বা স্কলারশিপ ফর্ম পূরণ করছেন? পোর্টালের মাপে ছবি ও সই কোনো অতিরিক্ত চার্জ ছাড়াই।",
    },
    terms: { en: "With a form-filling request only.", hi: "केवल फॉर्म भरने के अनुरोध के साथ।", bn: "শুধু ফর্ম পূরণের অনুরোধের সঙ্গে।" },
    badge: "NEW",
    tone: "violet",
    categories: ["education"],
    href: "/request?category=education&offer=student-photo-resize",
  },
  {
    // EXAMPLE — create the coupon code in the database first, then set active: true.
    id: "first-print-5",
    active: false,
    highlight: { en: "5 PAGES FREE", hi: "5 पेज मुफ़्त", bn: "5 পাতা ফ্রি" },
    title: { en: "Your first online print order", hi: "आपका पहला ऑनलाइन प्रिंट ऑर्डर", bn: "আপনার প্রথম অনলাইন প্রিন্ট অর্ডার" },
    ticker: { en: "First online print order: 5 B&W pages free with code FIRST5", hi: "पहला ऑनलाइन प्रिंट: कोड FIRST5 से 5 B&W पेज मुफ़्त", bn: "প্রথম অনলাইন প্রিন্ট: কোড FIRST5-এ 5টি সাদা-কালো পাতা ফ্রি" },
    detail: {
      en: "Upload from your phone, pick pages and collect from our counter. Use code FIRST5 at the review step.",
      hi: "फ़ोन से अपलोड करें, पेज चुनें और काउंटर से ले जाएँ। रिव्यू स्टेप पर कोड FIRST5 डालें।",
      bn: "ফোন থেকে আপলোড করুন, পাতা বাছুন আর কাউন্টার থেকে নিয়ে যান। রিভিউ ধাপে কোড FIRST5 দিন।",
    },
    terms: { en: "Black & white A4 only. One per customer.", hi: "केवल ब्लैक-एंड-व्हाइट A4। प्रति ग्राहक एक बार।", bn: "শুধু সাদা-কালো A4। প্রতি গ্রাহক একবার।" },
    badge: "NEW",
    tone: "cyan",
    categories: ["it-services", "print"],
    href: "/print",
  },
];

/** "YYYY-MM-DD" for a moment in India Standard Time. */
export function indiaDate(now: Date) {
  return new Date(now.getTime() + 5.5 * 3_600_000).toISOString().slice(0, 10);
}

export function isOfferLive(offer: Offer, now = new Date()) {
  if (!offer.active) return false;
  const today = indiaDate(now);
  if (offer.startsAt && today < offer.startsAt) return false;
  if (offer.endsAt && today > offer.endsAt) return false;
  return true;
}

export function liveOffers(now = new Date(), extra: Offer[] = []) {
  return [...offers, ...extra].filter((offer) => isOfferLive(offer, now));
}

/**
 * Offers for a step flow: category-specific first, then the ones that apply everywhere.
 * `extra` adds live festival/sports promo codes (already sorted, soonest-ending first).
 */
export function offersFor(category: string | null | undefined, now = new Date(), extra: Offer[] = []) {
  const live = liveOffers(now, extra);
  const specific = category ? live.filter((offer) => offer.categories !== "all" && offer.categories.includes(category)) : [];
  const codes = live.filter((offer) => offer.code && offer.categories === "all");
  const general = live.filter((offer) => !offer.code && offer.categories === "all");
  const rest = category ? [] : live.filter((offer) => offer.categories !== "all" && !specific.includes(offer));
  return [...specific, ...rest, ...codes, ...general];
}

export function findOffer(id: string | null | undefined) {
  return id ? offers.find((offer) => offer.id === id) : undefined;
}

export function offerAppliesTo(offer: Offer, category: string) {
  return offer.categories === "all" || offer.categories.includes(category);
}

/** Human date like "31 Dec" for "valid till" labels. */
export function offerEndsLabel(offer: Offer, locale: Locale = "en") {
  if (!offer.endsAt) return "";
  const date = new Date(`${offer.endsAt}T00:00:00Z`);
  const tag = locale === "hi" ? "hi-IN" : locale === "bn" ? "bn-IN" : "en-IN";
  return date.toLocaleDateString(tag, { day: "numeric", month: "short", timeZone: "UTC" });
}
