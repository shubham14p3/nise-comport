/**
 * Rules for mobile-number sign-in, PINs, record claims and the verify-your-details rewards.
 * No imports, so everything here is unit-tested with plain Node (tests/mobile-login.test.mts).
 */

export const PIN_LENGTH = 6;
/** A pending claim stays open this long (the owner asked for "more than 3 days"). */
export const CLAIM_DAYS = 7;
/** Staff get a reminder email when a claim has waited this long. */
export const CLAIM_REMINDER_HOURS = 48;
export const WHATSAPP_CODE_HOURS = 48;
export const MAX_CODE_ATTEMPTS = 5;
export const VERIFY_REWARD_RUPEES = { phone: 20, email: 30 } as const;
/** How long a signed-in person uses the site before the first "add your details" prompt, and how long before it returns. */
export const VERIFY_PROMPT_FIRST_MS = 3 * 60_000;
export const VERIFY_PROMPT_REPEAT_MS = 24 * 3600_000;

export type MobileCheck = { ok: true; digits: string; e164: string } | { ok: false; error: string };

/**
 * Turns what a person typed or pasted into exactly ten digits. Spaces, dashes, dots and brackets are ignored; a pasted
 * +91, 91 or 0 in front is dropped. The first digit must be 6–9 and the number cannot be one digit repeated.
 */
export function checkMobile(raw: string): MobileCheck {
  const text = String(raw ?? "").normalize("NFKC").trim();
  if (!text) return { ok: false, error: "Enter your 10-digit mobile number." };
  if (/[^0-9+()\-.\s]/.test(text)) return { ok: false, error: "Use digits only for the mobile number." };
  let digits = text.replace(/\D/g, "");
  if (text.startsWith("+") && digits.startsWith("91") && digits.length === 12) digits = digits.slice(2);
  else if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  else if (digits.length === 13 && digits.startsWith("091")) digits = digits.slice(3);
  if (digits.length < 10) return { ok: false, error: `Mobile numbers have 10 digits. You entered ${digits.length}.` };
  if (digits.length > 10) return { ok: false, error: "Mobile numbers have 10 digits. This one is too long." };
  if (!/^[6-9]/.test(digits)) return { ok: false, error: "Indian mobile numbers start with 6, 7, 8 or 9." };
  if (/^(\d)\1{9}$/.test(digits)) return { ok: false, error: "Please enter your real mobile number." };
  return { ok: true, digits, e164: `+91${digits}` };
}

/** What the box shows while typing: digits only, at most 10, with a pasted +91 / 91 / 0 removed. */
export function typedMobile(raw: string) {
  let digits = String(raw ?? "").replace(/\D/g, "");
  if (digits.length > 10 && digits.startsWith("91")) digits = digits.slice(2);
  else if (digits.length > 10 && digits.startsWith("0")) digits = digits.slice(1);
  return digits.slice(0, 10);
}

export function pinProblem(pin: string): string {
  if (!/^\d{6}$/.test(String(pin ?? ""))) return "Your PIN is exactly 6 digits.";
  return "";
}

/** A random 6-digit PIN that is not an obvious one (111111, 123456, 000000…). `random(n)` returns 0..n-1. */
export function generatePin(random: (below: number) => number): string {
  for (let attempt = 0; attempt < 50; attempt++) {
    const pin = String(random(1_000_000)).padStart(PIN_LENGTH, "0");
    if (!isWeakPin(pin)) return pin;
  }
  return "482915";
}
export function isWeakPin(pin: string) {
  if (/^(\d)\1{5}$/.test(pin)) return true;
  const steps = [...pin].map((digit, index, all) => index ? Number(digit) - Number(all[index - 1]) : 0).slice(1);
  return steps.every((step) => step === 1) || steps.every((step) => step === -1);
}

/** A short code staff send on WhatsApp to prove the number is the customer's. */
export function generateCode(random: (below: number) => number) { return String(random(1_000_000)).padStart(6, "0"); }

export function claimExpiry(createdAt: Date) { return new Date(createdAt.getTime() + CLAIM_DAYS * 86_400_000); }
export function claimReminderDue(claim: { status: string; createdAt: Date; remindedAt: Date | null; expiresAt: Date }, now: Date) {
  return claim.status === "pending" && !claim.remindedAt && claim.expiresAt.getTime() > now.getTime() && now.getTime() - claim.createdAt.getTime() >= CLAIM_REMINDER_HOURS * 3600_000;
}
export function claimIsOpen(claim: { status: string; expiresAt: Date }, now: Date) { return claim.status === "pending" && claim.expiresAt.getTime() > now.getTime(); }

/** Email address used for accounts created with a mobile number; mail is never sent to it. */
export function placeholderEmail(digits: string) { return `m${digits}@mobile.nisecomport.invalid`; }
export function isPlaceholderEmail(email: string | null | undefined) { return Boolean(email) && String(email).toLowerCase().endsWith(".invalid"); }

export function firstName(name: string) { return String(name ?? "").trim().split(/\s+/)[0] ?? ""; }

export function rewardReference(kind: "phone" | "email", userId: string) { return `verify:${kind}:${userId}`; }

/** What a signed-in person still needs to add (drives the dismissible prompt). */
export function missingDetails(user: { name?: string | null; email?: string | null; emailVerifiedAt?: unknown; phone?: string | null; phoneVerifiedAt?: unknown; whatsapp?: string | null }) {
  const missing: ("name" | "email" | "mobile" | "whatsapp")[] = [];
  if (!String(user.name ?? "").trim() || /^customer$/i.test(String(user.name))) missing.push("name");
  if (!user.email || isPlaceholderEmail(user.email) || !user.emailVerifiedAt) missing.push("email");
  if (!user.phone || !user.phoneVerifiedAt) missing.push("mobile");
  if (!user.whatsapp) missing.push("whatsapp");
  return missing;
}

/** When to show the prompt: after the first few minutes, then again once a day while details are missing. */
export function promptDue(signedInAt: number, lastShownAt: number | null, now: number) {
  if (now - signedInAt < VERIFY_PROMPT_FIRST_MS) return false;
  return lastShownAt === null || now - lastShownAt >= VERIFY_PROMPT_REPEAT_MS;
}

/** The only fields a customer sees of their own record: service, first name, dates, status, vehicle. Never money or IDs. */
export type OwnRecord = { id: string; service: string; name: string; recordDate: string | null; renewalOn: string | null; vehicle: string | null };
export function ownRecordView(row: OwnRecord) {
  return { id: row.id, service: row.service, name: firstName(row.name), date: row.recordDate, nextRenewal: row.renewalOn, vehicle: row.vehicle };
}

export function claimMessage(name: string, code: string) {
  return `Hello ${firstName(name) || "there"}, your NISE COMPORT code is ${code}. Enter it on the website (Profile → My records) to see your records. Do not share it with anyone.`;
}
