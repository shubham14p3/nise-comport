/**
 * Where staff and owners work. One constant so the link, login redirect and noindex rules
 * all agree. The old /admin address redirects here (see legacy-redirects.ts).
 */
export const STAFF_HOME = "/desk";

/** Roles that can open the staff desk. Customers never see the staff links. */
export function isStaffRole(role: string | null | undefined): boolean {
  return role === "admin" || role === "staff";
}
