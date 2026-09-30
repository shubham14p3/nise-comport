# NISE COMPORT – flows, scenarios and how to test them

Every customer, staff and search-engine flow, with the expected behaviour, where it lives in the code and a quick manual test.
Scenario IDs match the requirements document (S = sign-up, L = sign-in, R = reset, P = profile, Q = requests, A = admin, X = cross-cutting, SEO = search).

Status key: **Done** = implemented in this branch · **Config** = works once you set an environment value · **Owner** = needs a business decision or action outside the code.

---

## 1. Sign-up with email code (`/signup`)

Flow: name, email, optional phone, password → `POST /api/auth/request-otp` → 6-digit code by email → `POST /api/auth/verify-otp` (creates the account and signs in) → back to `?next=` or `/profile`.

| ID | Scenario | Expected behaviour | Where | Status |
|---|---|---|---|---|
| S-01 | Happy path | Code emailed, account created only after the code is verified, signed in, redirected to `next` | `lib/auth.ts` `requestEmailOtp`, `verifyEmailOtp` | Done |
| S-N01 | Invalid email | Inline error; nothing sent | `looksLikeEmail` | Done |
| S-N02 | Email typed with capitals/spaces | Trimmed and lower-cased everywhere | `normalizeEmail` | Done |
| S-N03 | Email already registered | Same on-screen message as a new email (no account discovery). The owner gets a “you already have an account” email instead of a code | `requestEmailOtp` + `sendAccountExistsEmail` | Done |
| S-N05 | Weak password (short, common, repeated, contains email/name) | Hint while typing, blocked on submit and on the server | `passwordProblem` | Done |
| S-N06 | Invalid phone | Accepts `98765 43210`, `098765-43210`, `+91…`; saves `+919876543210`; rejects impossible numbers | `normalizePhone` | Done |
| S-N07 | SMTP down or slow | Code is deleted, clear “couldn’t send the email” 503; mail timeouts stop a hung request | `issueCode`, `email.ts` timeouts | Done |
| S-N08 | Wrong code | “That code doesn’t match. N attempts left.” | `consumeOtp` | Done |
| S-N09 | 5 wrong codes | Code destroyed; must request a new one | `consumeOtp` | Done |
| S-N10 | Expired or replaced code | “This code has expired or a newer code was sent” | `consumeOtp` (only newest code is kept) | Done |
| S-N11 | Code used twice (double tap, two tabs) | Atomic delete: second use gets “already used” | `consumeOtp` | Done |
| S-N12 | Resend too fast | Button counts down 60 s; server limits 1/min, 5/hour, 10/day per email and 60/hour per network (generous because customers often sign up on the shop Wi-Fi) | `rate-limit-core.ts` | Done |
| S-N14 | Two sign-ups race for one email | Unique index + friendly 409 “account already exists” (no database error leaks) | `isUniqueViolation` | Done |
| S-N15 | Mail lands in spam | Screen tells the user to check spam/promotions; set SPF, DKIM, DMARC for the sender domain | auth panel copy | Done + **Owner** (DNS) |
| S-N17 | Bots | Hidden honeypot field + per-IP limits | `hp-field`, `request-otp` route | Done |
| S-N18 | Offline / network error | “You appear to be offline”, typed data kept | `auth-panel.tsx` | Done |
| S-N19 | Bad password fixed after the code step | Password/name/phone errors send the user back to the details step without burning the code | `validateSignupProfile` runs before `consumeOtp` | Done |

**Test:** sign up twice with the same email (second time: no code, “already have an account” email). Enter a wrong code 5 times. Request codes quickly (see the countdown and the 429).

## 2. Sign-in (`/login`)

| ID | Scenario | Expected behaviour | Where | Status |
|---|---|---|---|---|
| L-01 | Password sign-in | Session cookie (HttpOnly, Secure in production, SameSite=Lax, 14 days) | `signInWithPassword` | Done |
| L-02 | Email-code sign-in | “Sign in with an email code”; same response whether or not the email exists | `requestEmailOtp("signin")` | Done |
| L-N01 | Wrong email or password | Always “Email or password is incorrect.”; unknown emails still run a real Argon2 check (no timing leak) | `dummyHash` | Done |
| L-N02 | 5 wrong passwords in 15 min | Password sign-in paused for that email for the rest of the window (20/day limit too); email-code sign-in and reset still work | `RATE_RULES.passwordFailures*` | Done |
| L-N03 | Correct password, email not verified | Code sent, screen switches to code entry | `signInWithPassword` | Done |
| L-N04 | Disabled or deleted account | Treated like a wrong password; existing sessions stop working | `isActive`, `getCurrentUser` | Done |
| L-N05 | `?next=` pointing to another site (`//evil.com`, `/\evil.com`, `https://…`) | Ignored → `/profile` | `safeNextPath` | Done |
| L-N06 | Already signed in and opens `/login` or `/signup` | Redirected to `next` or `/profile` | login/signup pages | Done |
| L-N07 | Signed out while filling a service request | Typed description saved in the tab, restored after sign-in | `request-service-form.tsx` | Done |
| L-N09 | Cross-site POST (CSRF) | SameSite=Lax cookie + Origin/Sec-Fetch-Site check → 403 | `src/proxy.ts` | Done |
| L-N10 | Database briefly down | Header shows “Sign in” instead of crashing; API returns 503 with a friendly message | `/api/auth/session`, `apiError` | Done |

## 3. Forgot / reset password (`/forgot-password`)

| ID | Scenario | Expected behaviour | Status |
|---|---|---|---|
| R-01 | Happy path | Email → code → new password → all devices signed out → signed in here → “password changed” email | Done |
| R-N01 | Unknown email | Same message, no email sent | Done |
| R-N02 | Too many requests | Same limits as sign-up codes | Done |
| R-N03 | Wrong/expired/used code | Same messages as sign-up | Done |
| R-N04 | Weak new password or mismatch | Blocked in the browser and on the server; code not burned | Done |
| R-N05 | Account was locked after wrong passwords | Reset clears the lock | Done |

## 4. Profile (`/profile`)

| ID | Scenario | Expected behaviour | Where | Status |
|---|---|---|---|---|
| P-01 | Edit name, phone, city, state, PIN, contact preference | Saved; phone normalised to +91 | `api/profile` | Done |
| P-N01 | Invalid phone/PIN, empty name | Field messages, nothing saved | `api/profile` | Done |
| P-N02 | WhatsApp/phone updates chosen without a phone | Refused with a clear message | `api/profile` | Done |
| P-N03 | Edited in two tabs | Second save gets 409 “changed in another tab, reload” | `expectedUpdatedAt` | Done |
| P-03 | Change sign-in email | Password check → code to the NEW address → change → notice to the OLD address | `requestEmailChange`, `confirmEmailChange` | Done |
| P-N04 | New email already used | Clear 409 | same | Done |
| P-04 | Change password | Current password needed; other devices signed out; email notice | `changePassword` | Done |
| P-05 | Sign out of other devices | Shows number of devices; keeps this one | `/api/account/sessions` | Done |
| P-06 | Delete account | Password + type DELETE; personal data removed, service records kept anonymously; files scheduled for deletion; goodbye email | `deleteAccount` | Done |
| P-N05 | Delete with open requests | Blocked: cancel or finish them first | `openWorkCount` | Done |

## 5. Service, PAN and print requests

| ID | Scenario | Expected behaviour | Where | Status |
|---|---|---|---|---|
| Q-01 | Service enquiry | Reference `NC-YYMMDD-XXXXXX`, opens the request page, customer confirmation email + staff alert email | `api/requests`, `notifyNewRequest` | Done |
| Q-02 | PAN assistance form | Reference `PAN-…`, validation for every PAN route (minor, entity, correction…) | `api/pan/requests` | Done |
| Q-03 | Print order | Page count re-checked on the server, coupon re-validated, pickup time in India time | `api/print-jobs` | Done |
| Q-N04 | Double click / retry after network error | Idempotency key: one request only, the retry gets the same reference | `idempotencyKey` columns | Done |
| Q-N05 | Spam | 10 requests/hour and 30/day per account, 15 print orders/hour, 40 uploads/day | `RATE_RULES` | Done |
| Q-N06 | Attachment over 20 MB or wrong type | Rejected in the browser and on the server (file signature checked) | `api/uploads` | Done |
| Q-N07 | Customer cancels | Allowed while submitted / being reviewed / waiting for customer; staff alerted; history recorded | `cancelServiceRequest` | Done |
| Q-N08 | Cancel after work is ready | Refused with “call or WhatsApp the desk” | same | Done |
| Q-N09 | Email fails | Request is still saved; email retried by cron up to 5 times | `notifications.ts` | Done + **Config** (cron) |
| Q-N10 | Another customer’s reference in the URL | 404 (ownership checked) | request page | Done |
| Q-N11 | Identity numbers/OTP in notes | Form tells customers not to; PAN form refuses file attachments | forms | Done |

## 6. Staff and admin (`/admin`)

| ID | Scenario | Expected behaviour | Status |
|---|---|---|---|
| A-01 | Filter queue by status, search by reference/name/email/phone | Server-side filters | Done |
| A-02 | Change status | Customer emailed (sent immediately, retried by cron), history saved with staff name | Done |
| A-N01 | Two staff change the same item | Second change refused with “someone else changed this, refresh” | Done |
| A-N02 | Customer opens `/admin` | Redirected to profile; staff API returns 403 | Done |
| A-03 | Request history | `/admin/requests/[id]` shows every status change, who made it and notes | Done |
| A-04 | Promote first admin | `UPDATE users SET role = 'admin' WHERE email = '…';` | **Owner** |

## 7. Cross-cutting

| ID | Scenario | Expected behaviour | Status |
|---|---|---|---|
| X-01 | Unexpected server error | Logged on the server; customer sees a generic message (no SQL, paths or stack traces) | Done |
| X-02 | Database/SMTP down | 503 with phone number; `/api/health` returns 503 for monitoring | Done |
| X-03 | Unknown URL | Friendly 404 page with links, real HTTP 404 | Done |
| X-04 | Page crash | `error.tsx` with “Try again”; `global-error.tsx` as last resort | Done |
| X-05 | Old website URLs (`/service-details/…`, `/blog-details/…`, `/offer…`, `/home`) | Permanent redirects to the matching new page | Done |
| X-06 | www vs non-www | One canonical host, the other redirects (308) | Done + **Config** |
| X-07 | Housekeeping | Every 10–15 min: send emails, delete expired codes/sessions/rate-limit rows and expired private files | **Config** (cron) |
| X-08 | Security headers | HSTS, nosniff, frame, referrer and permissions policies | Done |
| X-09 | Private pages | `X-Robots-Tag: noindex` on `/admin`, `/profile`, `/login`, `/signup`, `/forgot-password`, `/pan/request`, `/api` | Done |
| X-10 | Timezone | Dates shown in India time; schedules stored as UTC | Done |
| X-11 | Accessibility | Skip link, labelled fields, `role="alert"` errors, breadcrumbs `aria-current` | Done |

## 8. SEO checklist

| ID | Item | Status |
|---|---|---|
| SEO-01 | Server-rendered pages with one keyword-rich H1 each (home H1 now names CSC, Pragya Kendra, Telco, Jamshedpur) | Done |
| SEO-02 | Unique titles ≤ ~65 characters, descriptions 70–160 characters; no more “in Jamshedpur in Jamshedpur” or double brand names (tested) | Done |
| SEO-03 | Canonical URL on every page; root layout no longer forces `/` as canonical or `og:url` on every page | Done |
| SEO-04 | JSON-LD: Organization, LocalBusiness/ProfessionalService with offer catalogue, WebSite, Service, Article, BreadcrumbList, FAQPage, ItemList, ContactPage/AboutPage | Done |
| SEO-05 | Raster PNG share previews for every page through the dynamic `/api/og` endpoint (WhatsApp/Facebook ignore SVG) | Done |
| SEO-06 | Shared footer with identical name, address and phone on every page + links to top services | Done |
| SEO-07 | Hindi pages (`/hi`, 12 service pages) with reciprocal hreflang | Done (native-speaker review: **Owner**) |
| SEO-08 | 11 new local guides, 5 new service pages, Areas-we-serve hub (one page, not doorway pages) | Done (confirm services: **Owner**) |
| SEO-09 | Sitemap from one route list with real dates, images and hreflang; robots allows crawling | Done |
| SEO-10 | RSS feed, `llms.txt`, IndexNow key + ping script, web app manifest and icons | Done + **Config** |
| SEO-11 | Opening hours, map pin, Google Business Profile link, review link, social profiles | **Config** (env) |
| SEO-12 | Google Search Console + Bing Webmaster verification tags | **Config** (env) |
| SEO-13 | Google Business Profile claimed, same NAP, categories, photos, reviews | **Owner** |
| SEO-14 | Fix old directory listings that say “V P Singh Building” or “Old Sector Market” | **Owner** |

**Post-deploy test:** `npm run build && npm start`, then `SITE_URL=http://localhost:3000 npm run seo:check` (checks every sitemap URL for status, H1, title, description, canonical, JSON-LD, and that private pages are noindex).
