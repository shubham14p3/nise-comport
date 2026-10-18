# Getting all Google reviews onto the site

Two different paths exist for this, and they aren't interchangeable.

## Why the simple way (Places API) doesn't work

The public Google Places API's Place Details call can return a `reviews` field, but Google caps
it at **5 "most relevant" reviews**, with no pagination — that's true for every business on
Google, not a bug or a quota you can raise. There is no official way to pull hundreds of reviews
through this API.

Scraping the review text off the Google Maps page itself is against Google's Terms of Service,
even for your own listing, and breaks every time Google changes its markup. This app does not do
that.

## Path 1: manual curation (works today, already shipped)

**Admin → Testimonials** lets staff paste in a review's text, author, star rating and which
service it's about. That's what populated the ~280 real reviews already imported from your saved
Google Maps page (`scripts/seed-testimonials.mjs` + `src/data/testimonials-seed.json`) — 1-3 star
reviews are imported hidden by default so a staff member reviews them before anything questionable
goes live. Re-running `npm run testimonials:seed` is always safe: it upserts by Google's review id,
so it only ever adds new ones or refreshes edited text, never duplicates.

Use this whenever you get a fresh batch of reviews and don't have Business Profile API access yet.

## Path 2: automated sync via the Business Profile API

This pulls **every** review automatically, but needs real setup only the business owner can do:

1. **Request API access.** Go to the [Business Profile APIs prerequisites page](https://developers.google.com/my-business/content/prereqs)
   and fill in Google's access request form for the "My Business Business Information API" and
   "My Business Account Management API" (the reviews endpoint lives under the legacy My Business
   API family). Google reviews these by hand — approval isn't instant and can take days to weeks.
2. **Create OAuth credentials** in a Google Cloud project: an OAuth 2.0 Client ID (type: Web
   application or Desktop, either works for a one-time token mint).
3. **Mint a refresh token** signed in as the Google account that manages your Business Profile
   (Google's OAuth Playground, or any small script using the `google-auth-library`, works for
   this one-time step — ask for the `https://www.googleapis.com/auth/business.manage` scope).
4. **Find your account and location IDs** — call `accounts.list` then `accounts.locations.list`
   with that token, or look them up in Business Profile Manager's URL when viewing the location.
5. **Set these on the server:**
   ```
   GOOGLE_BUSINESS_CLIENT_ID=...
   GOOGLE_BUSINESS_CLIENT_SECRET=...
   GOOGLE_BUSINESS_REFRESH_TOKEN=...
   GOOGLE_BUSINESS_ACCOUNT_ID=accounts/1234567890
   GOOGLE_BUSINESS_LOCATION_ID=locations/9876543210
   ```
6. Once set, **Admin → Testimonials** shows a "Sync from Google now" button instead of the
   "not set up yet" note, and pressing it pulls every review and upserts them the same way the
   seed script does (see `src/lib/google-business-reviews.ts`).

Until step 5 is done, the button stays hidden and the manual path (above) is how reviews get on
the site — nothing is broken or half-working in between, it's just one path live and one waiting
on Google's approval.
