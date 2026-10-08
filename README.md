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
2. Enter the credentials below (or set `NEXT_PUBLIC_SHOW_DEMO_CARD=true` to show the **Local preview login** card).
3. Click **Sign in**. The app takes you to `/profile`.

The demo card is hidden on the login page by default. To show it while testing locally, set `NEXT_PUBLIC_SHOW_DEMO_CARD=true` in `.env.local`. The demo login still works without it.


UPDATE users SET role = 'admin' WHERE email = 'shubham14p3@gmail.com';

```text
Email:    demo@nisecomport.test
Password: LocalDemo#2026
```

The demo uses the same editable profile layout as a real account. Changes are temporary; request history, wallet and vouchers start empty. Demo submissions are disabled. The demo login is enabled only in local development and can be turned off with `DEMO_AUTH_ENABLED=false`.

## Pages to check

- `/` home page: hero with search, 8 category tiles, live offers, how-it-works, gallery, guides, FAQ
- `/insurance` car & bike insurance: quote, renewal, expired policy and claim form plus NCB/IDV/add-on guide
- `/services` every service with search and category filters (`/services?category=insurance`), plus each service page
- `/request` the 4-step request flow (service → details → visit/doorstep → review) with the blinking offer rail
- `/print` and `/pan/request` the same 4-step pattern for printing and PAN
- `/offers`, `/gallery` (Google Business photos + illustrated service posters), `/blog`, `/contact`
- `/hi` and `/bn` Hindi and Bengali home pages, and `/hi/services/…`, `/bn/services/…`
- `/login`, `/signup`, `/forgot-password`, `/profile` (sections open with `/profile#requests`, `#addresses`, …)
- `/admin` staff request queue (requires a database account with staff/admin role)

Every page has the **Change language** menu (English, हिन्दी, বাংলা), the live-offer ticker, the chat assistant (quick answers, then a prefilled WhatsApp message) and, on phones, the bottom dock.

## Testing sign-up and sign-in codes without SMTP

In `npm run dev` with no SMTP settings, emails are not sent: the full email, including the 6-digit code, is printed in the terminal that runs `npm run dev` (look for `[dev mail]`). The sign-in page shows a reminder in development. Production builds never do this. To test real delivery, fill the `SMTP_*` settings and run `npm run smtp:check`.

How verification works: sign-up sends a 6-digit code to the email address; the account is created only after the code is entered (codes expire after 10 minutes, 5 attempts). Sign-in uses the password, or an emailed code if the email was never verified. The test admin created by `create-test-admin.mjs` is already verified, so it signs in with its password.

## Google Maps (address search, photos, rating)

Set `GOOGLE_MAPS_API_KEY` (server key with **Places API (New)** and **Geocoding API**) and `GOOGLE_PLACE_ID`. Address search and "use my current location" then work in the request flow, print delivery and saved addresses; `/gallery` and the home page show the shop's Google photos (with photographer credit) and rating. All Google calls run on the server through the encrypted gateway; photos are cached for 12 hours to keep usage low. Without a key, customers type the address manually and the gallery shows the illustrated posters. Your own photos can also go in `public/images/gallery/` (see `src/lib/gallery.ts`).

## Offers

Standing offers (first insurance ₹100 off, free document check, the ₹50 welcome coupon advert) live in `src/lib/offers.ts`: turn them on or off, set an end date, choose the categories where they blink. "First time only" offers are checked on the server when a request is sent; the request is always created and the customer is told if the offer didn't apply. Keep insurance offers on your service charge only (a rebate on an insurer's premium is not allowed).

### Festival and Team India promo codes

Every festival and every big event where India plays gets its own **₹50 code** (orders of ₹150 or more, one use per customer), stored in the `coupons` table:

- **Festivals** (`src/lib/festivals.ts`): Hindu, Bengali, Punjabi & Sikh, Christian, Muslim, Jharkhand & tribal, Jain & Buddhist, other regions and national days (Navratri, Durga Puja, Dussehra, Diwali, Kali Puja, Chhath, Sohrai, Karma, Sarhul, Tusu, Christmas, Eid, Baisakhi, Poila Boishakh, Onam, Pongal…). The code (e.g. `DIWALI26`) goes live **30 days before** the festival and ends on the day.
- **Sports** (`src/lib/sports-events.ts`): Asian Games, Asian Para Games, India's tours, Border–Gavaskar Trophy, WPL, IPL, Asia Cup, the Cricket World Cup, hockey, SAFF football, the World Chess Championship, Pro Kabaddi and LA 2028. Codes run from 30 days before the first match until the final. Events without confirmed dates are marked "dates to be confirmed". Codes avoid tournament trademarks (`T20FEVER27`, not "IPL27").
- **Dates** come from Google's public *Holidays in India* calendar, read once a day by the offers job. A checked fallback list covers Oct 2026 – Dec 2028, and a Google date only replaces a fallback date when it is within a week of it.
- **Welcome coupon:** every customer account that verifies its email gets one personal `WELCOME-XXXXXX` code (₹50 off ₹150+, valid 90 days). Existing verified customers get theirs from the migration.

Where customers see them: the LIVE ticker, the home page, service pages, the offer rail in every step flow, the chat ("Offers & codes"), `/offers` (live codes, a calendar to December 2028 with community filters, Google exports) and **Profile → Vouchers**. All banner text follows the chosen language (English, हिन्दी, বাংলা). Codes are typed (or tapped) at the last step of a request or print order. Print orders get the discount straight away; service requests carry the code and staff take it off the service charge when billing. A cancelled request gives its code back.

Exports:

- `/offers/calendar.ics` (add `?lang=hi` or `?lang=bn`): a calendar feed. `/offers` has a **Subscribe in Google Calendar** button and a per-code "Google Calendar" button.
- `/offers/offers.csv`: in Google Sheets use `=IMPORTDATA("https://www.nisecomport.com/offers/offers.csv")`; `?download=1` saves a file that opens in Excel with Hindi/Bengali intact.

Setup and upkeep:

```bash
npm run db:migrate        # adds the columns, the coupon_redemptions table and all codes to Dec 2028
npm run offers:sync       # refreshes dates from Google now (also part of npm run db:setup)
npm run offers:sync -- --dry   # print the code list without touching the database
```

Schedule the daily job (e.g. 05:00 IST) with the same `CRON_SECRET` as the cleanup job:

```bash
curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://www.nisecomport.com/api/cron/offers
```

In **Admin → Promotions** staff see every code with its dates and how often it was used; the owner can switch a code off (takes effect at checkout immediately), correct tentative dates (the row is then locked so the daily job leaves it alone) or run the Google sync now. To change the amount, minimum or lead time for all codes, edit `FESTIVAL_PROMO` in `src/lib/festivals.ts` and run `npm run offers:sync`.

### Promotions and posters made by hand

**Admin → Promotions → New promotion** creates your own code (e.g. `RENEW50`): English, Hindi and Bengali names and short lines, ₹ or % off, minimum order, dates, uses per customer and total uses, and a poster per language. Hand-made codes appear on `/offers`, the ticker and the step flows while live, exactly like festival codes. Festival and sports codes keep their generated wording; for those you can only add posters or fix dates.

Posters come from the built-in library (`public/promos/insurance/`, 20 insurance posters, see `src/lib/poster-library.ts`) or are uploaded (JPEG/PNG up to 5 MB, stored privately under `PRIVATE_UPLOAD_DIR/media/`, served at `/media/<id>`). Library posters that say "Confirm discount" or "Lowest price guarantee" carry a warning in the picker: on an insurance advert those read as a discount on the premium. Prefer the three "Get your quote" posters or corrected versions.

## Inbox, call-backs and customer records

**Admin → Inbox** (every staff member; owner sees everything) shows:

- **Waiting** counts per service (PAN, government services, insurance, print orders…) from open requests. Tap one to filter the activity.
- **Call these people back**: everyone who left a number in the "NISE COMPORT Help" chat ("Call me back", or simply typing a mobile number). Call / WhatsApp / mark Called, Done or Spam. A staff alert email goes out too.
- **Activity**: new requests and print orders, status changes (who moved what), imports, team changes (owner only), and every time someone opened a customer's records. The tab shows a red count of new items.

**Admin → Records** (permission "Customer records") imports the shop's Excel registers:

- Upload an `.xlsx`; **every sheet** is read. The header row and the service (PAN, insurance, passport, ITR, DL, Aadhaar, Ayushman, income/caste/residence/EWS certificates, bank account…) are worked out from the file and sheet names. Sheets that are the shop's own accounts (expenses, rates, trading, transactions) are skipped and listed in the report.
- Rows need a name plus a mobile, PAN or Aadhaar. Columns with portal **passwords, PINs and user IDs are never imported**. Everything is encrypted (AES-256-GCM with `RECORDS_ENCRYPTION_KEY`); mobile/PAN/Aadhaar also get keyed hashes so people can be searched and counted without decrypting. Aadhaar stays masked. The uploaded workbook is deleted after import.
- Upload the same or an overlapping file again and only new rows are added.
- The list shows one row per person (by mobile, else PAN) with **how many times they appear** across all registers, their services, last date and next insurance renewal (policy date + 1 year when the sheet has no renewal column). Search by name, mobile, PAN, Aadhaar or the last 4 digits; sort by most repeated, most recent or next renewal.
- Contact details are picked up wherever a sheet has them: main mobile, other mobiles ("L.Mob"), WhatsApp number, email and address/locality. Search works on any of those numbers and on email. Customers can also add a separate WhatsApp number in their profile; staff see Call / WhatsApp / Email buttons on every request.
- Abuse limits: 150 record opens and 600 searches per staff member per hour, 20 imports per hour, at most 100,000 rows / 40 sheets per workbook. The raw upload is deleted even if an import fails.
- Optionally the mobile numbers are added to WhatsApp contacts (as "not asked yet", with the service and renewal date), ready for renewal campaigns. Existing YES/STOP answers are kept.

Set `RECORDS_ENCRYPTION_KEY` (`openssl rand -base64 32`) and back it up before the first import; `npm run db:migrate` adds the tables (migrations 0008 and 0009).

### Where a code works, caps, personal codes and abuse protection

- **Where a code works:** every promotion (hand-made, festival or sports) can be limited in **Admin → Promotions → Edit / Posters & services** to print orders, PAN requests, whole categories or single services. Elsewhere the code is refused with "This code works only on: …", and the request flow and print page only suggest codes that fit. % codes can have a **maximum discount** in rupees.
- **Personal codes** (Admin → Promotions → Personal codes): one unique code per customer (e.g. `DIWALI-7KQ2M9XA`), bound to their account so a copied code is useless, usable N times (default 2), only on the chosen services, for chosen customers (emails/mobiles), customers who used certain services, customers who haven't come back in N days, or everyone. "Count customers" shows the reach first; customers can be emailed their code, and each code has a one-tap WhatsApp share. Switch a whole batch off at any time.
- **Guessing protection:** codes only work for signed-in customers; more than 8 wrong codes an hour (20 a day) locks the code box for that account. Code-checks are also limited to 40 an hour.

## Site content (banners and services from the admin area)

**Admin → Site content** (permission "Site content"):

- **Banners** for the thin strip at the top of every page, the home page, the services page or service pages (optionally only some categories). Headline, short text and button in English/Hindi/Bengali, a link (a page on the site, WhatsApp or tel:), an optional poster image, colour, order and start/end dates. Changes show within a minute.
- **New services**: title, web address, category, description, search words, what we do, documents, steps and FAQs. Each gets its own `/services/…` page and appears in the services list, the request flow, the chat search and the sitemap.
- **Hide built-in services** you no longer offer (and show them again).

Run `npm run db:migrate` for migration 0010.

## Your photos (gallery and service pages)

1. Put photos (JPG, PNG, WebP, HEIC…) in `photo-inbox/<service>/`, e.g. `photo-inbox/pan-card/`, `photo-inbox/aadhaar/`, or `photo-inbox/shop/` for the counter and team. Folder names are listed in `photo-inbox/README.md`.
2. Run `npm run photos`. Each photo is turned upright, stripped of GPS/camera data, resized to 1600 px and saved as WebP with an SEO name (`public/images/gallery/photos/pan-card-telco-jamshedpur-1.webp`), title and alt text in `src/lib/gallery-photos.ts`. Originals move to `photo-inbox/_done/` (never uploaded to GitHub). Running it again skips photos already added.
3. Commit `public/images/gallery/photos/` and `src/lib/gallery-photos.ts`, then deploy.

Other ways: `npm run photos -- "C:\path\to\folder"`, `npm run photos -- --service voter-id photo1.jpg photo2.jpg`, or `npm run photos -- https://…/photo.jpg` (your own photos only).

Photos appear on `/gallery` (filter chips per service, `/gallery?service=pan-card` opens one service), as a "From our desk" strip on that service's page, on the home page, in the image sitemap and as ImageObject data for Google Images.

## Car & bike insurance (`/insurance`)

One page for new policies, renewal before expiry, expired policies and claims, for cars and two-wheelers:

- **Quote / claim form**: purpose, bike or car, vehicle number, make/model, current policy (insurer, end date, NCB, claim last year), cover and add-ons wanted (or what happened, for a claim), contact details. Signed-in customers can attach the RC, old policy, photos or FIR and get a tracked request (`NC-…`); guests become a call-back in **Admin → Inbox** with the full details. The policy end date is saved on the contact for the renewal reminder campaign.
- **Knowledge**: policy types, what's covered and not, 10 add-ons, NCB slabs, IDV depreciation, bike third-party rates, renewal rules (45-day window, 90-day NCB rule, fines), premium factors, documents for new/renewal/claim, claim steps and common rejection reasons, FAQs. Content lives in `src/lib/motor-insurance.ts`.
- **Facilitator wording** (page, form consent, chat, bike/car service pages): NISE COMPORT arranges the policy and supports the customer until the claim is settled; the insurance company issues the policy and decides/pays claims, and NISE COMPORT is not liable for the insurer's decisions. Check this text and add your registration line (e.g. POSP / corporate agent / broker code) as your insurer or broker requires.
- **Insurer logos**: none are bundled. Upload a logo in **Admin → Site content → Banners** with placement **Insurer logo**, only for insurers you're authorised to sell through. Without uploads the page shows insurer names as text, with a "names belong to their owners" note.
- The chat's insurance guide has New vehicle / Renew / Expired / Claim, each linking to the form. Bike and car service pages link to `/insurance`.

Run `npm run db:migrate` for migration 0011 (adds `leads.details`).

## WhatsApp campaigns

**Admin → Contacts** holds everyone the shop may message: name, mobile (stored once, however many lists it appears in), language, services with renewal/expiry dates, and whether they said YES or STOP. **Admin → WhatsApp campaigns** sends to them.

- **Kinds:** *renewal reminder* (people whose service is due within N days and who haven't said STOP), *offer* (only people who replied YES) and *ask permission* (a YES/STOP question to people not asked yet). Every message except the question ends with "Reply STOP to stop these messages". A STOP (typed in English, हिन्दी or বাংলা) is final: that number is skipped in every campaign and every later import.
- **Messages** are written in English, Hindi and Bengali (defaults provided) with `{name}`, `{service}`, `{date}`, `{code}` and `{phone}`; each contact gets their language. A poster per language is sent with the message.
- **Pacing:** at most **10 per round**, messages inside a round 25–90 seconds apart, then a random pause of **10–30 minutes** (plus up to a minute) before the next round, a daily limit (default 10) and sending hours 09:00–20:00 IST (after hours or at the limit, it continues next morning at a slightly different time). Set "Messages per round" to 1 to space every single message 10–30 minutes apart. **Preview schedule** on a campaign shows the rounds, or run:

  ```bash
  npm run campaign:preview -- 25                 # 25 messages with the default pacing
  npm run campaign:preview -- 40 --daily 30 --gap 10-30 --batch 10 --window 9-20
  ```

- **Send test** sends to the campaign's test numbers only (any time, not counted). **Start**, **Pause**, **Resume**, **Stop** and **Run now** control the real run.
- **How messages go out:**
  - *One-tap* (default, works today): due messages appear under **Ready to send**. Tap **Open in WhatsApp** (opens the chat with the text filled in; attach the poster from the link), send, then **Mark sent**. Mark YES/STOP replies in Contacts.
  - *Automatic*: with the WhatsApp Business (Cloud) API, messages are sent as an approved template and replies/receipts come back through the webhook, including STOP. Nothing unofficial (no WhatsApp Web automation) is used, so the shop number isn't put at risk.

A dummy campaign is created by the migration: **Insurance renewal (dummy test)**, one-tap, test number **+91 80927 66575**, with a matching test contact. Open it and press **Send test**.

Schedule the campaign job every 5 minutes with the same `CRON_SECRET`:

```bash
curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://www.nisecomport.com/api/cron/whatsapp
```

To switch on automatic sending (optional):

1. In Meta Business Suite create a WhatsApp Business app, add the shop number and get a permanent access token and the phone number ID.
2. Create a Marketing or Utility template, e.g. name `nise_renewal_v1`, with an image header and the body `Namaste {{1}}, {{2}} — NISE COMPORT, Telco. Reply STOP to stop these messages.` in each language you use (`en`, `hi`, `bn`). Wait for approval.
3. Set `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN` (and optionally `WHATSAPP_API_VERSION`) in the server environment.
4. In the Meta app set the webhook URL to `https://www.nisecomport.com/api/whatsapp/webhook` with the same verify token, and subscribe to `messages`.
5. Edit the campaign, choose "Automatically (Business API)" and enter the template name.

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

## Using the hosted PostgreSQL database locally

The application, Drizzle migrations and database tools now use the same `.env.local` connection.

For local development with the hosted PostgreSQL database:

```bash
npm ci
npm run db:check
npm run db:setup
npm run dev
```

- `npm run db:check` connects using `DATABASE_URL`, shows only the host/database/user and schema status, and never prints the password.
- `npm run db:setup` checks the connection, applies all Drizzle migrations, then checks again.
- `/api/health` also performs a live `select 1` check when the Next.js app is running.

When developing on your own computer, set `DATABASE_URL` to the hosting server's public PostgreSQL host. When Next.js is deployed on the same hosting server as PostgreSQL, change only the host portion to `localhost` (or provide a server-level `DATABASE_URL`); the database name, user and encoded password remain the same.

If `db:check` reports a timeout or connection refusal while the URL is correct, enable remote PostgreSQL access or whitelist your current public IP in the hosting control panel. A network block is different from an authentication error.

## Staff access

Create an account through the signup page, then promote it from PostgreSQL as the first administrator (the owner):

```sql
UPDATE users SET role = 'admin' WHERE email = 'owner@example.com';
```

Open `/admin` after signing in. The workspace has tabs, and each person only sees the tabs they may use:

| Tab | Permission | What it allows |
| --- | --- | --- |
| Requests | `requests` | the request and print queue, customer files, status changes |
| Customer records | `records` | importing Excel registers and looking customers up (every view is logged) |
| PAN data | `pan` | importing PAN lists and looking up records |
| Promotions | `promotions` | creating codes by hand, posters, switching codes on or off, date fixes |
| WhatsApp campaigns, Contacts | `campaigns` | contacts, campaigns and the send queue |
| Wallet | `wallet` | recording approved promotional wallet credits (no payments) |
| Team | owner only | adding and removing employees and ticking their permissions |

**Admin → Team → Add an employee**: enter their email and tick what they may do. An existing customer account is turned into a staff account; otherwise a new staff account is created and they get an email telling them to sign in with "Sign in with an email code" and set a password from their profile. **Remove from team** turns them back into a customer, clears their permissions and signs them out everywhere. Staff accounts that existed before this update keep access to Requests only until the owner ticks more.

Every staff API checks the permission on the server (`requirePermission()` in `src/lib/auth.ts`, rules in `src/lib/permissions.ts`); hiding a tab is only cosmetic. Customers never see the workspace, even with stray permissions in the database.

## What a customer flow does

1. Browse a category or service page, or search `/services`.
2. Send a request in 4 steps: service, details (+ optional file after sign-in), visit / call-back / doorstep / online, review. Signed-out visitors fill everything first, sign in at the end and land back on the review step.
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
- `CRON_SECRET` – then call `/api/cron/cleanup` every 10–15 minutes (GET or POST with `Authorization: Bearer …`). It sends queued emails with retries and removes expired codes, sessions, rate-limit rows and files. Call `/api/cron/offers` once a day with the same header to refresh festival and sports promo codes.
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

## Opaque private browser transport

Private customer/staff operations do not use readable business API endpoints from the browser. Public SEO pages remain normal readable URLs, while authenticated data and actions use one opaque endpoint: `/api/x7q9m2`.

For each browser request the client generates an ephemeral P-256 ECDH key, derives independent request/response AES-256-GCM keys with HKDF-SHA-256, and uses a fresh salt, IV, nonce and timestamp. The server accepts only a short clock window and records authenticated nonces in PostgreSQL to reject replays. Application status codes and response bodies are encrypted; valid encrypted exchanges use a constant outer HTTP status.

Private uploads and downloads use the same authenticated encryption as binary envelopes. Document names, file IDs, request IDs and file contents are not sent in readable URL query parameters or request bodies. Private request/admin detail pages no longer put database IDs or request references in the URL, and Profile/Admin record data is loaded after page render through the encrypted channel rather than serialized into the initial RSC payload.

The previous private `/api/auth/*`, `/api/profile`, `/api/requests*`, `/api/uploads`, `/api/admin/*` and related handlers remain server-internal so their proven validation/business logic can be reused; direct browser access receives an empty 404 unless the request carries the server-only internal dispatch token.

Generate a fresh transport keypair and internal token for each environment:

```bash
npm run api:keygen
```

Set all three printed values in the deployment environment. Keep `API_ENVELOPE_PRIVATE_JWK` and `INTERNAL_API_TOKEN` server-only. `NEXT_PUBLIC_API_ENVELOPE_PUBLIC_JWK` is intentionally public.

Run the transport regression check before deployment:

```bash
npm run security:check
```

For the full verification sequence:

```bash
npm run verify
```

Application-layer encryption supplements HTTPS; it does not replace TLS. A browser owner can always inspect data after their own browser decrypts it for display, but private values are not readable in the Network request/response payloads or private record URLs.
