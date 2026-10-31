# Dashboard performance changes — 30 October 2026

Based on `fix/login-api-assets-20261030` at `a617c92`. Changes are isolated on `perf/dashboard-api-20261030`; nothing was deployed and no live database data or schema was modified.

## What changed

- The encrypted gateway now forwards page/page-size fields for Requests, Records, Contacts, PAN, Coupon usage, Payments, Outreach and Customers. Wallet now forwards its page, size, search and selected customer. Previously several controls sent pagination that the gateway discarded. Page values are finite integers capped at 100,000; page sizes are restricted to 10/20/50.
- Customers has SQL pagination and matching totals instead of an inaccessible 50-row cap. Public columns are selected explicitly; credential hashes are not fetched for list/detail reads. Results use a stable creation-time/ID order. An emptied last page reloads the new last page.
- Counter, Find customer and request-detail components load dynamically. Team accordions load their forms only on first open, retaining them when closed to preserve drafts and avoid repeated fetches. Leaving Team unmounts its workspace.
- MailClient owns Mail metadata refresh. Inbox dashboard counters arrive in the main Inbox response instead of a separate summary request/timer. Existing seen marking, refresh controls, polling intervals, visibility checks and authorization remain.
- Independent Inbox/Records queries run concurrently. Counter phone/email/selected-account lookups share a details loader, reuse contact fields, remove one redundant SELECT and avoid a read-only balance transaction. Financial writes, row locks and approval rules are unchanged.
- Latest-request guards prevent old successes/errors replacing newer Contacts, Records, Customers, request queue, Inbox and WhatsApp views. WhatsApp also rejects old-conversation send errors after navigation.
- Optional PostgreSQL index SQL targets exact phone lookup, customer list ordering, customer audit history and per-request attachment lookup. It is not automatically applied.

## Measurements

Production webpack builds on the same machine and lockfile, comparing the JavaScript chunks referenced by the `admin-dashboard` client manifest entry. This measures build output, not page load time, real network requests or live database latency.

| Metric | Before | After |
|---|---:|---:|
| Dashboard-referenced JavaScript bytes | 509,651 | 317,839 |
| Same chunks compressed with Python gzip level 9 | 150,624 | 94,310 |
| Compressed size reduction | — | 37.4% |
| Counter lookup SELECTs for an existing customer | 5 | 4 |
| Counter read-only BEGIN/COMMIT statements | 2 | 0 |
| Separate Inbox summary request per refresh cycle | 1 | 0 |

The existing concurrent-request coalescing still applies. Removing Mail's second timer chiefly reduces subsequent polls; initial concurrent metadata requests may already have coalesced. No blanket percentage is claimed for API latency or the entire website.

Inspect bundle metrics after a production build (the helper uses Node gzip; compressed byte counts can differ slightly by zlib version):

```bash
node scripts/dashboard-asset-size.mjs
```

## Verification

- `npm run verify`: security checks, complete Node test suite, ESLint and production webpack build.
- The build uses an intentionally unreachable local dummy PostgreSQL URL; database-backed public content loaders fall back as designed. A successful build is not a live data smoke test.
- Server regression tests cover counter contact/balance shape, parallel reads, absence of read transactions, shared-phone ambiguity, customer projection/pagination/authorization, Inbox summary counts and permission-gated counter queries. External DB/email/auth boundaries are substituted in these tests.
- Component smoke checks cover Team first-open/reopen behavior, one Mail metadata owner, one full Inbox request, customer pagination/empty-page recovery, out-of-order Contacts/Records/WhatsApp responses and old-conversation send errors. These passed in a simulated DOM using synthetic API responses.
- A Chromium download was attempted but the environment returned invalid/truncated archives. Real browser layout/end-to-end checks remain a staging step.
- `npm run db:schema:check` was attempted read-only. The environment could not reach the PostgreSQL host (`ENETUNREACH`). Live index inventory, EXPLAIN plans and API timings remain unverified.
- An independent source review found no critical or important regressions. Its empty-page/send-error findings were covered by regression checks and fixed. The index rollout guidance below addresses its remaining operational suggestion.

The component harness can run with a separately installed Playwright:

```bash
node tests/browser/dashboard-performance.mjs
```

Alternatively, install `jsdom` and `@testing-library/dom` outside the application and set `NISE_DOM_TEST_MODULES` to that installation's node_modules directory. `NISE_PLAYWRIGHT_MODULE` may point to an existing Playwright ESM entry. Neither option adds a runtime dependency to the application.

## Database index rollout

Inspect `pg_indexes` and the affected query plans on staging before using `scripts/sql/dashboard-performance-indexes.sql`. The repository backups are data exports, not proof of live index state. Apply with PostgreSQL tooling using stop-on-error and **without a transaction**, since `CREATE INDEX CONCURRENTLY` cannot run inside one. The phone index is intentionally nonunique so existing shared-number accounts remain valid.

A failed concurrent build can leave an invalid index. Inspect `pg_index.indisvalid` for the four named indexes; `IF NOT EXISTS` does not repair an invalid index. Have the DBA repair the specific failed index concurrently before retrying. The script sets bounded lock/statement timeouts and neither rewrites rows nor changes permissions.

## Staging and rollback

Use a fresh database backup and the normal deployment process. Test owner/staff access, page changes with 10/20/50 rows, customer edits/archive/preview, request status/payment workflows, shared-phone counter selection and WhatsApp switching/replies against staging data. Check the four tab groups at desktop and mobile widths.

Rollback is restoring the preceding application build. The optional indexes may remain because they do not alter data semantics. Private data is not stored in a new browser cache; no broad cache was introduced for balances, permissions or audit-sensitive detail opens. Live query plans and authenticated request timing are the next inputs for further database tuning.
