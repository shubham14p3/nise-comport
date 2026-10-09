import { PublicError } from "@/lib/errors";
import { RECORD_SERVICES } from "@/lib/record-import";
import { canOpen, pickServices, scopeOf } from "@/lib/record-scope";

const KNOWN = Object.keys(RECORD_SERVICES);

/** Keeps only real services; anything that is not a list means "every service". */
export const sanitizeServices = (value: unknown) => pickServices(value, KNOWN);
/** null = every service; a list = only those the owner allowed. */
export const recordScope = (user: { role: string; recordServices?: unknown } | null | undefined) => scopeOf(user, KNOWN);
export const canOpenService = canOpen;

/** Throws when the service is outside what this person may open. */
export function assertServiceAccess(scope: string[] | null, service: string) {
  if (!canOpen(scope, service)) throw new PublicError("You don’t have access to this service. Ask the owner.", 403, { code: "forbidden" });
}
