/**
 * Shared input rules used by both the browser forms and the API routes.
 * No imports, so every rule is unit-tested with plain Node (see tests/validation.test.mts).
 */

export const PASSWORD_MIN = 10;
export const PASSWORD_MAX = 128;

export function normalizeEmail(value: string) {
  return value.normalize("NFKC").trim().toLowerCase();
}

/** Basic, permissive email check; the verification code proves the address really works. */
export function looksLikeEmail(value: string) {
  const email = normalizeEmail(value);
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) && !email.includes("..");
}

/** Collapses internal whitespace and removes control characters from a person's name. */
export function cleanName(value: string) {
  const printable = [...value.normalize("NFC")].map((character) => {
    const code = character.codePointAt(0) ?? 0;
    return code < 32 || code === 127 ? " " : character;
  }).join("");
  return printable.replace(/\s+/g, " ").trim();
}

/**
 * Normalises phone numbers typed in any common Indian style to E.164.
 *   "98765 43210", "098765-43210", "+91 98765 43210", "919876543210" -> "+919876543210"
 *   "0657-2917622" (landline with STD code) -> "+916572917622"
 *   "+44 20 7946 0958" (international) -> "+442079460958"
 * Returns null when the number cannot be valid.
 */
/**
 * Sign-up name rule: letters in any language, with single spaces, hyphens, apostrophes or dots inside.
 * No numbers, no symbols, no spaces at the start or end, no double spaces.
 */
export function nameProblem(value: string, minLetters: number, label: string): string | null {
  if (!value) return `Enter your ${label}.`;
  if (value !== value.trim()) return `Remove the spaces at the start or end of your ${label}.`;
  if (/\s{2,}/.test(value)) return `Use only one space between words in your ${label}.`;
  if (value.length > 50) return `Your ${label} is too long (50 characters at most).`;
  if (!/^[\p{L}\p{M}][\p{L}\p{M} '’.-]*$/u.test(value)) return `Your ${label} can only have letters, with no numbers or symbols.`;
  if (value.replace(/[^\p{L}]/gu, "").length < minLetters) return `Your ${label} needs at least ${minLetters} letters.`;
  return null;
}

/** Strict email check for sign-up and sign-in codes: no spaces, no stray symbols, no leading or double dots. */
export function emailProblem(value: string): string | null {
  if (!value) return "Enter your email address.";
  if (value !== value.trim()) return "Remove the spaces at the start or end of the email address.";
  if (/\s/.test(value)) return "An email address can't contain spaces.";
  if (value.length > 254 || !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/.test(value)) return "Enter a valid email address, like name@example.com.";
  if (value.startsWith(".") || value.includes("..") || value.includes(".@")) return "Check the dots in the email address.";
  return null;
}

/**
 * WhatsApp number for sign-up: exactly 10 digits, an Indian mobile (starts with 6, 7, 8 or 9).
 * "+91", "91" or a leading 0 in front is accepted and removed. Letters and other symbols are rejected.
 */
export function whatsappProblem(value: string): string | null {
  const text = value.normalize("NFKC").trim();
  if (!text) return "Enter your WhatsApp number.";
  if (/[^\d\s+\-()]/.test(text)) return "WhatsApp number can only have digits, e.g. 98765 43210.";
  const digits = text.replace(/\D/g, "");
  const local = digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits.length === 11 && digits.startsWith("0") ? digits.slice(1) : digits;
  if (local.length !== 10) return "WhatsApp number must be 10 digits, e.g. 98765 43210.";
  if (!/^[6-9]/.test(local)) return "Indian mobile numbers start with 6, 7, 8 or 9.";
  return null;
}

/** Returns "+91XXXXXXXXXX" for a valid WhatsApp number, otherwise null. */
export function normalizeWhatsapp(value: string): string | null {
  if (whatsappProblem(value)) return null;
  const digits = value.normalize("NFKC").replace(/\D/g, "");
  const local = digits.length === 12 ? digits.slice(2) : digits.length === 11 ? digits.slice(1) : digits;
  return `+91${local}`;
}

export function normalizePhone(value: string): string | null {
  const trimmed = value.normalize("NFKC").trim();
  if (!trimmed) return null;
  if (/[^0-9+()\-.\s]/.test(trimmed)) return null;
  const hasPlus = trimmed.startsWith("+");
  let digits = trimmed.replace(/\D/g, "");
  if (hasPlus) {
    if (digits.startsWith("91")) return /^91[2-9]\d{9}$/.test(digits) ? `+${digits}` : null;
    return /^[1-9]\d{7,14}$/.test(digits) ? `+${digits}` : null;
  }
  if (digits.startsWith("00")) {
    digits = digits.slice(2);
    if (digits.startsWith("91")) return /^91[2-9]\d{9}$/.test(digits) ? `+${digits}` : null;
    return /^[1-9]\d{7,14}$/.test(digits) ? `+${digits}` : null;
  }
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return /^[2-9]\d{9}$/.test(digits) ? `+91${digits}` : null;
}

/** "+919876543210" -> "+91 98765 43210" for display. */
export function formatPhone(e164: string | null | undefined) {
  if (!e164) return "";
  const match = /^\+91(\d{5})(\d{5})$/.exec(e164);
  return match ? `+91 ${match[1]} ${match[2]}` : e164;
}

const COMMON_PASSWORDS = new Set([
  "1234567890", "12345678910", "0123456789", "0987654321", "1111111111", "qwertyuiop", "password12", "password123",
  "password1234", "passw0rd123", "iloveyou123", "abcdefghij", "abc1234567", "qwerty1234", "qwerty12345", "asdfghjkl1",
  "welcome123", "admin12345", "letmein123", "india12345", "jamshedpur", "jamshedpur1", "nisecomport", "nisecomport1",
  "zaq12wsxcde", "1q2w3e4r5t", "1qaz2wsx3edc", "sunshine123", "princess123", "football123",
]);

/** Returns an error message, or "" when the password is acceptable. */
export function passwordProblem(password: string, context: { email?: string; name?: string } = {}) {
  if (password.length < PASSWORD_MIN) return `Use at least ${PASSWORD_MIN} characters.`;
  if (password.length > PASSWORD_MAX) return `Use no more than ${PASSWORD_MAX} characters.`;
  if (/^(.)\1+$/.test(password)) return "Don’t repeat a single character.";
  const lower = password.toLowerCase();
  if (COMMON_PASSWORDS.has(lower)) return "This password is too common. Choose something harder to guess.";
  if (/^(0123456789|1234567890|abcdefghij)+/.test(lower)) return "Avoid simple sequences like 1234567890.";
  const local = context.email ? context.email.toLowerCase().split("@")[0] : "";
  if (local.length >= 4 && lower.includes(local)) return "Don’t include your email address in the password.";
  const firstName = context.name ? context.name.toLowerCase().trim().split(/\s+/)[0] : "";
  if (firstName.length >= 4 && lower.startsWith(firstName) && /^[^a-z]*$/.test(lower.slice(firstName.length))) return "Don’t base the password on your name.";
  return "";
}

export function isSixDigitCode(value: string) {
  return /^\d{6}$/.test(value.trim());
}

export function isIndianPin(value: string) {
  return /^[1-9]\d{5}$/.test(value.trim());
}
