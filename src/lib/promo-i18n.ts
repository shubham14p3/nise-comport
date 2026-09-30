/**
 * Interface text for festival / sports promo codes, the offers page, the promo-code field and
 * vouchers, in English, Hindi and Bengali. Plain module (no imports) so it can be tested.
 */
type Locale = "en" | "hi" | "bn";

const en = {
  live: "Live now", code: "Code", copy: "Copy code", copied: "Copied!", useNow: "Use it now", useOnPrint: "Use on a print order",
  addToCalendar: "Add to Google Calendar", calendarShort: "Google Calendar", validTill: "Valid till {date}", unlocks: "Unlocks {date}",
  daysLeft: "{n} days left", lastDay: "Last day today!",
  festivalOn: "Festival day: {date}", matches: "Matches: {from} – {to}", minOrder: "On orders of ₹{min}+", oneUse: "One use per customer",
  tentative: "Dates to be confirmed",
  kicker: "Festival & Team India offers",
  heroA: "A code for every festival,", heroB: "every big match.",
  heroLead: "Hindu, Bengali, Punjabi, Christian, Muslim, Jharkhand and other regional festivals, plus every big tournament Team India plays. Each code is worth ₹50 and goes live a month before the day.",
  statLive: "codes live today", statAhead: "festivals & matches ahead", statTill: "calendar runs to December",
  welcomeKicker: "New here?", welcomeTitle: "₹50 welcome coupon", welcomeText: "Create your free account and verify your email. Your personal ₹50 coupon appears in Profile → Vouchers straight away.",
  welcomeCta: "Sign up free", welcomeHave: "See my vouchers",
  liveTitle: "Use these codes today", liveSub: "Type the code at the last step of any request or print order. Soonest-ending first.",
  calendarTitle: "Offer calendar", calendarSub: "Every festival and match until December 2028. Codes unlock 30 days before the day and end on the day (or on the final).",
  all: "All", festivals: "Festivals", sports: "Team India & sports", empty: "Nothing in this list yet.", showMore: "Show all {n}",
  exportTitle: "Take the offers with you", exportSub: "Keep every code in your own calendar or spreadsheet. Both update themselves when new offers are added.",
  gcalTitle: "Google Calendar", gcalText: "Subscribe once and every code shows up on the days it works.", gcalCta: "Subscribe in Google Calendar", icsCta: "Download .ics (Apple, Outlook)",
  sheetsTitle: "Google Sheets", sheetsText: "Paste this formula into cell A1 of a new sheet:", sheetsOpen: "Open a new Google Sheet", csvCta: "Download CSV (Excel)", copyFormula: "Copy formula",
  alwaysOn: "Always-on offers", rules: "Codes reduce our service charge or print bill only, never government fees or an insurer’s premium.",
  how1: "Pick a code", how1Text: "Copy it, or tap “Use it now” and it is filled in for you.",
  how2: "Finish a request", how2Text: "Enter it at the last step. We check it straight away.",
  how3: "Save ₹50", how3Text: "Print orders get it off the total; services get it off our charge when we bill you.",
  promoLabel: "Promo code", promoOptional: "optional", promoPlaceholder: "e.g. DIWALI26", apply: "Apply", remove: "Remove", checking: "Checking…",
  promoSaved: "{code} saved: {amount} off our service charge (when it is ₹{min} or more), taken off when we bill you.",
  promoPrint: "{code}: {amount} off this order.", promoSuggest: "Live codes:", yourCoupon: "Your coupon",
  promoLater: "We’ll check the code when you send the request.", promoNotApplied: "Code not applied:", promoAppliedDone: "Code {code} is saved with your request.",
  vouchersTitle: "Vouchers & offers", vouchersText: "Your own coupons and the codes live today. Each code can be used once.",
  personal: "Your welcome coupon", used: "Used", expires: "Expires {date}", liveCodes: "Festival & match codes live now", seeCalendar: "See the full offer calendar",
  noVouchers: "No codes right now", noVouchersText: "New festival and match codes appear here a month before the day.",
  signupGift: "Verify your email and get a ₹50 welcome coupon.",
  welcomeDone: "Welcome aboard! 🎉", welcomeDoneText: "Your ₹50 welcome coupon is ready. Use it on any request or print order of ₹{min} or more before {date}.",
  continue: "Continue",
};

export type PromoDictionary = typeof en;

const hi: PromoDictionary = {
  live: "अभी लाइव", code: "कोड", copy: "कोड कॉपी करें", copied: "कॉपी हो गया!", useNow: "अभी इस्तेमाल करें", useOnPrint: "प्रिंट ऑर्डर पर इस्तेमाल करें",
  addToCalendar: "Google कैलेंडर में जोड़ें", calendarShort: "Google कैलेंडर", validTill: "{date} तक मान्य", unlocks: "{date} से शुरू",
  daysLeft: "{n} दिन बाकी", lastDay: "आज आख़िरी दिन!",
  festivalOn: "त्योहार: {date}", matches: "मैच: {from} – {to}", minOrder: "₹{min}+ के ऑर्डर पर", oneUse: "प्रति ग्राहक एक बार",
  tentative: "तारीख़ें अभी तय नहीं",
  kicker: "त्योहार और टीम इंडिया ऑफ़र",
  heroA: "हर त्योहार का कोड,", heroB: "हर बड़े मैच का कोड।",
  heroLead: "हिन्दू, बंगाली, पंजाबी, ईसाई, मुस्लिम, झारखंड और दूसरे राज्यों के त्योहार, साथ में टीम इंडिया का हर बड़ा टूर्नामेंट। हर कोड ₹50 का है और त्योहार से एक महीना पहले शुरू हो जाता है।",
  statLive: "कोड आज लाइव", statAhead: "त्योहार और मैच आगे", statTill: "दिसंबर तक का कैलेंडर",
  welcomeKicker: "नए हैं?", welcomeTitle: "₹50 का वेलकम कूपन", welcomeText: "मुफ़्त खाता बनाएँ और ईमेल वेरिफ़ाई करें। ₹50 का आपका निजी कूपन तुरंत प्रोफ़ाइल → वाउचर में दिखेगा।",
  welcomeCta: "मुफ़्त साइन अप", welcomeHave: "मेरे वाउचर देखें",
  liveTitle: "आज ये कोड इस्तेमाल करें", liveSub: "किसी भी अनुरोध या प्रिंट ऑर्डर के आख़िरी स्टेप पर कोड डालें। जल्दी ख़त्म होने वाले पहले।",
  calendarTitle: "ऑफ़र कैलेंडर", calendarSub: "दिसंबर 2028 तक हर त्योहार और मैच। कोड 30 दिन पहले खुलता है और त्योहार के दिन (या फ़ाइनल पर) ख़त्म होता है।",
  all: "सभी", festivals: "त्योहार", sports: "टीम इंडिया व खेल", empty: "इस सूची में अभी कुछ नहीं।", showMore: "सभी {n} देखें",
  exportTitle: "ऑफ़र अपने साथ रखें", exportSub: "हर कोड अपने कैलेंडर या स्प्रेडशीट में रखें। नए ऑफ़र जुड़ने पर दोनों अपने-आप अपडेट होते हैं।",
  gcalTitle: "Google कैलेंडर", gcalText: "एक बार सब्सक्राइब करें, हर कोड सही दिनों पर दिखेगा।", gcalCta: "Google कैलेंडर में सब्सक्राइब करें", icsCta: ".ics डाउनलोड (Apple, Outlook)",
  sheetsTitle: "Google शीट्स", sheetsText: "नई शीट के A1 सेल में यह फ़ॉर्मूला पेस्ट करें:", sheetsOpen: "नई Google शीट खोलें", csvCta: "CSV डाउनलोड (Excel)", copyFormula: "फ़ॉर्मूला कॉपी करें",
  alwaysOn: "हमेशा चलने वाले ऑफ़र", rules: "कोड केवल हमारे सेवा शुल्क या प्रिंट बिल पर छूट देते हैं, सरकारी शुल्क या बीमा प्रीमियम पर कभी नहीं।",
  how1: "कोड चुनें", how1Text: "कॉपी करें, या “अभी इस्तेमाल करें” दबाएँ, कोड अपने-आप भर जाएगा।",
  how2: "अनुरोध पूरा करें", how2Text: "आख़िरी स्टेप पर कोड डालें। हम तुरंत जाँच लेते हैं।",
  how3: "₹50 बचाएँ", how3Text: "प्रिंट ऑर्डर के बिल से तुरंत; सेवाओं में बिल बनाते समय हमारे शुल्क से।",
  promoLabel: "प्रोमो कोड", promoOptional: "वैकल्पिक", promoPlaceholder: "जैसे DIWALI26", apply: "लगाएँ", remove: "हटाएँ", checking: "जाँच हो रही है…",
  promoSaved: "{code} सहेजा गया: हमारे सेवा शुल्क में {amount} (शुल्क ₹{min} या अधिक होने पर), बिल बनाते समय घटेगा।",
  promoPrint: "{code}: इस ऑर्डर पर {amount}।", promoSuggest: "लाइव कोड:", yourCoupon: "आपका कूपन",
  promoLater: "अनुरोध भेजते समय हम कोड जाँच लेंगे।", promoNotApplied: "कोड नहीं लगा:", promoAppliedDone: "कोड {code} आपके अनुरोध के साथ सहेजा गया।",
  vouchersTitle: "वाउचर और ऑफ़र", vouchersText: "आपके अपने कूपन और आज के लाइव कोड। हर कोड एक बार इस्तेमाल होता है।",
  personal: "आपका वेलकम कूपन", used: "इस्तेमाल हो चुका", expires: "{date} तक", liveCodes: "अभी लाइव त्योहार और मैच कोड", seeCalendar: "पूरा ऑफ़र कैलेंडर देखें",
  noVouchers: "अभी कोई कोड नहीं", noVouchersText: "नए त्योहार और मैच कोड एक महीना पहले यहाँ दिखेंगे।",
  signupGift: "ईमेल वेरिफ़ाई करें और ₹50 का वेलकम कूपन पाएँ।",
  welcomeDone: "स्वागत है! 🎉", welcomeDoneText: "आपका ₹50 का वेलकम कूपन तैयार है। {date} से पहले ₹{min} या अधिक के किसी भी अनुरोध या प्रिंट ऑर्डर पर इस्तेमाल करें।",
  continue: "आगे बढ़ें",
};

const bn: PromoDictionary = {
  live: "এখন লাইভ", code: "কোড", copy: "কোড কপি করুন", copied: "কপি হয়েছে!", useNow: "এখনই ব্যবহার করুন", useOnPrint: "প্রিন্ট অর্ডারে ব্যবহার করুন",
  addToCalendar: "Google ক্যালেন্ডারে যোগ করুন", calendarShort: "Google ক্যালেন্ডার", validTill: "{date} পর্যন্ত বৈধ", unlocks: "{date} থেকে শুরু",
  daysLeft: "আর {n} দিন", lastDay: "আজই শেষ দিন!",
  festivalOn: "উৎসব: {date}", matches: "খেলা: {from} – {to}", minOrder: "₹{min}+ অর্ডারে", oneUse: "প্রতি গ্রাহক একবার",
  tentative: "তারিখ এখনও নিশ্চিত নয়",
  kicker: "উৎসব ও টিম ইন্ডিয়া অফার",
  heroA: "প্রতিটি উৎসবের কোড,", heroB: "প্রতিটি বড় ম্যাচের কোড।",
  heroLead: "হিন্দু, বাঙালি, পাঞ্জাবি, খ্রিস্টান, মুসলিম, ঝাড়খণ্ড ও অন্যান্য রাজ্যের উৎসব, সঙ্গে টিম ইন্ডিয়ার প্রতিটি বড় টুর্নামেন্ট। প্রতিটি কোড ₹50-এর, উৎসবের এক মাস আগে চালু হয়।",
  statLive: "কোড আজ লাইভ", statAhead: "উৎসব ও ম্যাচ সামনে", statTill: "ডিসেম্বর পর্যন্ত ক্যালেন্ডার",
  welcomeKicker: "নতুন?", welcomeTitle: "₹50-এর ওয়েলকাম কুপন", welcomeText: "বিনামূল্যে অ্যাকাউন্ট খুলে ইমেল ভেরিফাই করুন। ₹50-এর ব্যক্তিগত কুপন সঙ্গে সঙ্গে প্রোফাইল → ভাউচারে দেখা যাবে।",
  welcomeCta: "বিনামূল্যে সাইন আপ", welcomeHave: "আমার ভাউচার দেখুন",
  liveTitle: "আজ এই কোডগুলো ব্যবহার করুন", liveSub: "যেকোনো অনুরোধ বা প্রিন্ট অর্ডারের শেষ ধাপে কোড দিন। যেগুলো আগে শেষ হবে সেগুলো আগে।",
  calendarTitle: "অফার ক্যালেন্ডার", calendarSub: "ডিসেম্বর 2028 পর্যন্ত প্রতিটি উৎসব ও ম্যাচ। কোড 30 দিন আগে চালু হয়, উৎসবের দিন (বা ফাইনালে) শেষ হয়।",
  all: "সব", festivals: "উৎসব", sports: "টিম ইন্ডিয়া ও খেলা", empty: "এই তালিকায় এখনও কিছু নেই।", showMore: "সব {n}টি দেখুন",
  exportTitle: "অফার সঙ্গে রাখুন", exportSub: "প্রতিটি কোড নিজের ক্যালেন্ডার বা স্প্রেডশিটে রাখুন। নতুন অফার যোগ হলে দুটোই নিজে থেকে আপডেট হয়।",
  gcalTitle: "Google ক্যালেন্ডার", gcalText: "একবার সাবস্ক্রাইব করুন, প্রতিটি কোড সঠিক দিনে দেখা যাবে।", gcalCta: "Google ক্যালেন্ডারে সাবস্ক্রাইব করুন", icsCta: ".ics ডাউনলোড (Apple, Outlook)",
  sheetsTitle: "Google শিট", sheetsText: "নতুন শিটের A1 ঘরে এই ফর্মুলা পেস্ট করুন:", sheetsOpen: "নতুন Google শিট খুলুন", csvCta: "CSV ডাউনলোড (Excel)", copyFormula: "ফর্মুলা কপি করুন",
  alwaysOn: "সবসময়ের অফার", rules: "কোড শুধু আমাদের সার্ভিস চার্জ বা প্রিন্টের বিলে ছাড় দেয়, সরকারি ফি বা বিমার প্রিমিয়ামে কখনও নয়।",
  how1: "কোড বাছুন", how1Text: "কপি করুন, বা “এখনই ব্যবহার করুন” চাপুন, কোড নিজে থেকেই বসে যাবে।",
  how2: "অনুরোধ শেষ করুন", how2Text: "শেষ ধাপে কোড দিন। আমরা সঙ্গে সঙ্গে যাচাই করি।",
  how3: "₹50 বাঁচান", how3Text: "প্রিন্ট অর্ডারের বিল থেকে সরাসরি; পরিষেবায় বিল করার সময় আমাদের চার্জ থেকে।",
  promoLabel: "প্রোমো কোড", promoOptional: "ঐচ্ছিক", promoPlaceholder: "যেমন DIWALI26", apply: "প্রয়োগ", remove: "সরান", checking: "যাচাই হচ্ছে…",
  promoSaved: "{code} সংরক্ষিত: আমাদের সার্ভিস চার্জে {amount} (চার্জ ₹{min} বা বেশি হলে), বিল করার সময় কাটা হবে।",
  promoPrint: "{code}: এই অর্ডারে {amount}।", promoSuggest: "লাইভ কোড:", yourCoupon: "আপনার কুপন",
  promoLater: "অনুরোধ পাঠানোর সময় আমরা কোড যাচাই করব।", promoNotApplied: "কোড প্রয়োগ হয়নি:", promoAppliedDone: "কোড {code} আপনার অনুরোধের সঙ্গে সংরক্ষিত।",
  vouchersTitle: "ভাউচার ও অফার", vouchersText: "আপনার নিজের কুপন আর আজকের লাইভ কোড। প্রতিটি কোড একবার ব্যবহার করা যায়।",
  personal: "আপনার ওয়েলকাম কুপন", used: "ব্যবহৃত", expires: "{date} পর্যন্ত", liveCodes: "এখন লাইভ উৎসব ও ম্যাচ কোড", seeCalendar: "পুরো অফার ক্যালেন্ডার দেখুন",
  noVouchers: "এখন কোনো কোড নেই", noVouchersText: "নতুন উৎসব ও ম্যাচ কোড এক মাস আগে এখানে দেখা যাবে।",
  signupGift: "ইমেল ভেরিফাই করুন আর ₹50-এর ওয়েলকাম কুপন নিন।",
  welcomeDone: "স্বাগতম! 🎉", welcomeDoneText: "আপনার ₹50-এর ওয়েলকাম কুপন তৈরি। {date}-এর আগে ₹{min} বা বেশি যেকোনো অনুরোধ বা প্রিন্ট অর্ডারে ব্যবহার করুন।",
  continue: "এগিয়ে যান",
};

const PROMO_TEXT: Record<Locale, PromoDictionary> = { en, hi, bn };

export function promoDict(locale: Locale): PromoDictionary {
  return PROMO_TEXT[locale] ?? en;
}

/** "8 Nov", "8 Nov 2027" (year only when it isn't the current one), in the chosen language. */
export function shortDate(isoDate: string, locale: Locale, withYear?: boolean) {
  const tag = locale === "hi" ? "hi-IN" : locale === "bn" ? "bn-IN" : "en-IN";
  const date = new Date(`${isoDate}T00:00:00Z`);
  return date.toLocaleDateString(tag, { day: "numeric", month: "short", ...(withYear ? { year: "numeric" } : {}), timeZone: "UTC", numberingSystem: "latn" });
}

export function monthLabel(isoDate: string, locale: Locale) {
  const tag = locale === "hi" ? "hi-IN" : locale === "bn" ? "bn-IN" : "en-IN";
  return new Date(`${isoDate.slice(0, 7)}-01T00:00:00Z`).toLocaleDateString(tag, { month: "long", year: "numeric", timeZone: "UTC", numberingSystem: "latn" });
}
