# NISE COMPORT

Next.js application for NISE COMPORT, the independent CSC / Pragya Kendra service centre in Kharangajhar, Telco, Jamshedpur.

## Start the website locally

Use Node.js 22.13 or newer. From the repository root:

```bash
npm ci
npm run dev
```

Open **http://localhost:3000**. You do not need PostgreSQL or SMTP to explore the local demo pages.

### Local demo sign-in

1. Click **Sign in** in the top navigation.
2. In **Local preview login**, use **Fill demo details** (or enter the credentials below).
3. Click **Sign in**. The app takes you to `/profile`.

```text
Email:    demo@nisecomport.test
Password: LocalDemo#2026
```

The demo uses the same editable profile layout as a real account. Changes are temporary; request history, wallet and vouchers start empty. Demo submissions are disabled. The demo login is enabled only in local development and can be turned off with `DEMO_AUTH_ENABLED=false`.

## Pages to check

- `/` home page and links to the main sections
- `/services` service categories and individual service pages
- `/gallery`, `/offers`, `/social`, `/team`
- `/blog` and individual local service guides
- `/print` document upload and estimate request flow
- `/login`, `/signup`, `/profile`
- `/admin` staff request queue (requires a database account with staff/admin role)

The global header links to Services, Gallery, Offers, Guides, Social and Contact. It shows **Sign in** when signed out; for a signed-in customer it shows **My profile** and **Sign out**. On smaller screens, use **Menu** for navigation.

The customer profile uses a section menu for Overview, My requests, Request history, Print orders, Wallet, Vouchers & offers, Saved addresses, Profile details, Sign-in & privacy and Get help. Selecting a section updates the content panel rather than extending one long page. New request references open a private request-detail page.

## Real account and backend setup

The preview credentials are not a real database user. For persistent accounts, requests, uploads, and wallet history, configure PostgreSQL and SMTP:

```bash
cp .env.example .env.local
```

Edit `.env.local` and set at least:

```env
DATABASE_URL=postgres://USER:PASSWORD@localhost:5432/nise_comport
SMTP_HOST=your-mail-host
SMTP_PORT=465
SMTP_USER=your-mailbox@nisecomport.com
SMTP_PASSWORD=your-mailbox-password
SMTP_FROM="NISE COMPORT <your-mailbox@nisecomport.com>"
OTP_SECRET=use-a-long-random-secret
PRIVATE_UPLOAD_DIR=/absolute/path/outside-the-repo/private-uploads
```

Then create the database and apply migrations (including the profile city, state, PIN code, contact preference and optional note fields):

```bash
npm run db:generate
npm run db:migrate
npm run dev
```

Sign up using a real email address. The app sends a six-digit verification code via your SMTP mailbox. After verification, sign in to see persistent service request and print-job history. Store real uploaded files outside `public/`; do not commit `.env.local` or customer documents.

## Staff access

Create an account through the signup page, then promote it from PostgreSQL as the first administrator:

```sql
UPDATE users SET role = 'admin' WHERE email = 'owner@example.com';
```

Open `/admin` after signing in. Staff can review requests and update statuses. Administrators can record an approved promotional wallet credit against a customer email. This writes to the wallet ledger; it does not take payment. Customers can view their balance and entries under **My profile → Wallet**. Online top-up/payment processing is not enabled.

## What a customer flow does

1. Browse a service page to read steps and document requirements.
2. Send a request with a description and optional supporting file.
3. Check its reference, submitted details and status in the customer profile.
4. For printing, upload a document, inspect the page count/preview, choose pages and pickup/delivery, then **send a request**.
5. The service team checks availability and confirms the final quote. Print submission is not a checkout and no online payment is taken.
6. Use WhatsApp click-to-chat for direct questions. Automatic WhatsApp notifications need Meta Business Platform credentials and are not configured in this repo.

Government, bank, insurer and partner portals make their own eligibility and approval decisions. NISE COMPORT provides assistance and does not guarantee an outcome. Official or third-party charges are separate from NISE COMPORT's service charge.

## Verification and production

```bash
npm run lint
npm run test
npm run build
npm run start
```

Set a production `NEXT_PUBLIC_SITE_URL`, persistent PostgreSQL database, SMTP credentials, stable secrets, and private upload directory before deployment. `NEXT_PUBLIC_WHATSAPP_PRIMARY` and `NEXT_PUBLIC_WHATSAPP_SECONDARY` configure the click-to-chat numbers. Configure `LIBREOFFICE_BIN` if Word document conversion is required. Back up the database and private upload store according to the retention policy.

## PAN assistance and expanded profile (review branch)

After pulling `review/nise-seo-nextjs`, run `npm ci` and `npm run dev`.

- `/pan`: PAN service hub, linked from the header and the existing PAN service page.
- `/pan/application`, `/pan/correction`, `/pan/aadhaar-linking`, `/pan/status`, `/pan/epan`, `/pan/forms`, `/pan/reprint`, `/pan/issues`: separate guides and searchable troubleshooting.
- `/pan/request`: sign in, choose a request type, enter applicant/contact information, select prepared documents, confirm consent, review, then submit. Contact details prefill from the account. The same form supports new, correction, reprint, minor, minor-to-adult, marriage, entity and surrender assistance.
- Validation runs in the browser and on the server: required details, email, phone, real date, age/guardian, entity representative, Indian PIN, existing-PAN routing, correction selection and consent.
- Real submissions are saved to PostgreSQL and open `/profile/requests/REFERENCE`. These pages are private to the owner. Staff can read the saved form using **Read submitted request details** in `/admin` and update status from the queue.
- `/profile`: left-side sections for account details, requests/history, print orders, wallet, available coupons, addresses, security and help. Edit name, phone, city, state, PIN, contact preference and profile note. The overview links to PAN help. Wallet totals include the full recorded ledger. Public active coupon codes show their value, minimum order and expiry.
- The local demo now uses the **same editable profile layout**, with empty account records. Preview edits are temporary and clearly labelled; there is no fabricated wallet balance or government application. Real profile edits require PostgreSQL and the migrations, including `0003_customer_profile_fields.sql` (`npm run db:migrate`).

The PAN form is a NISE assistance intake, not an official government form. It does not take payment, upload identity documents or submit to UTIITSL/Protean. Staff arrange the required evidence after reviewing the request. Do not put identity numbers or OTPs in notes.

The status helper validates a reference's basic format and opens the selected official tracker. It does not claim to retrieve live status; provider CAPTCHA/verification remains on the official site. Google OAuth, online wallet top-ups and automatic WhatsApp delivery are not added by this change.

Verification: `npm run lint`, `npm test`, `npm run build`. Real PostgreSQL persistence and SMTP delivery need your configured environment; a successful build alone does not verify those external integrations.

## Security, request flows and SEO update

This update closes the gaps found in the flow review. Full scenario list with manual tests: [`docs/SCENARIOS.md`](docs/SCENARIOS.md).

### After pulling

```bash
npm ci
npm run db:migrate          # applies drizzle/0004_security_flows_seo.sql
npm run lint && npm test && npm run build
```

Set the new environment values (see `.env.example`). The important ones:

- `OTP_SECRET` – **required in production**, 32+ random characters (`openssl rand -base64 48`). Email codes are refused without it.
- `NEXT_PUBLIC_SITE_URL` – the one canonical host. The live site redirects to `www`, so the default is `https://www.nisecomport.com`; the other host is 308-redirected.
- `CRON_SECRET` – then call `/api/cron/cleanup` every 10–15 minutes (GET or POST with `Authorization: Bearer …`). It sends queued emails with retries and removes expired codes, sessions, rate-limit rows and files.
- `STAFF_ALERT_EMAIL` – receives new-request and cancellation alerts.
- `NEXT_PUBLIC_OPENING_HOURS`, `NEXT_PUBLIC_GEO_LAT/LNG`, `NEXT_PUBLIC_GOOGLE_MAPS_URL`, `NEXT_PUBLIC_GOOGLE_REVIEW_URL`, `NEXT_PUBLIC_SAME_AS` – shown on the site and in structured data only when set. They must match the Google Business Profile.
- `GOOGLE_SITE_VERIFICATION`, `BING_SITE_VERIFICATION`, `INDEXNOW_KEY` – search-engine verification and instant indexing.

### What changed

- **Accounts:** no account discovery through sign-up/sign-in/reset; rate limits and sign-in lockout stored in PostgreSQL (`rate_limits`); forgot/reset password; change password; change sign-in email with a code to the new address; sign out of other devices; delete account (anonymised, blocked while requests are open); disabled/deleted users can’t sign in; safe `?next=` redirects; Indian phone numbers normalised to +91.
- **Errors:** API errors never expose SQL, file paths or stack traces (`PublicError` + `apiError`); 404, error and global-error pages; `/api/health` for monitoring.
- **Requests:** idempotency keys (no duplicates on double-click), safe reference numbers, customer cancellation, status history (`request_events`), optimistic locking for staff, confirmation + staff emails sent immediately with cron retries, admin filters and search.
- **SEO:** central NAP config (`src/lib/site.ts`), JSON-LD graph, fixed titles/descriptions/canonicals, raster PNG share previews (`python3 scripts/generate-og-images.py`), global footer, breadcrumbs, 12 Hindi pages with hreflang, 11 new guides, 5 new services (`published: false` hides one), Areas-we-serve page, legacy URL redirects, sitemap with real dates/images/hreflang, RSS, `llms.txt`, IndexNow, manifest and icons, security headers.

### SEO tools

```bash
npm run seo:check      # after `npm run build && npm start`: checks every sitemap URL
npm run seo:indexnow   # after a production deploy (needs INDEXNOW_KEY on the server and locally)
python3 scripts/generate-og-images.py   # after adding a service or guide (needs Pillow)
```
