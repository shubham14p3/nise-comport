# Dashboard performance implementation plan

Goal: reduce unnecessary dashboard API/JavaScript work and make pagination correct without changing permissions, encrypted transport, payment rules or customer workflows.

Architecture: retain React/Next/PostgreSQL and existing request coalescing. Fix pagination at the shared gateway, use existing dynamic imports, eliminate duplicate polling ownership, and narrow/parallelize independent database reads. No new runtime dependency or persistent cache of private data.

Authorization: user requested implementation of the reviewed optimizations, prioritizing existing functionality. Work from fix/login-api-assets-20261030 at a617c92 on an isolated performance branch.

- [x] Gateway: extract pure operation target resolution for runnable end-to-end mapping tests. Forward bounded pagination for Requests, Records, Contacts, PAN, Coupon usage, Payments, Outreach and Wallet, including wallet userId/q. Preserve all other target behavior and security boundaries.
- [x] Dashboard: dynamically import Counter/Find customer and request detail components; mount Team accordions on open; remove dashboard Mail polling because MailClient owns it. Do not keep hidden live panels polling.
- [x] Async correctness: guard stale list/detail results in Records, Contacts, Customers and WhatsApp; keep forms and explicit submit search. Reuse a small latest-request helper tested with out-of-order promises and invalidation.
- [x] Customers: bounded server-side pagination and matching totals, deterministic ordering, explicit public columns; use existing AdminPager and reset page on filter changes. Preserve owner-only access and history/edit behavior.
- [x] Database: consolidate counter lookup details; remove read-only balance transaction, avoid duplicate contact lookup, run independent reads together. Keep all writes/locks intact. Parallelize independent Records reads. Add optional nonunique phone/list-order indexes with a separate concurrent SQL apply path; inspect backup schema/index inventory without accessing customer rows.
- [x] Validation: regression tests first for nontrivial behavior, full test suite, lint, TypeScript, production build and security checks. Compare baseline/final dashboard asset sizes if builds succeed. Use only a local dummy database for builds; document unavailable live timing/query-plan measurements.

Review focus: invalid/fractional/nonfinite pagination, detail-vs-list routing, stale success/error after navigation, archived/team customer permissions, wallet writes/locks and pagination boundaries. No broad response caching: permissions/money/audit-sensitive reads stay fresh.

Baseline: 249 tests pass; npm ci succeeds with existing ESLint peer warnings. Production build underway with dummy local database URL. No live DB mutation.


Execution record: full test suite expanded from 249 to 271; security/lint/build verification and final measured asset output are recorded in docs/dashboard-performance-2026-10-30.md. Component smoke checks passed in a simulated DOM. Real Chromium installation and live PostgreSQL schema checks were attempted but blocked by environment/network limitations; they are documented staging checks, not claimed as passing.

Review: independent source reviewer reported no critical/important findings. Empty Customers page recovery and stale send errors were fixed with regression checks. Self-review additionally caught first-open Team forms being discarded on close; a failing reopen/refetch check confirmed it and the forms now remain mounted while closed. Concurrent-index validity guidance was added.

Decision: retain the current runtime dependencies and keep private/money data fresh. No broad response cache, database migration, deployment or merge was performed. The separate branch is delivered as a draft PR for review.
