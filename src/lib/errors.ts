/**
 * An error whose message is safe to show to customers. Any other error is logged on the
 * server and replaced with a generic message, so database queries, file paths and stack
 * traces never reach the browser.
 */
export class PublicError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fields?: Record<string, string>;
  readonly retryAfterSeconds?: number;
  constructor(message: string, status = 400, options: { code?: string; fields?: Record<string, string>; retryAfterSeconds?: number } = {}) {
    super(message);
    this.name = "PublicError";
    this.status = status;
    this.code = options.code ?? "bad_request";
    this.fields = options.fields;
    this.retryAfterSeconds = options.retryAfterSeconds;
  }
}

export class RateLimitError extends PublicError {
  constructor(message: string, retryAfterSeconds: number) {
    super(message, 429, { code: "rate_limited", retryAfterSeconds: Math.max(1, Math.ceil(retryAfterSeconds)) });
    this.name = "RateLimitError";
  }
}

/** PostgreSQL error code, also when Drizzle wraps the driver error in `cause`. */
export function postgresCode(error: unknown): string | undefined {
  let current: unknown = error;
  for (let depth = 0; depth < 4 && current && typeof current === "object"; depth++) {
    const code = (current as { code?: unknown }).code;
    if (typeof code === "string" && /^[0-9A-Z]{5}$/.test(code)) return code;
    current = (current as { cause?: unknown }).cause;
  }
  return undefined;
}

export function isUniqueViolation(error: unknown) {
  return postgresCode(error) === "23505";
}

/** True for "database/SMTP is down" style failures that deserve a 503 rather than a 500. */
export function isUnavailable(error: unknown) {
  let current: unknown = error;
  for (let depth = 0; depth < 4 && current && typeof current === "object"; depth++) {
    const code = (current as { code?: unknown }).code;
    if (typeof code === "string" && ["ECONNREFUSED", "ECONNRESET", "ETIMEDOUT", "ENOTFOUND", "EAI_AGAIN", "57P01", "57P03", "53300", "08006", "08001"].includes(code)) return true;
    current = (current as { cause?: unknown }).cause;
  }
  return false;
}

export function humanDuration(seconds: number) {
  if (seconds < 60) return `${Math.max(1, Math.ceil(seconds))} seconds`;
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  const hours = Math.ceil(minutes / 60);
  return `${hours} hour${hours === 1 ? "" : "s"}`;
}
