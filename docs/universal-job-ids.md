# Universal Job IDs — controlled rollout

## Scope
- Every `service_requests`, `print_jobs`, `counter_visits`, and `customer_records` row receives one separate universal job in `jobs`. The original UUID and reference remain unchanged.
- Job IDs (`NCJ-YY-XXXXXXXXXXXX`) are public tracking references **not authentication tokens**.
- Historical imported records remain unclaimed: `user_id IS NULL`, `status=historical`. Never infer identity by a phone number or contact hash.
- DB triggers create jobs atomically on new inserts; service and print status changes synchronize. `job_events` records new work and status changes. Historical backfill preserves original dates.
- Missing-document labels, optional staff notes and recent job events are stored separately. Do not store Aadhaar/PAN numbers, full documents or sensitive application data in job events.

## Runbook
1. From a clean checkout, confirm `dev` is updated. Work only on the feature branch.
2. Inspect your `DATABASE_URL` target. Local Next.js does **not** imply local PostgreSQL. Never connect the backup/migrate command to an unidentified production database.
3. **Before any migration**, run `npm run db:jobs:backup` on the machine with real DB access. Copy the newly verified SQL backup **off GitHub** onto encrypted storage. Existing committed backups are not evidence of a fresh backup.
4. For a **pre-migration** SQL backup, restore into an isolated PostgreSQL clone in this order: using the existing `dev` revision (through migration 0044), create the original schema with `npm run db:migrate`; run `npm run db:restore -- backups/<new-backup>.sql` against the clone; switch to this feature branch and then run `npm run db:migrate` to apply 0045 **after restoring the data**. Applying 0045 first would backfill empty tables while restore suppresses triggers. These backups are data-only (no DDL) and exclude temporary session/OTP tables by default. Copy `.private-uploads` separately.
5. Verify counts:
```sql
SELECT
 (SELECT count(*) FROM service_requests) AS service_count,
 (SELECT count(*) FROM print_jobs) AS print_count,
 (SELECT count(*) FROM counter_visits) AS counter_count,
 (SELECT count(*) FROM customer_records) AS historical_count,
 (SELECT count(*) FROM jobs) AS job_count;
SELECT source_kind, count(*) FROM jobs GROUP BY source_kind ORDER BY source_kind;
SELECT source_kind, source_id, count(*) FROM jobs GROUP BY 1, 2 HAVING count(*) > 1;
```
6. Run tests/build, validate a new online request, print order, Counter visit, WhatsApp job status, and an imported historical row. Compare legacy references. Only after verification deploy schema before application code.

## Security
`backups/` already contains tracked historical dumps. These contain personal data, even if some fields are encrypted. Move them out of Git history securely before making the repository public; rotate any exposed credentials. Gitignore prevents **future untracked** backups, not files already committed. No database connection or new live snapshot is made automatically by these commits.

## Behavior
- Staff must verify historical ownership before linking a `jobs.user_id` to an actual customer.
- Message templates initiated outside the 24-hour WhatsApp customer-service window must be approved in Meta.
- Counter receipts retain their existing payment/ticket references. The Job ID is an additional identifier, not a replacement.

## API surfaces
- `GET /api/jobs`: authenticated customer's latest 50 jobs.
- `GET /api/jobs?code=NCJ-26-XXXXXXXXXXXX`: authenticated customer job details and visible history.
- `GET /api/admin/jobs?code=...`: admin-only lookup including internal notes.
- `PATCH /api/admin/jobs`: admin-only `{code, missingDocuments?, internalNote?}`; records audit event.
- Online request creation and Counter visit creation now include a `jobId` in their JSON responses. The existing `reference` remains valid.
- WhatsApp `STATUS <Job ID>`, bare Job ID, or `status` uses the verified phone-owner and refuses unverified/shared matches.
- This phase adds backend support. Customer Profile now has All Job IDs; owner Desk has Job IDs search/manage. Staff-level permission scoping and customer-claiming of historical import rows are not implemented.

### Counter billing deduplication
A Counter charge can create a separate payment-only `service_requests` row with `details.source='counter'` and `details.counterVisitId`. **This does not become a second universal job.** The Counter visit's one Job ID remains the source of truth and its source reference is `CV-<visit-uuid>`, also used by the payment ticket. Backfill and trigger both skip these payment-only rows.

### Customer-visible progress
The owner may post a `customerUpdate` (max 500 characters) through the owner-only Job IDs panel. It creates a `job_events` record marked public, visible to the verified customer and their WhatsApp Job ID lookup. The `internalNote` is never included in these public responses. Confirm the update contains no private document number or protected details before submitting.

Counter payment-only requests also synchronize their payment/status transitions into the same Counter job (`jobs.status` and `job_events`), including during historical backfill. The `jobs_source_ref_idx` index avoids scanning unrelated jobs for each update.

## Troubleshooting: Drizzle returned but tables remain missing
Do **not** interpret `npm run db:migrate` returning with no error as proof that migration 0045 applied. Run `npm run db:jobs:doctor` (read-only) and `npm run db:schema:check` to compare the migration ledger, tables, expected source counts and installed triggers. In an October 31 operator run, the job tables and `counter_comments` were missing despite `drizzle-kit migrate` completing.
When the ledger is out of sync, do **not** delete, truncate, or manually rewrite `drizzle.__drizzle_migrations`.
After validating on a restored database clone, create the missing tables/indexes via the existing guarded additive sync: `npm run db:schema:apply -- --backup-confirmed --confirm "<database>@<host>"`. **This command alone does not backfill or install triggers.** Then explicitly run `npm run db:jobs:repair -- --apply --backup-file "backups/<fresh-name>.sql" --confirm "<database>@<host>"`. The repair re-executes 0045 transactionally, verifies expected job counts and trigger installation, and never rewrites existing service/Counter IDs. It does **not** run the unrelated 0044 user phone/WhatsApp update.
Always run the repair on an isolated restored PostgreSQL copy before considering the live database. The public repo's tracked SQL data must not be published or synced to GitHub.
