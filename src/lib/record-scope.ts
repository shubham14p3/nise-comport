/**
 * Which record services a person may open. A plain module (no imports) so tests and the server share it.
 *  - the owner: every service (null)
 *  - staff with nothing set: every service (null), the default
 *  - staff the owner narrowed: just those services (a list; an empty list means none)
 */
export function pickServices(value: unknown, known: readonly string[]): string[] | null {
  if (!Array.isArray(value)) return null;
  return known.filter((service) => value.includes(service));
}

export function scopeOf(user: { role: string; recordServices?: unknown } | null | undefined, known: readonly string[]): string[] | null {
  if (!user || user.role === "admin") return null;
  return pickServices(user.recordServices, known);
}

export function canOpen(scope: string[] | null, service: string) {
  return scope === null || scope.includes(service);
}
