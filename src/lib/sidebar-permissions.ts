/** One selectable permission per visible desk module. All changes are still checked server-side. */
export const STAFF_MENU_AREAS = [
  { id: "inbox", label: "Inbox", group: "Work & messages", base: "inbox" },
  { id: "mail", label: "Messages / Mail", group: "Work & messages", base: "mail" },
  { id: "requests", label: "Requests", group: "Work & messages", base: "requests" },
  { id: "chats", label: "WhatsApp chats", group: "Work & messages", base: "whatsapp" },
  { id: "payments", label: "Payments", group: "Work & messages", base: "payments" },
  { id: "counter", label: "Counter desk", group: "Customers & records", base: "counter" },
  { id: "findcustomer", label: "Find customer", group: "Customers & records", base: "records" },
  { id: "records", label: "Customer records", group: "Customers & records", base: "records" },
  { id: "pan", label: "PAN data", group: "Customers & records", base: "pan" },
  { id: "contacts", label: "Contacts", group: "Customers & records", base: "campaigns" },
  { id: "wallet", label: "Wallet", group: "Customers & records", base: "wallet" },
  { id: "loyalty", label: "Loyalty credit", group: "Customers & records", base: "wallet" },
  { id: "promotions", label: "Promotions", group: "Offers & campaigns", base: "promotions" },
  { id: "couponuse", label: "Coupon use", group: "Offers & campaigns", base: "promotions" },
  { id: "campaigns", label: "WhatsApp campaigns", group: "Offers & campaigns", base: "campaigns" },
  { id: "outreach", label: "Birthdays & renewals", group: "Offers & campaigns", base: "outreach" },
  { id: "qrscans", label: "QR scans", group: "Offers & campaigns", base: "campaigns" },
  { id: "content", label: "Site content", group: "Website & setup", base: "content" },
  { id: "gallery", label: "Gallery photos", group: "Website & setup", base: "content" },
  { id: "testimonials", label: "Testimonials", group: "Website & setup", base: "content" },
  { id: "prices", label: "Service prices", group: "Website & setup", base: "content" },
  { id: "hardware", label: "Hardware parts", group: "Website & setup", base: "content" },
  { id: "legal", label: "Legal pages", group: "Website & setup", base: "content" },
] as const;
export const OWNER_MENU_AREAS = ["customers", "team", "integrations"] as const;
export type StaffMenuId = (typeof STAFF_MENU_AREAS)[number]["id"];
export const MENU_PREFIX = "tab:";

const idSet: ReadonlySet<string> = new Set(STAFF_MENU_AREAS.map(item => item.id));
export function sanitizedMenu(value: unknown): StaffMenuId[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((entry): entry is StaffMenuId =>
    typeof entry === "string" && entry.startsWith(MENU_PREFIX) && idSet.has(entry.slice(MENU_PREFIX.length)))
    .map(entry => entry.slice(MENU_PREFIX.length) as StaffMenuId))];
}
export function hasMenuRestrictions(permissions: unknown): boolean {
  return sanitizedMenu(permissions).length > 0;
}
export function canSeeDeskMenu(role: string, permissions: unknown, tab: string): boolean {
  if (role === "admin") return true;
  if (role !== "staff" || OWNER_MENU_AREAS.some(owner => owner === tab)) return false;
  const selected = sanitizedMenu(permissions);
  if (selected.length) return selected.includes(tab as StaffMenuId);
  // Legacy staff accounts keep the old base-permission behavior until resaved.
  return true;
}
export function sidebarPermissionForPath(path: string): StaffMenuId | null {
  const rules: [string, StaffMenuId][] = [
    ["/api/admin/inbox", "inbox"], ["/api/admin/leads", "inbox"],
    ["/api/mail", "mail"], ["/api/admin/request-workflow", "requests"],
    ["/api/admin/chats", "chats"], ["/api/admin/payments", "payments"],
    ["/api/admin/counter", "counter"], ["/api/admin/customer-finder", "findcustomer"],
    ["/api/admin/records", "records"], ["/api/admin/pan-imports", "pan"],
    ["/api/admin/contacts", "contacts"], ["/api/admin/wallet-credit", "wallet"],
    ["/api/admin/loyalty", "loyalty"], ["/api/admin/promotions", "promotions"],
    ["/api/admin/coupon-batches", "promotions"], ["/api/admin/coupon-usage", "couponuse"],
    ["/api/admin/campaigns", "campaigns"], ["/api/admin/outreach", "outreach"],
    ["/api/admin/qr-scans", "qrscans"], ["/api/admin/site-content", "content"],
    ["/api/admin/gallery", "gallery"], ["/api/admin/testimonials", "testimonials"],
    ["/api/admin/prices", "prices"], ["/api/admin/hardware", "hardware"],
    ["/api/admin/legal", "legal"], ["/api/admin/media", "content"],
  ];
  const entry = rules.find(([prefix]) => path === prefix || path.startsWith(prefix + "/"));
  return entry?.[1] ?? null;
}
