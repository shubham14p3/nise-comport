/**
 * What staff members may do in the admin area. The owner (role "admin") can do everything,
 * including adding and removing staff; customers never see the admin area.
 *
 * Plain module (no imports) so it can be used in the browser and in tests.
 */
export const STAFF_PERMISSIONS = ["requests", "records", "pan", "promotions", "content", "campaigns", "wallet", "mail"] as const;
export type Permission = (typeof STAFF_PERMISSIONS)[number];

export const PERMISSION_INFO: Record<Permission, { label: string; detail: string }> = {
  requests: { label: "Requests & print orders", detail: "Unlocks Requests, Payments. See the queue, open customer files and update statuses." },
  records: { label: "Customer records", detail: "Unlocks Records. Import Excel registers (PAN, insurance, certificates…) and look up customers. Every opened record is logged." },
  pan: { label: "PAN data", detail: "Unlocks PAN data. Import PAN lists and look up records." },
  promotions: { label: "Promotions", detail: "Unlocks Promotions. Create codes, personal codes and posters, switch codes on or off." },
  content: { label: "Site content", detail: "Unlocks Site content, Gallery photos, Testimonials, Service prices, Legal pages. Banners, services and prices." },
  campaigns: { label: "WhatsApp campaigns", detail: "Unlocks WhatsApp, WhatsApp chats, Contacts. Campaigns and the send queue." },
  wallet: { label: "Wallet credits", detail: "Unlocks Wallet, Loyalty credit. Add credits to customer wallets." },
  mail: { label: "Messages", detail: "Unlocks Messages. Read and answer customer messages (tickets), including the files they attach." },
};

export type StaffLike = { role: string; permissions?: unknown };

export function sanitizePermissions(value: unknown): Permission[] {
  if (!Array.isArray(value)) return [];
  return STAFF_PERMISSIONS.filter((permission) => value.includes(permission));
}

export function isStaffRole(role: string) {
  return role === "admin" || role === "staff";
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
