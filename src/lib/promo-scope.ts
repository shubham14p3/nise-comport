/**
 * Which services a coupon may be used on. Empty lists mean "every service and printing".
 * `services` holds service slugs plus the special keys "print" (print orders) and "pan" (PAN requests).
 *
 * Plain module (no imports) so it runs in the browser and in tests.
 */
export type AppliesTo = { categories: string[]; services: string[] };
export type ScopeContext = { service?: string | null; category?: string | null };

export const SPECIAL_SCOPES: Record<string, string> = { print: "Print orders", pan: "PAN requests" };

export function cleanScope(value: unknown): AppliesTo | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<AppliesTo>;
  const list = (items: unknown) => Array.isArray(items) ? [...new Set(items.filter((item): item is string => typeof item === "string" && /^[a-z0-9-]{2,80}$/.test(item)))].slice(0, 60) : [];
  const scope = { categories: list(raw.categories), services: list(raw.services) };
  return scope.categories.length || scope.services.length ? scope : null;
}

export function isRestricted(scope: AppliesTo | null | undefined) {
  return Boolean(scope && (scope.categories.length || scope.services.length));
}

/** True when the code may be used for this service. Unrestricted codes work everywhere. */
export function scopeAllows(scope: AppliesTo | null | undefined, context: ScopeContext) {
  if (!isRestricted(scope)) return true;
  const service = context.service ?? "";
  if (service && scope!.services.includes(service)) return true;
  if (service.startsWith("pan") && scope!.services.includes("pan")) return true;
  return Boolean(context.category && scope!.categories.includes(context.category));
}

/** "Print orders, PAN requests, Insurance" — for coupon cards and error messages. */
export function scopeLabel(scope: AppliesTo | null | undefined, names: Record<string, string>) {
  if (!isRestricted(scope)) return "All services";
  const parts = [...scope!.categories.map((slug) => names[slug] ?? slug), ...scope!.services.map((slug) => SPECIAL_SCOPES[slug] ?? names[slug] ?? slug)];
  return parts.length > 3 ? `${parts.slice(0, 3).join(", ")} +${parts.length - 3} more` : parts.join(", ");
}

/** Discount for an amount, capped by an optional maximum (useful for % codes). */
export function cappedDiscount(type: string, value: number, amount: number, maxDiscount: number | null) {
  const raw = type === "percent" ? (amount * value) / 100 : value;
  const capped = maxDiscount && maxDiscount > 0 ? Math.min(raw, maxDiscount) : raw;
  return Math.max(0, Math.min(amount, Math.round(capped * 100) / 100));
}

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
/** Hard-to-guess personal code, e.g. "DIWALI-7KQ2M9XA". */
export function personalCode(prefix: string, randomIndex: (max: number) => number) {
  const head = prefix.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10) || "NC";
  let tail = "";
  for (let index = 0; index < 8; index++) tail += ALPHABET[randomIndex(ALPHABET.length)];
  return `${head}-${tail}`;
}
