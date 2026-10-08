/** Accounts made from a register get this placeholder email until the person adds a real one. */
export const RECORDS_EMAIL_DOMAIN = "records.nisecomport.invalid";

export function isPlaceholderEmail(email: string | null | undefined): boolean {
  return Boolean(email && email.toLowerCase().endsWith(`@${RECORDS_EMAIL_DOMAIN}`));
}
