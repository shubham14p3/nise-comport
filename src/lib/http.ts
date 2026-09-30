import { randomInt } from "node:crypto";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { isUnavailable, PublicError } from "@/lib/errors";
import { site } from "@/lib/site";

const GENERIC_ERROR = "Something went wrong on our side. Please try again in a moment.";
const UNAVAILABLE_ERROR = `This service is temporarily unavailable. Please try again in a few minutes, or call ${site.phones.primary.display}.`;

/**
 * Converts any thrown error into a safe JSON response.
 * - PublicError / RateLimitError: message and status are shown as-is.
 * - ZodError: the first validation message plus per-field messages, status 400.
 * - Anything else: logged on the server; the customer sees a generic message (500 or 503).
 */
export function apiError(error: unknown) {
  if (error instanceof PublicError) {
    const headers: Record<string, string> = {};
    if (error.retryAfterSeconds) headers["Retry-After"] = String(error.retryAfterSeconds);
    return NextResponse.json({ error: error.message, code: error.code, ...(error.fields ? { fields: error.fields } : {}), ...(error.retryAfterSeconds ? { retryAfter: error.retryAfterSeconds } : {}) }, { status: error.status, headers });
  }
  if (error instanceof ZodError) {
    const fields: Record<string, string> = {};
    for (const issue of error.issues) {
      const key = issue.path.map(String).join(".") || "form";
      if (!fields[key]) fields[key] = issue.message;
    }
    return NextResponse.json({ error: error.issues[0]?.message ?? "Please check the information and try again.", code: "invalid_input", fields }, { status: 400 });
  }
  if (isUnavailable(error)) {
    console.error("[api] dependency unavailable", error);
    return NextResponse.json({ error: UNAVAILABLE_ERROR, code: "unavailable" }, { status: 503, headers: { "Retry-After": "60" } });
  }
  console.error("[api] unexpected error", error);
  return NextResponse.json({ error: GENERIC_ERROR, code: "server_error" }, { status: 500 });
}

/** Reads a JSON body with a size limit; malformed or oversized bodies become a clear 400/413. */
export async function readJson(request: Request, maxBytes = 64 * 1024): Promise<unknown> {
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > maxBytes) throw new PublicError("The request is too large.", 413, { code: "too_large" });
  const text = await request.text();
  if (text.length > maxBytes) throw new PublicError("The request is too large.", 413, { code: "too_large" });
  if (!text.trim()) throw new PublicError("The request was empty. Please try again.", 400, { code: "empty_body" });
  try { return JSON.parse(text); } catch { throw new PublicError("The request could not be read. Please refresh the page and try again.", 400, { code: "invalid_json" }); }
}

const REFERENCE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

/** Short, readable, hard-to-guess reference such as "NC-260930-7KQ4MX" (no 0/O/1/I confusion). */
export function makeReference(prefix: string) {
  const date = new Date(Date.now() + 330 * 60_000).toISOString().slice(2, 10).replaceAll("-", "");
  let random = "";
  for (let index = 0; index < 6; index++) random += REFERENCE_ALPHABET[randomInt(REFERENCE_ALPHABET.length)];
  return `${prefix}-${date}-${random}`;
}

/** Best-effort client IP. Only trust X-Forwarded-For when the app runs behind your own proxy/CDN. */
export function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim().slice(0, 64);
  return (request.headers.get("x-real-ip") ?? request.headers.get("cf-connecting-ip") ?? "unknown").trim().slice(0, 64);
}

export function userAgent(request: Request) {
  return (request.headers.get("user-agent") ?? "").slice(0, 200);
}
