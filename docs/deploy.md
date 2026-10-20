# Deploying NISE COMPORT

## 1. Netlify (preview of the public pages only)
`netlify.toml` sets Node 22 and the Next.js output folder. In Netlify → Site settings → Environment variables add at least:
- `INTERNAL_API_TOKEN` (random, 32+ characters), `OTP_SECRET` (random, 32+), `CRON_SECRET` (random, 16+)
- `NEXT_PUBLIC_SITE_URL` = your Netlify preview URL
- `DATABASE_URL`: leave empty for a look-only preview, or use a separate throwaway Postgres (never the live one). Public pages fall back to built-in content when the database is unreachable.

What works on a preview without a database: home, services, about, team, pricing, FAQ, areas, guides, offers, track page, legal pages.
What does not: sign-in, requests, payments, admin, WhatsApp. They need the database and secrets.

## 2. cPanel / MilesWeb (live site): the same method as AI Tapri and Satsang Vani

**The server never builds.** Building Next.js on shared hosting fails (too many processes, out of memory). You build `.next` on your PC, commit it with the code, and the server only installs, migrates and starts.

**Secrets never go through git.** This repository is public. `.env`, `.env.local`, `backups/`, `myexcel/` and `*.zip` are ignored. The live `.env` is uploaded once by hand and stays on the server.

### One-time panel setup
| Field | Value |
| --- | --- |
| Mode | Automatic (Production) |
| Node version | 22 or newer |
| Startup command | `npm run init` |
| Working directory | `nisecomport`, a folder in Root next to `public_html`, never inside it |
| Proxy path | blank |
| Port | `3002` (must equal `-p 3002` in `package.json` `start`; pick another free port in both places if 3002 is taken) |
| WebSocket upgrade | on |

Then upload your `.env` (the full file) into that folder once. Extracting a new zip over the folder does not remove it.

`npm run init` on the server does: `npm ci` (with dev tools) → `db:migrate` → `check-build` → `next start -p 3002`.

### Releasing a change (on your PC, Git Bash, in the project folder)
```bash
git pull
npm install
npm run release        # builds .next for https://www.nisecomport.com
git add -A
git commit -m "build: release"
git push
git archive --format=zip -o ../nisecomport-upload.zip HEAD
```
Then in File Manager: open the `nisecomport` folder, delete the old `.next`, upload `nisecomport-upload.zip`, extract it (overwrite), and press Restart on the Node app.

The log should end with `Schema is up to date`, `Serving build … of <commit>`, `Ready`.

`NEXT_PUBLIC_*` values (including the browser key `NEXT_PUBLIC_API_ENVELOPE_PUBLIC_JWK`) are baked in at build time from the `.env` on your PC. The server's `.env` must hold the matching private key `API_ENVELOPE_PRIVATE_JWK`, so use the same `.env` on both.

### After the first start
1. Open `https://www.nisecomport.com/api/health`.
2. In cPanel → Cron Jobs add `curl -s -X POST -H "Authorization: Bearer <CRON_SECRET>" https://www.nisecomport.com/api/cron/cleanup` every 10-15 minutes, `/api/cron/whatsapp` every 5 minutes and `/api/cron/offers` once a day (and `/api/cron/mail` every 5 minutes if the message centre mailbox is connected).
3. `npm run smtp:check` (SSH or Terminal) to test email.

### When something breaks
| Symptom | Cause |
| --- | --- |
| `No complete build in .next` | You pushed code without `npm run release`, or `.next` was not committed |
| Panel 404 while the log says `Ready` | Panel port and `-p` in `start` differ, or the proxy path is not blank |
| `next: Permission denied` / `Bus error` | `node_modules` was uploaded; never upload it (`npm run init` reinstalls) |
| `spawn … EAGAIN` / `SIGABRT` | Something ran `next build` on the server; use `npm run release` on your PC |
| Site shows old content | Rebuild with `npm run release`, commit, re-upload |
| Emails link to localhost | Built with plain `npm run build`; use `npm run release` |
