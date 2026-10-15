/**
 * WhatsApp campaign wording in English, Hindi and Bengali, message rendering and reply handling.
 * Plain module (no imports) so it can be unit-tested and used in the browser.
 *
 * Wording rules (Insurance Act s.41 / IRDAI): never promise a discount, rebate or "lowest price"
 * on an insurance premium. The ₹50 codes reduce NISE COMPORT's own service charge only.
 */
export type Lang = "en" | "hi" | "bn";
export type Text3 = Record<Lang, string>;
export type CampaignKind = "renewal" | "offer" | "optin";

export const CAMPAIGN_KINDS: Record<CampaignKind, { label: string; detail: string }> = {
  renewal: { label: "Renewal reminder", detail: "Existing customers whose policy or service is due. Goes to everyone who hasn’t said STOP." },
  offer: { label: "Offer / promotion", detail: "Advertising. Goes only to people who replied YES to receive offers." },
  optin: { label: "Ask permission (YES/STOP)", detail: "One message asking if they want offers and reminders. Goes only to people never asked before." },
};

export const CAMPAIGN_SERVICES = ["insurance", "pan", "voter-id", "residence", "income-caste", "aadhaar", "ayushman", "passport", "driving-licence", "itr", "banking", "education", "print", "other"] as const;

/** Default message text per campaign kind. Placeholders: {name} {code} {service} {date} {shop} {phone}. */
export const DEFAULT_MESSAGES: Record<CampaignKind, Text3> = {
  renewal: {
    en: "Namaste {name} 🙏 Your {service} renewal is due{date}. Renew with NISE COMPORT, Kharangajhar, Telco: we compare plans and do the paperwork for you.{code} Reply here or call {phone}.",
    hi: "नमस्ते {name} 🙏 आपके {service} का रिन्यूअल{date} है। NISE COMPORT, खरंगाझार, टेल्को में रिन्यू कराएँ: हम प्लान की तुलना और सारी कागज़ी कार्यवाही करते हैं।{code} यहीं जवाब दें या {phone} पर कॉल करें।",
    bn: "নমস্কার {name} 🙏 আপনার {service} রিনিউ করার সময়{date}। NISE COMPORT, খরংঝাড়, টেলকোতে রিনিউ করান: আমরা প্ল্যান তুলনা করে সব কাগজপত্র করে দিই।{code} এখানে উত্তর দিন বা {phone}-এ ফোন করুন।",
  },
  offer: {
    en: "Namaste {name} 🎉 Festive offer at NISE COMPORT, Telco:{code} Insurance, PAN, certificates, bills and printing, all under one roof. Reply here or call {phone}.",
    hi: "नमस्ते {name} 🎉 NISE COMPORT, टेल्को में त्योहार ऑफ़र:{code} बीमा, पैन, प्रमाणपत्र, बिल और प्रिंटिंग, सब एक जगह। यहीं जवाब दें या {phone} पर कॉल करें।",
    bn: "নমস্কার {name} 🎉 NISE COMPORT, টেলকোতে উৎসবের অফার:{code} বিমা, প্যান, সার্টিফিকেট, বিল আর প্রিন্টিং, সব এক জায়গায়। এখানে উত্তর দিন বা {phone}-এ ফোন করুন।",
  },
  optin: {
    en: "Namaste {name} 🙏 This is NISE COMPORT, Kharangajhar, Telco. May we send you renewal reminders and festival offers on WhatsApp? Reply YES to agree or STOP to never hear from us.",
    hi: "नमस्ते {name} 🙏 हम NISE COMPORT, खरंगाझार, टेल्को से हैं। क्या हम आपको व्हाट्सऐप पर रिन्यूअल रिमाइंडर और त्योहार ऑफ़र भेज सकते हैं? हाँ के लिए YES लिखें, मना करने के लिए STOP लिखें।",
    bn: "নমস্কার {name} 🙏 আমরা NISE COMPORT, খরংঝাড়, টেলকো থেকে বলছি। হোয়াটসঅ্যাপে রিনিউয়ালের রিমাইন্ডার আর উৎসবের অফার পাঠাতে পারি? রাজি হলে YES, না চাইলে STOP লিখুন।",
  },
};

export const SERVICE_NAMES: Record<string, Text3> = {
  insurance: { en: "vehicle insurance", hi: "वाहन बीमा", bn: "গাড়ির বিমা" },
  pan: { en: "PAN card", hi: "पैन कार्ड", bn: "প্যান কার্ড" },
  "voter-id": { en: "voter ID", hi: "वोटर आईडी", bn: "ভোটার আইডি" },
  residence: { en: "residence certificate", hi: "निवास प्रमाण पत्र", bn: "বাসস্থান সার্টিফিকেট" },
  "income-caste": { en: "income / caste certificate", hi: "आय / जाति प्रमाण पत्र", bn: "আয় / জাতি সার্টিফিকেট" },
  aadhaar: { en: "Aadhaar update", hi: "आधार अपडेट", bn: "আধার আপডেট" },
  ayushman: { en: "Ayushman card", hi: "आयुष्मान कार्ड", bn: "আয়ুষ্মান কার্ড" },
  passport: { en: "passport", hi: "पासपोर्ट", bn: "পাসপোর্ট" },
  "driving-licence": { en: "driving licence", hi: "ड्राइविंग लाइसेंस", bn: "ড্রাইভিং লাইসেন্স" },
  itr: { en: "income tax return", hi: "आयकर रिटर्न (ITR)", bn: "আয়কর রিটার্ন (ITR)" },
  banking: { en: "banking service", hi: "बैंकिंग सेवा", bn: "ব্যাংকিং পরিষেবা" },
  education: { en: "form", hi: "फ़ॉर्म", bn: "ফর্ম" },
  print: { en: "printing", hi: "प्रिंटिंग", bn: "প্রিন্টিং" },
  other: { en: "service", hi: "सेवा", bn: "পরিষেবা" },
};

/** Added to every message that isn't itself the YES/STOP question. */
/** English service name for admin lists, e.g. "Vehicle insurance". */
export function serviceTitle(service: string) {
  const name = SERVICE_NAMES[service]?.en ?? service;
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export const STOP_FOOTER: Text3 = {
  en: "Reply STOP to stop these messages.",
  hi: "ये संदेश बंद करने के लिए STOP लिखें।",
  bn: "এই বার্তা বন্ধ করতে STOP লিখুন।",
};

const CODE_LINE: Text3 = {
  en: " Use code {code} for ₹50 off our service charge.",
  hi: " कोड {code} से हमारे सेवा शुल्क में ₹50 की छूट।",
  bn: " কোড {code} দিলে আমাদের সার্ভিস চার্জে ₹50 ছাড়।",
};

const DATE_LINE: Text3 = { en: " on {date}", hi: " {date} को", bn: " {date}-এ" };
const FRIEND: Text3 = { en: "ji", hi: "जी", bn: "" };

export function isLang(value: unknown): value is Lang {
  return value === "en" || value === "hi" || value === "bn";
}

function dateLabel(isoDate: string, lang: Lang) {
  const tag = lang === "hi" ? "hi-IN" : lang === "bn" ? "bn-IN" : "en-IN";
  return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString(tag, { day: "numeric", month: "long", timeZone: "UTC", numberingSystem: "latn" });
}

/** Fills a message for one person. Unknown placeholders are left out cleanly. */
export function renderMessage(template: string, input: { lang: Lang; kind: CampaignKind; name?: string | null; service?: string | null; code?: string | null; renewalOn?: string | null; phone: string }) {
  const { lang } = input;
  const first = (input.name ?? "").trim().split(/\s+/)[0] ?? "";
  const service = SERVICE_NAMES[input.service ?? "other"]?.[lang] ?? SERVICE_NAMES.other[lang];
  const values: Record<string, string> = {
    name: first ? `${first}${lang === "en" ? "" : ` ${FRIEND[lang]}`}`.trim() : FRIEND[lang] || "",
    service,
    code: input.code ? CODE_LINE[lang].replace("{code}", input.code) : "",
    date: input.renewalOn ? DATE_LINE[lang].replace("{date}", dateLabel(input.renewalOn, lang)) : "",
    shop: "NISE COMPORT",
    phone: input.phone,
  };
  let text = template.replace(/\{(name|service|code|date|shop|phone)\}/g, (_, key: string) => values[key] ?? "");
  text = text.replace(/[ \t]{2,}/g, " ").replace(/ ([,.।!?])/g, "$1").trim();
  if (input.kind !== "optin") text = `${text}\n\n${STOP_FOOTER[lang]}`;
  return text;
}

/** "Open in WhatsApp" link with the message typed in (for one-tap manual sending). */
export function whatsappLink(phoneE164: string, text: string) {
  return `https://wa.me/${phoneE164.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}

const STOP_WORDS = ["stop", "unsubscribe", "stop all", "no", "cancel", "band", "bandh", "बंद", "रोकें", "नहीं", "বন্ধ", "না", "থামুন"];
const YES_WORDS = ["yes", "haan", "han", "start", "हाँ", "हां", "হ্যাঁ", "হ্যা"];

/** What a customer's reply means for their consent. */
export function classifyReply(text: string): "stop" | "yes" | null {
  const clean = text.normalize("NFC").toLowerCase().replace(/[^\p{L}\p{M}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
  if (!clean) return null;
  if (STOP_WORDS.includes(clean)) return "stop";
  if (YES_WORDS.includes(clean)) return "yes";
  return null;
}

/** Which contacts a campaign may message (consent rules). */
export function consentAllows(kind: CampaignKind, consent: string) {
  if (consent === "opted_out") return false;
  if (kind === "offer") return consent === "opted_in";
  if (kind === "optin") return consent === "unknown";
  return true;
}
