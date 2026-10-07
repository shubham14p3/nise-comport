/**
 * Service slugs that have a translated page under /hi/services/[slug] and /bn/services/[slug].
 * Kept as a tiny list so the language menu (a client component) doesn't ship the full
 * translated content. A unit test checks these lists match src/lib/hindi.ts and bengali.ts.
 */
const TRANSLATED = [
  "pan-card",
  "aadhaar",
  "income-caste-residence-certificate",
  "voter-id",
  "aeps-money-transfer",
  "printing-scanning",
  "scholarship-forms",
  "exam-forms",
  "passport-driving-licence",
  "jeevan-pramaan",
  "land-mutation",
  "birth-death-certificate",
] as const;

export const translatedSlugs: { hi: readonly string[]; bn: readonly string[] } = { hi: TRANSLATED, bn: TRANSLATED };
