# NiSE COMPORT npm commands and one-off maintenance tools

`package.json` keeps **23 npm commands** rather than 38. This does not delete any underlying `scripts/*` files or change runtime behavior. We removed aliases for historical imports, artwork generation, a duplicate schema planner, and unsafe broad DB setup/push. Never run a bulk data utility without reviewing its arguments and taking a backup.

## Everyday commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Local Next.js |
| `npm run lint` | Strict source lint |
| `npm test` | Node unit tests |
| `npm run build` | Next.js build |
| `npm run release` | Production build with schema preflight |
| `npm run start` | Start server |
| `npm run init` | MilesWeb Node startup with build check; **keep this** |
| `npm run verify` | Security, tests, lint, build |

## Database and operational commands

| Command | Purpose |
| --- | --- |
| `npm run db:backup` | SQL backup of customer/operations rows to local `backups/`, **no readable CSV by default** |
| `npm run db:backup -- --no-readable` | Same privacy-first backup, explicitly requested |
| `npm run db:backup -- --with-readable` | Optional plaintext CSV exports, only for a trusted encrypted workstation |
| `npm run db:check` | Verify PostgreSQL connection |
| `npm run db:schema:check` | Read-only audit of tables and columns |
| `npm run db:schema:apply -- --backup-confirmed --confirm "database@host"` | Guarded additive schema sync; **review plan first** |
| `npm run db:restore` | Disaster recovery only: read the script/docs and restore **only to a separate empty DB** |
| `npm run db:generate` | Developer migration generation |
| `npm run db:migrate` | Developer migration runner; **DO NOT execute on the current live DB until the migration history is reconciled** |
| `npm run data:check` | Data consistency check |
| `npm run smtp:check` | Outbound SMTP check |
| `npm run api:smoke` | Endpoint smoke check |
| `npm run records:import`, `npm run records:update` | Admin-reviewed imports and updates |
| `npm run offers:sync` | Promotion schedule refresh |
| `npm run seo:check`, `npm run security:check` | Checks |

## Retired npm shortcuts (underlying files are retained)

For a carefully reviewed one-off task, invoke its file directly:

| Former shortcut | Current command |
| --- | --- |
| `db:schema:plan` | `npm run db:schema:check` (identical read-only audit) |
| `db:claims:inspect` | `node scripts/inspect-record-claims.mjs` |
| `db:schema:apply-safe` | `node --experimental-strip-types scripts/schema-compat.mjs --apply --skip-populated-partials --backup-confirmed --confirm "database@host"` (manual review only) |
| `db:studio` | `npx drizzle-kit studio` (developer-only, personal data) |
| `seo:indexnow` | `node scripts/indexnow.mjs` |
| `testimonials:seed` | `node scripts/seed-testimonials.mjs` |
| `avatars:generate` | `node scripts/generate-avatars.mjs` |
| `avatars:import-real` | `node scripts/import-real-avatars.mjs` |
| `photos` | `node --experimental-strip-types scripts/photos.mjs` |
| `records:scan` | `node --experimental-strip-types scripts/scan-records.mts` |
| `loyalty:backfill` | `node --experimental-strip-types scripts/loyalty-backfill.mts` |
| `campaign:preview` | `node --experimental-strip-types scripts/campaign-preview.mts` |
| `api:keygen` | `node scripts/generate-api-transport-key.mjs` |

The `db:setup` and `db:push` aliases have been **removed intentionally**. They are inappropriate shortcuts for this populated production database, especially after the historic mobile claim migration collision.

## Backups

Run locally from Windows Git Bash (not on the shared Node host):

```bash
cd ~/Downloads/nise-comport
npm run db:backup -- --no-readable
```

Confirm `✓ Saved ... rows from ... tables` and keep the dated `backups/nise-comport-*.sql` file on private encrypted storage. It is a **data-only** backup, not a full PostgreSQL schema dump. It excludes sessions, email/phone OTPs and rate limits by default, and cannot include MilesWeb's `.private-uploads` files.

Before any upgrade or migration: `npm run db:schema:check`. Afterward: `npm run db:check`, `npm run lint`, `npm test`, then `npm run release` locally before uploading the build via ZIP/cPanel.
