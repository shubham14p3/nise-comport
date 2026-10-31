# Optimization overview, verification and rollout

Baseline reviewed: `fix/login-api-assets-20261030` at `a617c92`. Proposed result: `perf/dashboard-api-20261030`, draft PR #52. No production deployment or live database migration has been performed by this work.

## Before and after

| Area | At the starting branch | Proposed result |
|---|---|---|
| Four dashboard groups | Already existed | Preserved; no navigation/permission redesign |
| Main panels | Most already lazy; Counter, Find customer and request-detail components eager | These remaining heavy components load on demand |
| Team accordions | Closed forms still mounted/fetched | First-open loading; reopening preserves form state and avoids refetching |
| Pagination | Several UIs had controls, but the encrypted gateway discarded their page/size fields | Requests, Records, Contacts, PAN, Coupon usage, Payments, Outreach, Wallet and Customers selectors reach their endpoints |
| Customers | Latest 50 matches only | 10/20/50-row SQL pages, matching total, stable ordering and emptied-last-page recovery |
| Inbox/Mail | Dashboard and panel had overlapping polling ownership | Inbox summary returned with Inbox; MailClient owns Mail metadata refresh |
| Counter reads | 5 SELECTs plus a read-only BEGIN/COMMIT | 4 SELECTs, contact data reused, independent details read in parallel; money writes/locks retained |
| Late requests | Older responses could replace newer pages/chats | Request sequence guards; old-conversation messages and send errors ignored |
| Public navigation | 160 links retained automatic Next page prefetch | All 230 Next Link usages explicitly disable prefetch; clicked destinations still load normally |
| Shared shell | Birthday effect reran for every public pathname; form startup bypassed shared session reads | Public-route eligibility drives birthday checks; Insurance/Print/Request startup reuses the existing 45-second cache |
| Offer codes | Eager authenticated code fetch | Masked-code consumers trigger reveal; root-provider results reused; logout invalidates stale replies |
| Profile display | Saved profile refreshed, header cache could retain the old name | Successful save also invalidates shared session display immediately |
| API loader | NiSE letter animation; delay state could persist into the next busy episode | Site logo by default, fresh delay per episode, concurrent-request tracking and fallback; owner can upload/reset a custom image |
| Customer preview | Existing signed, read-only feature; uncapped extension response, target SELECT *, cookie issued before audit | Same read-only model; capped response, explicit target columns, successful audit before grant issuance; account creation+audit transactional |
| Database schema | Existing tables plus optional index opportunities | One additive `site_settings` table for loader config; four optional concurrent indexes prepared, not applied |

The final combined build measured referenced dashboard client JavaScript from **509,651 to 318,259 bytes**, or **150,624 to 94,421 bytes** with Python gzip level 9 (**37.3% smaller**). The same machine and dependency lockfile were used. This is a bundle measurement, not a measured 37.3% improvement in whole-site loading time. The earlier dashboard-only checkpoint is recorded separately in `dashboard-performance-2026-10-30.md`.

Provisional engineering assessment: approximately **6/10 → 8/10** for request discipline and code efficiency, based on the inspected code. It is a judgment, not a Lighthouse score, uptime guarantee or live speed benchmark. Production performance remains unscored until real network and SQL measurements are collected.

## Profile and Counter propagation

Both flows update the canonical `users` row, preserving the same user ID. Profile, customer lookups, account lists and views joining that row receive the corrected data on their next read. A normal profile save now refreshes the current header cache as well as the profile snapshot. Other already-open forms/tabs are not a real-time database subscription; refresh/reopen them to fetch changes, rather than overwriting unsaved input automatically.

Counter corrections currently edit **name and email**. Mobile/contact-verification changes use the separate verified contact-change tools. Team account identity cannot be edited through Counter. Changing a customer's email clears email verification and invalidates their sessions; needing to sign in again is intentional.

Old submitted application details/PDFs and encrypted imported registers are separate historical data. They are not mass-rewritten when a profile changes. Contacts/marketing consent is also a separate record, not an automatic consent grant from a profile edit.

Audits are stored in `activity_log`: actor ID, account reference, time, field name, old value and new value. The owner can inspect **Customers → Open / History** (the current UI loads the latest 100 history entries). Counter changes also appear according to Inbox permissions. Loader changes are audited as content changes. Preview start/extend/end/account-provisioning actions have separate `customer-preview` audit entries. Prior historical edits cannot be reconstructed if they happened before auditing existed.

## What Impersonate means

It is a **read-only admin customer preview**, not a real customer sign-in and not the entire interactive customer website. The original administrator session remains intact; no customer password/PIN/OTP is used. Each operation rechecks admin access and the actor-bound signed preview grant. The initial period is 15 minutes, with extensions capped at 30 minutes total. Staff/customer accounts cannot start it; another owner's account can be previewed only by the primary owner.

The preview displays recent service requests, counter visits, print orders, wallet entries and addresses. Its UI now labels limited counts as entries shown, not all-time totals, and explains the caps. It contains no customer edit/payment/submit controls. Creating an account for preview does not verify identity or automatically grant ownership of imported records. Test real customer submissions separately using a genuine test-customer login.

Corrections made during this review: matching capped expiry in the extension response; correct initial browser countdown; grant cookie only after successful auditing; account provisioning and its audit in one transaction; target account queries omit credential hashes.

## API loading logo

Owner: **Website & setup → Content → API loading logo**. Upload PNG/JPG/WebP/SVG/GIF, maximum 2 MB, or restore the site logo. GIF/WebP animation is preserved; SVG is rasterized to a safe static WebP, so SVG-specific animation is not retained. Uploaded assets live under the configured private upload directory and are publicly served only as immutable WebP images. Invalid paths, spoofed file formats, oversized images and excessive frames are rejected.

The root layout passes cached settings to the client; displaying the loader does not fetch settings per API call. The owner browser updates immediately after saving. Existing visitors receive new settings on a new visit/reload. The indicator appears after 220 ms to avoid flashing for instant calls; overlapping calls keep it visible until the last completes. Image-processing code is loaded only for uploads, not ordinary page rendering.

## Exact commands — review/staging first

Use Node.js 22.13+ and the existing environment values for the intended database/domain. Run one command at a time and stop on failures. Keep the API key pair, INTERNAL_API_TOKEN and record-encryption keys unchanged unless deliberately rotating them.

```bash
git fetch origin
git switch perf/dashboard-api-20261030
git pull --ff-only origin perf/dashboard-api-20261030
npm ci --no-audit --no-fund
npm run check
npm run db:check
npm run db:backup -- --no-readable
npm run db:schema:check
```

`npm run check` is added by this PR: security checks + all Node tests + ESLint + TypeScript, without building twice. The backup is data-only; by default it excludes sessions/OTPs/rate-limit entries and does not export decrypted CSVs. Verify that the dated SQL file was created successfully.

Also back up the **server's** `.private-uploads` directory (or actual PRIVATE_UPLOAD_DIR), `.env.local`/protected environment secrets, and the currently deployed build using cPanel/your normal file-backup process. The SQL dump does not contain uploaded files or your encryption keys. A loader upload is included in that upload-directory backup. Do not copy Windows node_modules to the Linux host.

For the existing populated database, review the read-only schema plan first. The loader requires additive migration `0042_site_settings.sql`. Apply only the reviewed plan after backups succeed:

```bash
npm run db:schema:apply -- --backup-confirmed --confirm "YOUR_DATABASE_NAME@YOUR_DATABASE_HOST"
npm run db:schema:check
npm run data:check
```

Replace the target with the exact database/host shown by the audit. If the audit reports type mismatches, populated partial tables or other blockers, stop and inspect the output; do not force/reset/restore the populated database. The additive sync scans migration SQL and does not rewrite migration ledger history. `db:generate` is a development command, not a deployment step. Do not blindly replay the entire existing migration history on live data.

The four performance indexes in `scripts/sql/dashboard-performance-indexes.sql` are optional tuning, separate from the loader table. Inspect live index definitions/query plans first. Apply with PostgreSQL tooling using stop-on-error and autocommit (not a transaction); CREATE INDEX CONCURRENTLY requires this. Check `pg_index.indisvalid` after any interrupted build. No automatic index application was run here.

Build the deployable release with your production-configured environment:

```bash
npm run release
node scripts/check-build.mjs
```

`release` already runs the production webpack build, live schema gate, asset completeness checks and deployment fingerprint metadata. A second `npm run build` is unnecessary in this sequence. For local development use `npm run dev`; for a combined CI code/build check use `npm run verify`.

Deploy through the existing cPanel process and restart its existing Node app; preserve the upload directory and server environment. After that managed app is running, execute on the server:

```bash
node scripts/check-build.mjs
npm run api:smoke
```

Do not start an extra Node process alongside the cPanel-managed app just to run the smoke check. Then test the browser flows below. Roll back application issues by restoring the preceding verified build; the new settings table and optional nonunique indexes can remain. No data restore is needed for a code-only rollback.

## Manual regression checklist

Use staging/non-sensitive test accounts and a small test dataset first. This checklist is for checks still needing an authenticated real browser, not a claim that these live actions were executed here.

| Page/role | Actions to check | Expected result |
|---|---|---|
| Home/service pages | Browse Home → Services → PAN → Insurance, back/forward; scroll footer; try mobile menu | Links/locale/scroll work; unclicked pages do not auto-prefetch; required clicked-page requests remain |
| Shared login UI | Sign in/out; switch between pages; log out in another tab | Header/offer state follows session changes; stale offer replies do not unlock after logout |
| Customer profile | Edit name/city; save; inspect header; refresh another account view | Current profile/header update; same customer ID; old/new values appear in owner history |
| Counter | Find exact customer; correct name/email; look up again | Corrected canonical details; wallet/visits remain linked; email change requires re-verification/sign-in |
| Shared mobile | Look up a number shared by historical accounts | Explicit account selection; no silent first-account choice or reassignment |
| Customers/history | Search, 10/20/50 rows, next/last page, archive final match | Correct rows/counts; last-page recovery; changes audited; team accounts remain protected |
| Impersonate | Start as owner, inspect all six sections, Extend, Return to Admin, let expiry occur | Read-only target snapshot; accurate timer; original admin session restored/intact; audit entries |
| Impersonate restrictions | Try staff/customer access, own account, another owner as secondary admin | Access denied as designed; no customer credentials requested |
| Preview provisioning | Create a new test account; try its existing mobile again | No verification/import ownership granted automatically; existing-number conflict; creation audit |
| Requests/Records/Contacts | Change pages, row count, filters quickly; open details | Correct latest results; previous responses do not replace current results |
| PAN/forms | Fill, sign in to preview, return to form, verify saved draft | Existing sign-in/preview/draft flow preserved; historical data not rewritten by profile edits |
| Callback/online flow | Service callback → admin takes case → online invite or offline close | Existing transitions and permission rules work |
| Payments/wallet | Quote a test request; inspect coupon/payment step, wallet approval and ledger | Existing amounts, approval rules and append-only financial history retained |
| WhatsApp/Mail | Change conversations quickly; reply; switch before a failed reply; refresh Mail | Correct conversation state; no stale send error on another chat; single polling owner |
| Team | Open a form, close/reopen accordion, navigate away/back | No unopened-form fetch; close/reopen preserves form; owner/staff permissions retained |
| Loader | As owner upload PNG/GIF/SVG, trigger a slow call, restore logo; test staff denial | Safe asset displayed; animation/fallback/delay work; no per-call settings API; owner-only write |
| Files | Open/download authorized documents and uploaded loader after app restart | Runtime upload directory preserved; private documents remain access-controlled |

## Evidence and remaining work

Final verification passed: **286/286 Node tests** (starting baseline: 249), transport security checks, ESLint, TypeScript and the production webpack build. All four simulated-DOM component suites passed: dashboard, public navigation, API loader and customer preview. An independent source review reported no important findings. The upload path check was also corrected to use the native OS separator, with containment/root regression coverage. Server tests substitute DB/auth/cookie/email I/O boundaries; they do not replace live integration tests. Chromium installation and live PostgreSQL access remain blocked in this environment. Real-browser authenticated regression, production request/latency capture, EXPLAIN plans/index rollout, release build with live schema gate, backups/migration and deployment must be completed in the connected staging/hosting environment. There is no measured whole-site Lighthouse score or guarantee that every existing unrelated flow is defect-free.
