/**
 * Birthdays and insurance renewals: reading dates out of registers, working out who is due,
 * card templates and the wording of wishes and reminders in English, Hindi and Bengali.
 *
 * Plain module (no database) so it runs in tests and in the browser.
 *
 * Wording rule (Insurance Act s.41 / IRDAI): reminders never promise a premium discount or "lowest price".
 */
import type { Birth, Vehicle } from "./record-import.ts";

export type Lang = "en" | "hi" | "bn";
export type Text3 = Record<Lang, string>;

// ---------------------------------------------------------------------------------------------
// Reading registers
// ---------------------------------------------------------------------------------------------

export { birthFromFields, birthFromText, vehicleFrom, type Birth, type Vehicle } from "./record-import.ts";

// ---------------------------------------------------------------------------------------------
// Dates (India time)
// ---------------------------------------------------------------------------------------------

/** Today's date in India as yyyy-mm-dd. */
export function istToday(now = new Date()) { return new Date(now.getTime() + 5.5 * 3_600_000).toISOString().slice(0, 10); }

function isLeap(year: number) { return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0; }

/** Days from `today` until the next birthday (0 = today). 29 February is celebrated on 28 February in other years. */
export function daysUntilBirthday(birth: Birth, today: string) {
  const [year, month, day] = today.split("-").map(Number);
  const on = (y: number) => Date.UTC(y, birth.month - 1, birth.month === 2 && birth.day === 29 && !isLeap(y) ? 28 : birth.day);
  const now = Date.UTC(year, month - 1, day);
  let target = on(year);
  if (target < now) target = on(year + 1);
  return Math.round((target - now) / 86_400_000);
}

export function addDays(iso: string, days: number) { return new Date(Date.parse(`${iso}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10); }
export function daysBetween(fromIso: string, toIso: string) { return Math.round((Date.parse(`${toIso}T00:00:00Z`) - Date.parse(`${fromIso}T00:00:00Z`)) / 86_400_000); }

export function birthdayLabel(birth: Birth, lang: Lang = "en") {
  const tag = lang === "hi" ? "hi-IN" : lang === "bn" ? "bn-IN" : "en-IN";
  return new Date(Date.UTC(2024, birth.month - 1, birth.day)).toLocaleDateString(tag, { day: "numeric", month: "long", timeZone: "UTC", numberingSystem: "latn" });
}

export function dateLabel(iso: string, lang: Lang = "en") {
  const tag = lang === "hi" ? "hi-IN" : lang === "bn" ? "bn-IN" : "en-IN";
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(tag, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC", numberingSystem: "latn" });
}

// ---------------------------------------------------------------------------------------------
// Templates (the built-in ones can be edited, deleted and added to in the admin area)
// ---------------------------------------------------------------------------------------------

/** A birthday card look plus the wording that goes with it: card text, WhatsApp text and email text, in three languages. */
export type BirthdayTemplate = {
  id: string; name: string;
  from: string; to: string; accent: string; ink: string; shape: string;
  title: Text3; line: Text3; signoff: Text3;
  whatsapp: Text3; email: Text3;
};
/** An insurance renewal reminder. Placeholders: {name} {vehicle} {date} {phone}. */
export type RenewalTemplate = { id: string; name: string; whatsapp: Text3; emailSubject: Text3; emailBody: Text3 };

const TITLE: Text3 = { en: "Happy Birthday", hi: "जन्मदिन मुबारक", bn: "শুভ জন্মদিন" };
const LINE: Text3 = { en: "Wishing you a year full of health, happiness and good things.", hi: "आपका नया साल सेहत, ख़ुशियों और अच्छी बातों से भरा रहे।", bn: "আপনার নতুন বছর সুস্বাস্থ্য, আনন্দ আর ভালো কিছুতে ভরে উঠুক।" };
const SIGNOFF: Text3 = { en: "With love from NISE COMPORT, Telco", hi: "प्यार के साथ, NISE COMPORT, टेल्को", bn: "ভালোবাসায়, NISE COMPORT, টেলকো" };
const WHATSAPP: Text3 = {
  en: "Happy Birthday {name}! 🎂 Wishing you a wonderful year ahead, from all of us at NISE COMPORT, Kharangajhar, Telco.",
  hi: "जन्मदिन मुबारक {name}! 🎂 NISE COMPORT, खरंगाझार, टेल्को की पूरी टीम की ओर से आपके नए साल की ढेर सारी शुभकामनाएँ।",
  bn: "শুভ জন্মদিন {name}! 🎂 NISE COMPORT, খরংঝাড়, টেলকোর পুরো টিমের পক্ষ থেকে নতুন বছরের অনেক শুভেচ্ছা।",
};
const EMAIL: Text3 = {
  en: "Everyone at NISE COMPORT, Kharangajhar, Telco, wishes you a very happy birthday and a year full of health and happiness.",
  hi: "NISE COMPORT, खरंगाझार, टेल्को की पूरी टीम आपको जन्मदिन की हार्दिक शुभकामनाएँ देती है। आपका नया साल सेहत और ख़ुशियों से भरा रहे।",
  bn: "NISE COMPORT, খরংঝাড়, টেলকোর সবাই আপনাকে জন্মদিনের আন্তরিক শুভেচ্ছা জানাচ্ছে। আপনার নতুন বছর সুস্বাস্থ্য আর আনন্দে ভরে উঠুক।",
};
const look = (id: string, name: string, from: string, to: string, accent: string, ink: string, shape: string): BirthdayTemplate => ({ id, name, from, to, accent, ink, shape, title: TITLE, line: LINE, signoff: SIGNOFF, whatsapp: WHATSAPP, email: EMAIL });

export const DEFAULT_BIRTHDAY_TEMPLATES: BirthdayTemplate[] = [
  look("confetti", "Confetti blue", "#0a7bf7", "#7c4dff", "#ffd23f", "#ffffff", "#ff3d8b"),
  look("sunrise", "Sunrise", "#ff7a18", "#ffb347", "#fff3c4", "#3b1a00", "#ff3d6e"),
  look("royal", "Royal night", "#1b1464", "#4b2a99", "#ffd700", "#ffffff", "#ff9bd2"),
  look("mint", "Fresh mint", "#0f9d8a", "#7be0a8", "#fffbe0", "#06312b", "#ffffff"),
  look("rose", "Rose", "#d6336c", "#ff8fab", "#fff0f5", "#ffffff", "#ffd23f"),
  look("festive", "Festive saffron", "#e8590c", "#d6336c", "#ffe066", "#ffffff", "#ffffff"),
];

export const DEFAULT_RENEWAL_TEMPLATES: RenewalTemplate[] = [{
  id: "standard", name: "Standard reminder",
  whatsapp: {
    en: "Namaste {name} 🙏 Your {vehicle} ends on {date}. Renew on time to avoid a gap in cover: NISE COMPORT, Kharangajhar, Telco, compares plans and does the paperwork. Reply here or call {phone}.",
    hi: "नमस्ते {name} 🙏 आपका {vehicle} {date} को ख़त्म हो रहा है। कवर में अंतर न आए, इसलिए समय पर रिन्यू कराएँ: NISE COMPORT, खरंगाझार, टेल्को प्लान की तुलना और कागज़ी काम करता है। यहीं जवाब दें या {phone} पर कॉल करें।",
    bn: "নমস্কার {name} 🙏 আপনার {vehicle} {date}-এ শেষ হচ্ছে। কভারে ফাঁক না থাকতে সময়মতো রিনিউ করান: NISE COMPORT, খরংঝাড়, টেলকো প্ল্যান তুলনা আর কাগজপত্রের কাজ করে। এখানেই উত্তর দিন বা {phone}-এ কল করুন।",
  },
  emailSubject: { en: "Your {vehicle} ends on {date}", hi: "आपका {vehicle} {date} को ख़त्म हो रहा है", bn: "আপনার {vehicle} {date}-এ শেষ হচ্ছে" },
  emailBody: {
    en: "Namaste {name}, your {vehicle} is due to end on {date}.\n\nRenewing before the end date keeps your cover continuous and, with most insurers, your No Claim Bonus. We compare plans and do the paperwork for you.\n\nReply to this email, WhatsApp us or call {phone}.",
    hi: "नमस्ते {name}, आपका {vehicle} {date} को ख़त्म होने वाला है।\n\nसमाप्ति तिथि से पहले रिन्यू कराने से कवर लगातार रहता है और ज़्यादातर बीमा कंपनियों में आपका नो क्लेम बोनस भी बना रहता है। प्लान की तुलना और कागज़ी काम हम करते हैं।\n\nइस ईमेल का जवाब दें, WhatsApp करें या {phone} पर कॉल करें।",
    bn: "নমস্কার {name}, আপনার {vehicle} {date}-এ শেষ হওয়ার কথা।\n\nশেষ তারিখের আগে রিনিউ করালে কভার অবিচ্ছিন্ন থাকে এবং বেশিরভাগ বিমা কোম্পানিতে নো ক্লেম বোনাসও থাকে। প্ল্যান তুলনা আর কাগজপত্রের কাজ আমরা করে দিই।\n\nএই ইমেলের উত্তর দিন, WhatsApp করুন বা {phone}-এ কল করুন।",
  },
}];

const HEX = /^#[0-9a-f]{6}$/i;
const text3 = (value: unknown, fallback: Text3, max: number): Text3 => {
  const input = (value && typeof value === "object" ? value : {}) as Partial<Record<Lang, unknown>>;
  const clean = (key: Lang) => (typeof input[key] === "string" && input[key].trim() ? input[key].replace(/\r\n?/g, "\n").trim().slice(0, max) : fallback[key]);
  return { en: clean("en"), hi: clean("hi"), bn: clean("bn") };
};
const slug = (value: unknown, fallback: string) => {
  const id = typeof value === "string" ? value.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 30) : "";
  return id || fallback;
};
const colour = (value: unknown, fallback: string) => (typeof value === "string" && HEX.test(value.trim()) ? value.trim().toLowerCase() : fallback);
const label = (value: unknown, fallback: string) => (typeof value === "string" && value.trim() ? value.replace(/\s+/g, " ").trim().slice(0, 40) : fallback);

/** Cleans a saved or submitted list of birthday templates (unique ids, valid colours, bounded text). Empty means the built-in ones. */
export function sanitizeBirthdayTemplates(value: unknown): BirthdayTemplate[] {
  if (!Array.isArray(value)) return DEFAULT_BIRTHDAY_TEMPLATES;
  const seen = new Set<string>();
  const out: BirthdayTemplate[] = [];
  for (const [index, raw] of value.slice(0, 20).entries()) {
    if (!raw || typeof raw !== "object") continue;
    const item = raw as Record<string, unknown>;
    let id = slug(item.id ?? item.name, `card-${index + 1}`);
    while (seen.has(id)) id = `${id.slice(0, 26)}-${index + 1}`;
    seen.add(id);
    const base = DEFAULT_BIRTHDAY_TEMPLATES[0];
    out.push({
      id, name: label(item.name, "New card"),
      from: colour(item.from, base.from), to: colour(item.to, base.to), accent: colour(item.accent, base.accent), ink: colour(item.ink, base.ink), shape: colour(item.shape, base.shape),
      title: text3(item.title, TITLE, 40), line: text3(item.line, LINE, 120), signoff: text3(item.signoff, SIGNOFF, 60),
      whatsapp: text3(item.whatsapp, WHATSAPP, 600), email: text3(item.email, EMAIL, 800),
    });
  }
  return out.length ? out : DEFAULT_BIRTHDAY_TEMPLATES;
}

export function sanitizeRenewalTemplates(value: unknown): RenewalTemplate[] {
  if (!Array.isArray(value)) return DEFAULT_RENEWAL_TEMPLATES;
  const base = DEFAULT_RENEWAL_TEMPLATES[0];
  const seen = new Set<string>();
  const out: RenewalTemplate[] = [];
  for (const [index, raw] of value.slice(0, 20).entries()) {
    if (!raw || typeof raw !== "object") continue;
    const item = raw as Record<string, unknown>;
    let id = slug(item.id ?? item.name, `reminder-${index + 1}`);
    while (seen.has(id)) id = `${id.slice(0, 26)}-${index + 1}`;
    seen.add(id);
    out.push({ id, name: label(item.name, "New reminder"), whatsapp: text3(item.whatsapp, base.whatsapp, 600), emailSubject: text3(item.emailSubject, base.emailSubject, 120), emailBody: text3(item.emailBody, base.emailBody, 1500) });
  }
  return out.length ? out : DEFAULT_RENEWAL_TEMPLATES;
}

export function pickBirthdayTemplate(list: BirthdayTemplate[], id: string | null | undefined) { return list.find((item) => item.id === id) ?? list[0] ?? DEFAULT_BIRTHDAY_TEMPLATES[0]; }
export function pickRenewalTemplate(list: RenewalTemplate[], id: string | null | undefined) { return list.find((item) => item.id === id) ?? list[0] ?? DEFAULT_RENEWAL_TEMPLATES[0]; }

const FRIEND: Text3 = { en: "", hi: "जी", bn: "" };
export function firstName(name: string) { return (name ?? "").trim().split(/\s+/)[0] ?? ""; }
function friendly(name: string, lang: Lang) { const first = firstName(name); return first ? `${first}${FRIEND[lang] ? ` ${FRIEND[lang]}` : ""}` : (lang === "hi" ? "मित्र" : lang === "bn" ? "বন্ধু" : "friend"); }

/** Fills {name} {vehicle} {date} {phone}; unknown placeholders are removed. */
export function fillText(template: string, values: Partial<Record<"name" | "vehicle" | "date" | "phone", string>>) {
  return template.replace(/\{(name|vehicle|date|phone)\}/g, (_, key: "name" | "vehicle" | "date" | "phone") => values[key] ?? "").replace(/[ \t]{2,}/g, " ").replace(/ ([,.।!?])/g, "$1");
}

/** Subject, heading and body of a birthday email. */
export function birthdayEmail(template: BirthdayTemplate, name: string, lang: Lang) {
  const who = friendly(name, lang);
  const subject = { en: `Happy Birthday, ${who}! 🎂`, hi: `जन्मदिन मुबारक, ${who}! 🎂`, bn: `শুভ জন্মদিন, ${who}! 🎂` }[lang];
  return { subject, heading: `${template.title[lang]}, ${who}!`, paragraphs: fillText(template.email[lang], { name: who }).split(/\n{2,}/).filter(Boolean) };
}

/** WhatsApp text of a birthday wish (the STOP line is added later by renderMessage, which fills {name}). */
export function birthdayWhatsApp(template: BirthdayTemplate, lang: Lang) { return template.whatsapp[lang]; }

export const VEHICLE_NAME: Record<Vehicle | "other", Text3> = {
  bike: { en: "bike insurance", hi: "बाइक बीमा", bn: "বাইকের বিমা" },
  car: { en: "car insurance", hi: "कार बीमा", bn: "গাড়ির বিমা" },
  other: { en: "vehicle insurance", hi: "वाहन बीमा", bn: "যানবাহনের বিমা" },
};

/** WhatsApp renewal text with the vehicle, date and phone filled in; {name} is left for renderMessage. */
export function renewalWhatsApp(template: RenewalTemplate, vehicle: Vehicle | null, endsOn: string, lang: Lang, phone: string) {
  return template.whatsapp[lang].replace(/\{name\}/g, "\u0000").replace(/\{(vehicle|date|phone)\}/g, (_, key: string) => ({ vehicle: VEHICLE_NAME[vehicle ?? "other"][lang], date: dateLabel(endsOn, lang), phone })[key] ?? "").replace(/\u0000/g, "{name}");
}

export function renewalEmail(template: RenewalTemplate, name: string, vehicle: Vehicle | null, endsOn: string, lang: Lang, phone: string) {
  const values = { name: friendly(name, lang), vehicle: VEHICLE_NAME[vehicle ?? "other"][lang], date: dateLabel(endsOn, lang), phone };
  return {
    subject: fillText(template.emailSubject[lang], values),
    heading: { en: "Time to renew", hi: "रिन्यू का समय", bn: "রিনিউয়ের সময়" }[lang],
    paragraphs: fillText(template.emailBody[lang], values).split(/\n{2,}/).filter(Boolean),
  };
}

// ---------------------------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------------------------

export type OutreachSettings = {
  birthday: { enabled: boolean; template: string; email: boolean; whatsapp: boolean };
  renewal: { enabled: boolean; template: string; daysBefore: number; email: boolean; whatsapp: boolean };
};

export const DEFAULT_SETTINGS: OutreachSettings = {
  birthday: { enabled: false, template: "confetti", email: true, whatsapp: true },
  renewal: { enabled: false, template: "standard", daysBefore: 7, email: true, whatsapp: true },
};

export function sanitizeSettings(value: unknown): OutreachSettings {
  const input = (value && typeof value === "object" ? value : {}) as Partial<Record<keyof OutreachSettings, Record<string, unknown>>>;
  const b = input.birthday ?? {}; const r = input.renewal ?? {};
  const days = Number(r.daysBefore);
  return {
    birthday: { enabled: b.enabled === true, template: slug(b.template, "confetti"), email: b.email !== false, whatsapp: b.whatsapp !== false },
    renewal: { enabled: r.enabled === true, template: slug(r.template, "standard"), daysBefore: Number.isFinite(days) ? Math.max(1, Math.min(45, Math.round(days))) : 7, email: r.email !== false, whatsapp: r.whatsapp !== false },
  };
}

/** Caption to paste under the card on Instagram or a WhatsApp status. */
export function instagramCaption(name: string, lang: Lang) {
  const first = firstName(name);
  return {
    en: `🎂 Happy Birthday${first ? ` ${first}` : ""}! Wishing you a year full of health and happiness. — Team NISE COMPORT, Telco, Jamshedpur #HappyBirthday #Jamshedpur #Telco #NISECOMPORT`,
    hi: `🎂 जन्मदिन मुबारक${first ? ` ${first}` : ""}! आपका नया साल सेहत और ख़ुशियों से भरा रहे। — टीम NISE COMPORT, टेल्को, जमशेदपुर #जन्मदिन #जमशेदपुर #Telco #NISECOMPORT`,
    bn: `🎂 শুভ জন্মদিন${first ? ` ${first}` : ""}! আপনার নতুন বছর সুস্বাস্থ্য আর আনন্দে ভরে উঠুক। — টিম NISE COMPORT, টেলকো, জামশেদপুর #শুভজন্মদিন #জামশেদপুর #Telco #NISECOMPORT`,
  }[lang];
}

/** Which people a daily run may message: birthday wishes need a YES, renewal reminders only need that nobody said STOP. */
export function mayMessage(kind: "birthday" | "renewal", channel: "email" | "whatsapp", contact: { consent: string; emailConsent: string; email?: string | null }) {
  if (channel === "email") {
    if (!contact.email || contact.emailConsent === "opted_out") return false;
    return kind === "birthday" ? contact.emailConsent === "opted_in" : true;
  }
  if (contact.consent === "opted_out") return false;
  return kind === "birthday" ? contact.consent === "opted_in" : true;
}
