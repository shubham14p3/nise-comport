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
4. Restore that backup into an isolated PostgreSQL test DB using the existing `db:restore` procedure. Test `npm run db:migrate` there. Note this app's data-only backups do not contain table DDL, nor uploaded private files; prepare schema and separately back up `.private-uploads`.
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
- This phase adds backend support. Existing customer/Admin screen components still need a dedicated Job ID view; this is not a completed frontend rollout.
