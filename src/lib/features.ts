/**
 * Switches for parts of the site that are built but not shown yet.
 * Change a value to `true` (or set the matching environment variable to "true") and rebuild to show it again.
 * No imports so it can be used everywhere, including plain-Node tests.
 */
export const FEATURES = {
  /** "Fee, Bill & Recharge Payments" category and its service. */
  billsAndRecharge: process.env.NEXT_PUBLIC_FEATURE_BILLS === "true",
  /** "Travel & Ticket Assistance" category and its service. */
  travel: process.env.NEXT_PUBLIC_FEATURE_TRAVEL === "true",
  /** Uploading files for printing and the other Print & Digital services. Off = customers ask for a price instead. */
  printUploads: process.env.NEXT_PUBLIC_FEATURE_PRINT_UPLOADS === "true",
} as const;

/** Categories that are switched off (their pages, tiles, menus and sitemap entries disappear). */
export const HIDDEN_CATEGORIES: string[] = [
  ...(FEATURES.billsAndRecharge ? [] : ["fee-payments"]),
  ...(FEATURES.travel ? [] : ["travel"]),
];

export function categoryVisible(slug: string) { return !HIDDEN_CATEGORIES.includes(slug); }

/** Categories whose services are price enquiries only while uploads are off. */
export const NO_UPLOAD_CATEGORIES = ["it-services"];
export function uploadsAllowed(categorySlug: string | null | undefined) {
  return FEATURES.printUploads || !categorySlug || !NO_UPLOAD_CATEGORIES.includes(categorySlug);
}
