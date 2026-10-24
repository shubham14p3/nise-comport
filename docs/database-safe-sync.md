# Safe PostgreSQL compatibility repair — NiSE COMPORT

**No Next.js build, ZIP upload, SSH, or MilesWeb application restart is needed for this procedure.** It runs in Git Bash on Windows, against whatever PostgreSQL database your local `.env.local` targets.

## Why this is needed

The current Drizzle code schema outgrew the live database after PRs were merged without every required migration being applied. Observed failures include:

- `users.login_pin_hash` (from `0029_mobile_claims.sql`): missing during email/password-reset lookups; the owner subsequently added that column with SQL
- `coupons`: a multi-column public promotion query failed during `next build`; exact missing column/SQLSTATE was not logged
- `hardware_items`: confirmed PostgreSQL `42P01`, supplied by migration `0030_hardware_items.sql`
- `mail_*`, `record_claims`, `outreach_*`, `coupon_*`, and `qr_scans`: introduced in recent migrations; actual presence must be checked

Do **not** reset the database, run `drizzle-kit push`, or run the broad `scripts/apply-missing-migrations.mjs` on production. That broad script runs every statement it recognizes and does not perform a complete preflight/atomic rollback. This repair uses a safer fail-closed planner.

## Exact local commands (Git Bash)

```bash
cd ~/Downloads/nise-comport
git pull origin dev

# Read-only: expect failures before synchronization.
npm run db:schema:check

# Make and securely keep a dated database data backup first.
# --no-readable avoids creating plaintext PAN/customer-register spreadsheets.
npm run db:backup -- --no-readable

# Repeat the dry-run plan if needed; both commands do the same read-only audit.
npm run db:schema:plan
```

The audit prints the **database hostname and name, not its password**, a list of missing tables/columns, safe SQL steps, and a final command containing your database's exact `--confirm` value. Check the hostname and name carefully before proceeding.

Example of the apply command (the `database@host` here is a placeholder; copy yours from the read-only plan):

```bash
npm run db:schema:apply -- --backup-confirmed --confirm "your_database@your_postgres_hostname"
```

This command refuses to proceed unless both flags match. It also verifies the connected DB has existing NiSE `users` and `coupons` tables.

## What the script can safely change

The planner compares **every exported Drizzle PostgreSQL table and column** in `src/db/schema.ts` to the connected database, then reads the repository's historical SQL migrations as authoritative definitions. The apply mode:

1. Plans `CREATE TABLE IF NOT EXISTS` only for tables absent from the database
2. Plans `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` only where a corresponding migration explicitly added that column
3. Adds documented foreign keys and indexes to newly created empty tables
4. Never runs the `INSERT`, `UPDATE`, `DELETE`, `DROP`, `TRUNCATE`, or backfill statements embedded in historical migrations
5. Uses one PostgreSQL transaction with a short lock timeout; a failure rolls back the entire sync
6. Executes real `SELECT <all expected columns> FROM public.<table> LIMIT 0` queries for critical auth, offers, hardware, mailbox, QR, and record-claim tables before committing
7. Does **not** write to the `drizzle.__drizzle_migrations` ledger, modify secrets, or generate a Next.js build

If the planner lists **UNSAFE OR UNDOCUMENTED GAPS** or type mismatches, stop and review them before applying other migrations. It intentionally refuses to invent column types or modify existing column types. Indexes on populated existing tables are reported, not rebuilt automatically, since unique indexes may conflict with existing records.

### Safe-subset procedure for the October 24 production audit

A data backup saved **51,741 rows from 44 tables**, including **9,890 existing record_claims rows**. That table is **NOT EMPTY**. Never run full `db:schema:apply` on this state.

Run from Windows Git Bash:

```bash
git pull --ff-only origin dev
npm run db:claims:inspect
npm run db:schema:check
```

`db:claims:inspect` is read-only and prints column definitions, aggregate claim counts, status counts and account phone coverage **without personal data**.

To fix *only the independent missing structures*, after verifying the existing backup:

```bash
npm run db:schema:apply-safe -- --backup-confirmed --confirm "nisecomp1_nisecomport@45.199.139.25"
```

The `--skip-populated-partials` safety mode skips **all** DDL touching `record_claims` and applies the independent safe plan atomically. It is intentionally a **partial** repair. If it prints `PARTIAL SUCCESS` and exits non-zero, that is expected because the incompatible populated `record_claims` schema remains unresolved. Re-run the read-only audit; expect that `record_claims` still fails while independent tables pass.

Do not force `phone` or `expires_at` values onto 9,890 historical claims: that could incorrectly grant access to customer records. Determine the provenance/status distribution first, then design a data-preserving migration. Do not run a production release build until all required tables pass.

### Partially created `record_claims` table (observed on 24 October)

The production audit found eight missing columns on an **existing** `record_claims` table. These definitions are present in the migration's `CREATE TABLE`, not separate `ALTER TABLE` statements. The planner now extracts the exact column definitions and can complete **only an EMPTY existing table**, holding an exclusive lock during the transaction. The audit shows `EMPTY: eligible for guarded repair` or `BLOCKED: HAS ROWS`.

**If `record_claims` contains rows, do not apply automatically.** There is no trustworthy value to backfill `phone` and `expires_at` (both `NOT NULL`). Those rows require individual data-preserving reconciliation first; don't delete or truncate them just to make the script pass.

After the sync, run `npm run db:schema:check`. The SQL probes should all PASS; UI operations and SMTP delivery require separate functional tests.

## Verification

```bash
npm run db:schema:check
npm run db:check
```

You want:

- `MISSING TABLES / COLUMNS: 0`
- `UNSAFE OR UNDOCUMENTED GAPS (MANUAL REVIEW): 0`
- `PASS` for all critical `LIMIT 0` query probes (including `coupons`, `hardware_items`, `mail_*`, `qr_scans`)
- No PostgreSQL errors

The audit is metadata/SQL compatibility only. After that, test a real login, one password reset, a mailbox workflow, and QR dashboard. Those require running application code and configured SMTP; they cannot be guaranteed by schema validation alone.

## Migration ledger caveat

Applying the additive repair intentionally **does not mark whole migrations as applied** because old migrations include data seeding and backfills that the safe sync deliberately skips. Subsequently running `npm run db:migrate` blindly can attempt to replay those migrations. Review/reconcile the migration ledger separately before switching back to standard automated migrations.

The backup contains private customer records. Keep it on a secure local disk and outside GitHub. Because it contains data rather than a standalone database-schema dump, retain the repository's schema/migration SQL alongside the backup for restoration.
