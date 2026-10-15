/**
 * Pure helpers for fixed-window rate limiting (no imports, unit-tested).
 * A window of N seconds starts at a multiple of N since the Unix epoch, so every server
 * instance agrees on the window without coordination.
 */
export function windowStartFor(nowMs: number, windowSeconds: number) {
  const size = windowSeconds * 1000;
  return new Date(Math.floor(nowMs / size) * size);
}

export function secondsUntilWindowEnds(nowMs: number, windowSeconds: number) {
  const start = windowStartFor(nowMs, windowSeconds).getTime();
  return Math.max(1, Math.ceil((start + windowSeconds * 1000 - nowMs) / 1000));
}

export type RateRule = { name: string; limit: number; windowSeconds: number };

/** Builds the storage key. The identity part must already be hashed (never store raw emails or IPs). */
export function rateKey(rule: RateRule, identityHash: string) {
  return `${rule.name}:${rule.windowSeconds}:${identityHash}`;
}

/**
 * Central list of limits so they can be reviewed in one place.
 * Per-network (IP) limits are generous on purpose: customers are often helped to sign up on the
 * shop’s own Wi-Fi, so many accounts can legitimately share one IP address.
 */
export const RATE_RULES = {
  otpSendPerEmailMinute: { name: "otp-send-email", limit: 1, windowSeconds: 60 },
  otpSendPerEmailHour: { name: "otp-send-email", limit: 5, windowSeconds: 3600 },
  otpSendPerEmailDay: { name: "otp-send-email", limit: 10, windowSeconds: 86400 },
  otpSendPerIpHour: { name: "otp-send-ip", limit: 60, windowSeconds: 3600 },
  otpVerifyPerIpHour: { name: "otp-verify-ip", limit: 150, windowSeconds: 3600 },
  passwordPerIp15m: { name: "password-ip", limit: 60, windowSeconds: 900 },
  passwordFailuresPerEmail15m: { name: "password-fail-email", limit: 5, windowSeconds: 900 },
  passwordFailuresPerEmailDay: { name: "password-fail-email", limit: 20, windowSeconds: 86400 },
  accountChangePerUserHour: { name: "account-change", limit: 10, windowSeconds: 3600 },
  requestsPerUserHour: { name: "service-request", limit: 10, windowSeconds: 3600 },
  requestsPerUserDay: { name: "service-request", limit: 30, windowSeconds: 86400 },
  uploadsPerUserDay: { name: "upload", limit: 40, windowSeconds: 86400 },
  printJobsPerUserHour: { name: "print-job", limit: 15, windowSeconds: 3600 },
  cancelPerUserHour: { name: "cancel-request", limit: 10, windowSeconds: 3600 },
  couponChecksPerUserHour: { name: "coupon-check", limit: 40, windowSeconds: 3600 },
  galleryUploadsPerUserHour: { name: "gallery-upload", limit: 300, windowSeconds: 3600 },
  draftSavesPerUserHour: { name: "draft-save", limit: 120, windowSeconds: 3600 },
  /** Wrong codes: a few typos are fine, guessing codes is not. */
  couponFailuresPerUserHour: { name: "coupon-fail", limit: 8, windowSeconds: 3600 },
  couponFailuresPerUserDay: { name: "coupon-fail", limit: 20, windowSeconds: 86400 },
  /** Google address search (each call costs money): generous for people, tight for scripts. */
  placesPerIpHour: { name: "places-ip", limit: 150, windowSeconds: 3600 },
  placesPerIpDay: { name: "places-ip", limit: 600, windowSeconds: 86400 },
  /** "Call me back" requests from the chat: enough for real people, useless for spam. */
  leadsPerIpHour: { name: "lead-ip", limit: 5, windowSeconds: 3600 },
  leadsPerPhoneDay: { name: "lead-phone", limit: 3, windowSeconds: 86400 },
  /** Staff browsing customer records: plenty for real work, stops bulk copying with a stolen session. */
  recordOpensPerUserHour: { name: "record-open", limit: 150, windowSeconds: 3600 },
  recordPagesPerUserHour: { name: "record-page", limit: 600, windowSeconds: 3600 },
  recordImportsPerUserHour: { name: "record-import", limit: 20, windowSeconds: 3600 },
} as const satisfies Record<string, RateRule>;
