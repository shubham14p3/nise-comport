/**
 * Service slugs that have a translated page under /hi/services/[slug] and /bn/services/[slug].
 * Kept as a tiny list so the language menu (a client component) doesn't ship the full
 * translated content. A unit test checks these lists match src/lib/hindi.ts and bengali.ts.
 */
const TRANSLATED = [
  "pan-card-jamshedpur",
  "aadhaar-assistance-jamshedpur",
  "jharkhand-certificates-jamshedpur",
  "voter-id-services-jamshedpur",
  "banking-aeps-money-transfer",
  "printing-scanning-jamshedpur",
  "student-scholarship-forms-jamshedpur",
  "exam-form-filling-jamshedpur",
  "passport-driving-licence-help",
  "jeevan-pramaan-life-certificate-jamshedpur",
  "land-mutation-jharbhoomi-help",
  "birth-death-certificate-help-jamshedpur",
] as const;

export const translatedSlugs: { hi: readonly string[]; bn: readonly string[] } = { hi: TRANSLATED, bn: TRANSLATED };
