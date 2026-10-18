/**
 * Automated sync against the Google Business Profile API (mybusiness.googleapis.com), the only
 * official way to read ALL of a listing's reviews — the public Places API caps out at 5
 * "most relevant" ones regardless of how many a business actually has.
 *
 * This needs real setup that only the business owner can do, none of which this app can do for
 * itself: a Google Cloud project with the "My Business Business Information API" and "My Business
 * Reviews" access requested and approved (Google gates this behind a manual review — see
 * https://developers.google.com/my-business/content/prereqs), then an OAuth refresh token minted
 * for the Google account that manages the Business Profile. Until that's done,
 * googleBusinessSyncConfigured() returns false and callers should fall back to the manual
 * curation path (Admin → Testimonials, or the one-off scripts/seed-testimonials.mjs import).
 *
 * Required env vars once approved:
 *   GOOGLE_BUSINESS_CLIENT_ID, GOOGLE_BUSINESS_CLIENT_SECRET, GOOGLE_BUSINESS_REFRESH_TOKEN
 *   GOOGLE_BUSINESS_ACCOUNT_ID   e.g. "accounts/1234567890"
 *   GOOGLE_BUSINESS_LOCATION_ID  e.g. "locations/9876543210"
 */
export function googleBusinessSyncConfigured() {
  return Boolean(
    process.env.GOOGLE_BUSINESS_CLIENT_ID?.trim() && process.env.GOOGLE_BUSINESS_CLIENT_SECRET?.trim() &&
    process.env.GOOGLE_BUSINESS_REFRESH_TOKEN?.trim() && process.env.GOOGLE_BUSINESS_ACCOUNT_ID?.trim() &&
    process.env.GOOGLE_BUSINESS_LOCATION_ID?.trim(),
  );
}

async function accessToken() {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_BUSINESS_CLIENT_ID!,
      client_secret: process.env.GOOGLE_BUSINESS_CLIENT_SECRET!,
      refresh_token: process.env.GOOGLE_BUSINESS_REFRESH_TOKEN!,
      grant_type: "refresh_token",
    }),
    signal: AbortSignal.timeout(15_000),
  });
  const data = await response.json().catch(() => ({})) as { access_token?: string; error_description?: string };
  if (!response.ok || !data.access_token) {
    const { PublicError } = await import("@/lib/errors");
    throw new PublicError(data.error_description || `Google token refresh failed (${response.status}).`, 502, { code: "google_sync_failed" });
  }
  return data.access_token;
}

type GoogleReview = {
  reviewId: string; reviewer: { displayName?: string }; starRating: string;
  comment?: string; createTime: string; updateTime: string;
};

const STAR_WORDS: Record<string, number> = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };

/** One page of reviews straight from Google; the caller pages through with pageToken until it's exhausted. */
async function fetchReviewsPage(token: string, pageToken?: string) {
  const account = process.env.GOOGLE_BUSINESS_ACCOUNT_ID!;
  const location = process.env.GOOGLE_BUSINESS_LOCATION_ID!;
  const url = new URL(`https://mybusiness.googleapis.com/v4/${account}/${location}/reviews`);
  url.searchParams.set("pageSize", "50");
  if (pageToken) url.searchParams.set("pageToken", pageToken);
  const response = await fetch(url, { headers: { authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(20_000) });
  const data = await response.json().catch(() => ({})) as { reviews?: GoogleReview[]; nextPageToken?: string; error?: { message?: string } };
  if (!response.ok) {
    const { PublicError } = await import("@/lib/errors");
    throw new PublicError(data.error?.message || `Google Business Profile API error (${response.status}).`, 502, { code: "google_sync_failed" });
  }
  return { reviews: data.reviews ?? [], nextPageToken: data.nextPageToken };
}

/**
 * Pulls every review from the Business Profile API and upserts each one into `testimonials`,
 * keyed by its Google review id so running this on a schedule never creates duplicates — it just
 * refreshes text/rating if the customer edited their review. New rows default to hidden unless
 * 4-5 stars, same as the manual seed, so a flood of low ratings never auto-publishes.
 */
export async function syncGoogleReviews() {
  if (!googleBusinessSyncConfigured()) {
    const { PublicError } = await import("@/lib/errors");
    throw new PublicError("Google Business Profile sync isn't set up yet — add GOOGLE_BUSINESS_CLIENT_ID/SECRET, GOOGLE_BUSINESS_REFRESH_TOKEN, GOOGLE_BUSINESS_ACCOUNT_ID and GOOGLE_BUSINESS_LOCATION_ID once Google approves API access, or use Admin → Testimonials / the one-off seed script instead.", 409, { code: "google_sync_not_configured" });
  }
  const { upsertTestimonialFromSource } = await import("@/lib/testimonials");
  const token = await accessToken();
  let pageToken: string | undefined;
  let imported = 0;
  do {
    const page = await fetchReviewsPage(token, pageToken);
    for (const review of page.reviews) {
      const rating = STAR_WORDS[review.starRating] ?? 5;
      await upsertTestimonialFromSource({
        authorName: review.reviewer.displayName || "Google user", rating,
        body: (review.comment || "").trim() || "(No written review, star rating only.)",
        category: "general", serviceSlug: null, source: "google", sourceId: review.reviewId,
        reviewedOn: review.updateTime?.slice(0, 10) || review.createTime?.slice(0, 10) || null,
      });
      imported++;
    }
    pageToken = page.nextPageToken;
  } while (pageToken);
  return { imported };
}
