# Admin UX and performance rollout (single feature branch)

Branch: `feat/admin-ux-performance-oct2026`. Review PR #40 into `dev`. **Do not deploy the feature branch to production until the validation steps pass.** The production PostgreSQL data was not modified by these commits.

## Functionality map
- All admin sections: sidebar grouped Work, Customers, Marketing, Website. Only the active panel's JavaScript and list-data calls are loaded; Inbox/Mail background polling is active only on their respective tabs. Existing permission checks remain server-side.
- Records, print/service requests, Contacts, PAN search, Coupon redemptions, Payments: SQL pagination with accurate filtered totals, default 20 rows and optional 10/50.
- Promotions, gallery photos, team, site team, campaigns, hardware categories and QR analytics: local pagination for bounded/small datasets. Birthdays/renewals: server response paged; legacy server logic still scans applicable records to calculate dates.
- Records/PAN imports and coupon block history: collapsed sections. New contact, team and payment forms: compact reveal-on-demand.
- Requests: active status filter by default; cancelled/completed records remain in History.
- QR management: owner/team with campaign permission can download static SVG Welcome, Login and WhatsApp QR codes; welcome variants use `?src=poster|counter|card`. Anonymous scan analytics remain in the existing `qr_scans` table.
- Owner-only System & connections: light configuration snapshot for Instagram/Facebook/WhatsApp/email, SMS/SMTP and UPI/Razorpay/Cashfree; on-demand existing provider credential check; YouTube labelled unimplemented. `Configured` is never described as `Healthy`.
- Wallet: paginated customer balances and ledger; credits can be added with existing workflow. Only owner may correct a credit via append-only debit entry with required reason; correction is limited by unspent balance and the original credit. Existing entries are never rewritten.
- Services mega menu: compact text with full native tooltip/accessible name; existing mobile accordion preserved.

## One-pass Windows Git Bash verification

```bash
cd ~/Downloads/nise-comport
git fetch origin
git switch feat/admin-ux-performance-oct2026
git pull --ff-only origin feat/admin-ux-performance-oct2026
npm ci --no-audit --no-fund
npm run lint
npm test
npx tsc --noEmit
npm run db:schema:check
npm run release
```

The application may run its production build against your configured database during static generation. Your October 24 data-only backup exists in `backups/`; retain a secure copy and back up files in `.private-uploads` separately. No migration is required by this PR. Never run `db:push` or reset the populated production DB.

## Manual smoke checks (staging, using real owner/staff accounts and non-sensitive test data)
- Owner can reach `/desk#integrations`; staff cannot receive system-health/connection credentials.
- Records/Contacts/Payments/Coupon use show 20, navigate pages, filter, change 10/50 size; counts don't drift after updates.
- Requests default excludes cancelled/completed; History restores them; print jobs and service requests paginate independently. Private request files and status transitions still work.
- Recent imports accordion fetches on open. PAN exact search and name search still return expected matches. Birthday and renewal screens have independent 20-row lists and selection/send behavior.
- Download every QR SVG, scan each on mobile, verify `/welcome?src=...` and analytics. Do not count the preview as a customer action.
- Wallet: credit test customer, inspect ledger; correct ₹1 with a documented reason; verify original remains, new debit appears in user profile, balances update; repeat to confirm no over-correction. Use only authorized test credits.
- Test integration status with no credentials, wrong credentials and working tokens; never expose secrets. Payment gateway statuses are configuration indicators, not proof of successful payment.
- Responsive layout: desktop width 1440/1280, laptop 1024, mobile 390/360; keyboard focus and full-name hover in mega menu.
- Compare initial admin JS size, number of requests on first tab, repeated navigation to different tabs, and database queries; do not infer performance improvements without measurements.

## Security and deployment
- Existing role/permission enforcement remains in API handlers. Config secrets stay server-side and should never be placed in client props or `NEXT_PUBLIC_...`.
- Review repository-tracked `.env.local`: if it contained live secrets, remove them from version control, rotate/revoke, and keep server secrets in cPanel environment. Removing in a new commit does not purge historical exposure.
- After the above checks, merge PR into `dev`, build from `dev` locally and upload the compiled `.next` using the regular ZIP → cPanel Extract → Restart process. Preserve `.private-uploads`, `.env.local` and PostgreSQL credentials.
- Rollback is restoring the prior verified `.next` build and restarting Node; the additive credit transaction data, if created during usage, is not automatically rolled back by code rollback.
