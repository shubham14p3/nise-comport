# Deploying NISE COMPORT

## 1. Netlify (preview of the public pages only)
`netlify.toml` sets Node 22 and the Next.js output folder. In Netlify → Site settings → Environment variables add at least:
- `INTERNAL_API_TOKEN` (random, 32+ characters), `OTP_SECRET` (random, 32+), `CRON_SECRET` (random, 16+)
- `NEXT_PUBLIC_SITE_URL` = your Netlify preview URL
- `DATABASE_URL`: leave empty for a look-only preview, or use a separate throwaway Postgres (never the live one). Public pages fall back to built-in content when the database is unreachable.

What works on a preview without a database: home, services, about, team, pricing, FAQ, areas, guides, offers, track page, legal pages.
What does not: sign-in, requests, payments, admin, WhatsApp. They need the database and secrets.

## 2. cPanel (live site)
Needs: "Setup Node.js App" in cPanel (CloudLinux/Passenger) with Node 22+, and a PostgreSQL database (ask the host; plain MySQL will not work).
1. Build on your computer (or CI): `npm ci && npm run build`.
2. Upload the project (including `.next`, `public`, `package.json`, `package-lock.json`, `server.cjs`, `drizzle`) to the app folder; do not upload `node_modules` or `.env.local`.
3. In "Setup Node.js App": Application root = that folder, Startup file = `server.cjs`, then "Run NPM Install".
4. Add every variable from `.env.example` in the app's Environment variables screen.
5. Run `npm run db:migrate` once against the live database (SSH or the Terminal in cPanel).
6. Restart the app. Point the cron job (cPanel → Cron Jobs) at `/api/cron/cleanup` with the `CRON_SECRET` bearer header.
