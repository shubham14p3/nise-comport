/**
 * What staff members may do in the admin area. The owner (role "admin") can do everything,
 * including adding and removing staff; customers never see the admin area.
 *
 * Plain module (no imports) so it can be used in the browser and in tests.
 */
export const STAFF_PERMISSIONS = ["requests", "payments", "charge", "records", "pan", "promotions", "content", "campaigns", "whatsapp", "wallet", "mail", "counter"] as const;
export type Permission = (typeof STAFF_PERMISSIONS)[number];

export const PERMISSION_INFO: Record<Permission, { label: string; detail: string }> = {
  requests: { label: "Requests & print orders", detail: "Unlocks Requests. See the queue, open customer files and update statuses. Tick service categories below to limit which requests they see." },
  payments: { label: "Payments (check receiving)", detail: "Unlocks Payments. See payments received and confirm (verify) UPI payments. Cannot create, refund or cancel payments." },
  charge: { label: "Create payment requests & refunds", detail: "Ask a customer to pay (create a payment request), process refunds and cancel payments. Off by default; only give it to people you trust with money." },
  records: { label: "Customer records", detail: "Unlocks Records. Import Excel registers (PAN, insurance, certificates…) and look up customers. Every opened record is logged." },
  pan: { label: "PAN data", detail: "Unlocks PAN data. Import PAN lists and look up records." },
  promotions: { label: "Promotions", detail: "Unlocks Promotions. Create codes, personal codes and posters, switch codes on or off." },
  content: { label: "Site content", detail: "Unlocks Site content, Gallery photos, Testimonials, Service prices, Legal pages. Banners, services and prices." },
  campaigns: { label: "WhatsApp campaigns", detail: "Unlocks WhatsApp, Contacts. Campaigns and the send queue." },
  whatsapp: { label: "WhatsApp chats (reply to customers)", detail: "Unlocks WhatsApp chats only. Read and reply to customer chats, without campaigns or contacts." },
  wallet: { label: "Wallet credits", detail: "Unlocks Wallet, Loyalty credit. Add credits to customer wallets." },
  mail: { label: "Messages", detail: "Unlocks Messages. Read and answer customer messages (tickets), including the files they attach." },
  counter: { label: "Counter desk", detail: "Look up a customer by mobile, record walk-in visits (10% off from the wallet) and request wallet top-ups. Top-ups still need the owner's approval." },
};

export type StaffLike = { role: string; permissions?: unknown };

/** Service categories a staff member may handle, stored in the same list as the permissions as "scope:<category>". */
export const SCOPE_PREFIX = "scope:";
const SLUG = /^[a-z0-9-]{2,60}$/;

export function sanitizeScope(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const out = value.filter((item): item is string => typeof item === "string" && item.startsWith(SCOPE_PREFIX)).map((item) => item.slice(SCOPE_PREFIX.length)).filter((slug) => SLUG.test(slug));
  return [...new Set(out)];
}

/** Null means no category limit (all services). A list means only those categories. */
export function scopeOf(user: StaffLike | null | undefined): string[] | null {
  if (!user || user.role !== "staff") return null;
  const scope = sanitizeScope(user.permissions);
  return scope.length ? scope : null;
}

export function hasAnyPermission(user: StaffLike | null | undefined, permissions: Permission[]) {
  return permissions.some((permission) => hasPermission(user, permission));
}

export function sanitizePermissions(value: unknown): Permission[] {
  if (!Array.isArray(value)) return [];
  return STAFF_PERMISSIONS.filter((permission) => value.includes(permission));
}

export function isStaffRole(role: string) {
  return role === "admin" || role === "staff";
}

/**
 * The main owner account. It can override any other admin's decisions and changes; no other admin
 * can override it. Compared without case, so the email is the identity.
 */
export const MAIN_OWNER_EMAIL = "shubham14p3@gmail.com";
export function isMainOwner(user: { role?: string | null; email?: string | null } | null | undefined) {
  return user?.role === "admin" && (user.email ?? "").trim().toLowerCase() === MAIN_OWNER_EMAIL;
}

export function hasPermission(user: StaffLike | null | undefined, permission: Permission) {
  if (!user) return false;
  if (user.role === "admin") return true;
  return user.role === "staff" && sanitizePermissions(user.permissions).includes(permission);
}

/** Everything the signed-in person may do, for showing the right admin tabs. */
export function permissionsOf(user: StaffLike | null | undefined): Permission[] {
  if (!user) return [];
  if (user.role === "admin") return [...STAFF_PERMISSIONS];
  return user.role === "staff" ? sanitizePermissions(user.permissions) : [];
}
