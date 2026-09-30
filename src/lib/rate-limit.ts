import { createHmac } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { rateLimits } from "@/db/schema";
import { humanDuration, RateLimitError } from "@/lib/errors";
import { rateKey, secondsUntilWindowEnds, windowStartFor, type RateRule } from "@/lib/rate-limit-core";

export { RATE_RULES } from "@/lib/rate-limit-core";

/** Hashes an identity (email, IP, user id) so the rate-limit table never holds personal data. */
export function identity(kind: string, value: string) {
  const secret = process.env.OTP_SECRET ?? "nise-rate-limit";
  return createHmac("sha256", secret).update(`${kind}:${value.trim().toLowerCase()}`).digest("base64url").slice(0, 32);
}

/** Current count in this window without changing it. */
export async function peekRate(rule: RateRule, identityHash: string) {
  const key = rateKey(rule, identityHash);
  const windowStart = windowStartFor(Date.now(), rule.windowSeconds);
  const [row] = await db.select({ count: rateLimits.count, windowStart: rateLimits.windowStart }).from(rateLimits).where(eq(rateLimits.key, key)).limit(1);
  if (!row || row.windowStart.getTime() < windowStart.getTime()) return 0;
  return row.count;
}

/**
 * Atomically adds one hit and returns whether it is still within the limit.
 * Uses INSERT … ON CONFLICT so parallel requests on several servers are counted correctly.
 */
export async function hitRate(rule: RateRule, identityHash: string) {
  const now = Date.now();
  const key = rateKey(rule, identityHash);
  const windowStart = windowStartFor(now, rule.windowSeconds);
  const [row] = await db.insert(rateLimits).values({ key, windowStart, count: 1 }).onConflictDoUpdate({
    target: rateLimits.key,
    set: {
      count: sql`CASE WHEN ${rateLimits.windowStart} < ${windowStart} THEN 1 ELSE ${rateLimits.count} + 1 END`,
      windowStart: sql`CASE WHEN ${rateLimits.windowStart} < ${windowStart} THEN ${windowStart} ELSE ${rateLimits.windowStart} END`,
    },
  }).returning({ count: rateLimits.count });
  const count = row?.count ?? 1;
  return { allowed: count <= rule.limit, count, retryAfter: secondsUntilWindowEnds(now, rule.windowSeconds) };
}

/** Throws a friendly 429 when the limit is exceeded. */
export async function enforceRate(rule: RateRule, identityHash: string, message = "Too many attempts.") {
  const result = await hitRate(rule, identityHash);
  if (!result.allowed) throw new RateLimitError(`${message} Please try again in ${humanDuration(result.retryAfter)}.`, result.retryAfter);
  return result;
}

export async function clearRate(rule: RateRule, identityHash: string) {
  await db.delete(rateLimits).where(eq(rateLimits.key, rateKey(rule, identityHash)));
}
