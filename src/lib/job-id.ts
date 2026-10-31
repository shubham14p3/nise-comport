/** A public tracking code, not an authorization credential. */
export const JOB_CODE_PATTERN = /\bNCJ-\d{2}-[0-9A-F]{12}\b/i;
export function extractJobCode(value: string): string | null {
  const match = value.match(JOB_CODE_PATTERN);
  return match ? match[0].toUpperCase() : null;
}
export function validJobCode(value: string) {
  const trimmed = value.trim().toUpperCase();
  return /^NCJ-\d{2}-[0-9A-F]{12}$/.test(trimmed) ? trimmed : null;
}
