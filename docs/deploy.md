# NiSE COMPORT deployment — MilesWeb Node.js

Production URL: **https://nisecomport.com**. Node listens on port **3020**. Working directory: `~/nisecomport.com`. Startup command: **`npm start`**. Node.js version: **26.12.1**.

> MilesWeb runs out of process slots when compiling Next.js (`EAGAIN`). **Do not run `npm run build`, `npm run release`, `npm run init`, `npm run db:setup`, or `npm run db:migrate` on MilesWeb.** The existing PostgreSQL database is retained unchanged; inspect schema and obtain approval before any migration. Build locally, ship only the production build, and restart the panel app.

## Environment switches

Keep the following in the **server's own** `.env.local` (outside Git):

```dotenv
APP_ENV=prod
INTERNAL_API_PORT=3020
NEXT_PUBLIC_SITE_URL=https://nisecomport.com
CANONICAL_HOST_REDIRECT=true
```

For development on Windows use a separate `.env.local`:

```dotenv
APP_ENV=local
INTERNAL_API_PORT=3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
CANONICAL_HOST_REDIRECT=false
```

**Important:** `APP_ENV` selects the port of the internal encrypted API hop. It does **not** change `DATABASE_URL`. Use a separate development database if you must not touch production records during development.

Both environments use a same-process loopback connection to the internal Node listener. The encrypted gateway adds a server-only `INTERNAL_API_TOKEN` and a loopback `Origin` header; the Next.js proxy still rejects unauthenticated private API calls and cross-site browser writes.

The browser's `NEXT_PUBLIC_API_ENVELOPE_PUBLIC_JWK` is baked into the local build. It must match the server's `API_ENVELOPE_PRIVATE_JWK` or encrypted requests will fail. Do not put private keys or credentials in Git.

## Multiple site addresses and login

The browser uses relative API requests. Each supported hostname can serve sign-in
without relaxing the encrypted API's same-origin security policy. With
`CANONICAL_HOST_REDIRECT=true`, both the `www` and non-`www` forms of
`nisecomport.com`, `nicecompote.aitapri.com`, `nicecompote.com`,
and the earlier documented `nisecomport.com` redirect to
`NEXT_PUBLIC_SITE_URL`. The original path and query string are preserved.
Host-only login cookies are **not** shared across unrelated domains; routing
all browser visits to one canonical host prevents session inconsistencies.

To activate another address, **before testing login**, configure its DNS
(A/AAAA or CNAME as appropriate), cPanel/hosting domain binding and valid HTTPS
certificate for the exact hostname, including the `www` version. Domain aliases
alone do not provision DNS, SSL or a virtual host. Keep
`NEXT_PUBLIC_SITE_URL=https://nisecomport.com` while that is the
live primary domain; for a custom-domain migration, switch the canonical URL,
rebuild the Next.js frontend, deploy it and test sign-in and redirects. Add
new exact hostnames (not wildcard patterns) via `SITE_DOMAIN_ALIASES` if
needed. Never enable `Access-Control-Allow-Origin: *` or a cross-site
credentialed login to implement these redirects.

## Build on Windows Git Bash

Before any `git pull`, **make backups of local `.env.local` files**. Earlier versions of the repository incorrectly tracked `.env.local` despite the intent to ignore it. Do not lose your local secrets while updating the checkout; never transfer them via public Git.

```bash
cd ~/Downloads/nise-comport
git pull origin dev
npm test
npm run release
```

Confirm that the release output says `APP_ENV=prod` and the **actual** deployment URL above. To ship a production build, set the matching production variables in your *local* build environment first. Changing `NEXT_PUBLIC_*` values on MilesWeb alone will not change compiled client JavaScript.

The `.next/` directory is intentionally ignored by Git. Archive it directly; exclude caches and development assets:

```bash
tar -czf nise-next.tar.gz --exclude='.next/cache' --exclude='.next/dev' .next
scp -P 22 nise-next.tar.gz nisecomp2@45.199.139.25:~/nisecomport.com/
# Update the two verification scripts as well; these are NOT included in .next.
scp -P 22 scripts/check-build.mjs scripts/api-smoke-check.mjs nisecomp2@45.199.139.25:~/nisecomport.com/scripts/
```

Do **not** upload Windows `node_modules/` to Linux. Leave Linux-installed production dependencies on the server.

## Install build on MilesWeb

1. Stop the Node.js application in the MilesWeb panel. Do not start a second copy using SSH.
2. SSH to the server and run:

```bash
ssh -p 22 nisecomp2@45.199.139.25
cd ~/nisecomport.com
mv .next .next-previous
tar -xzf nise-next.tar.gz
node scripts/check-build.mjs
```

3. If the complete build is found, use the panel's **Restart** button. Keep `.next-previous` until the deployed app passes smoke tests; archive/clean it after confirmation. Transferring a tarball does not automatically deploy code outside `.next`; ensure the server source, `next.config.ts`, and package version match the build where necessary.

4. With the panel-managed app running, execute `node scripts/api-smoke-check.mjs` over SSH. It checks private-route token enforcement, a safe invalid login payload, and rejection of foreign Origins **without writing user data**. All three checks must report PASS.

## Smoke tests — every deployment

**Public endpoints (safe checks):**

```bash
curl -I --max-time 15 https://nisecomport.com/
curl -i --max-time 15 https://nisecomport.com/api/health
curl -i --max-time 15 http://127.0.0.1:3020/api/health
```

**Browser tests (using a test account):**

1. Load `/login`, sign in, confirm session and dashboard; log out.
2. From `/forgot-password`, request a code and verify it actually reaches the mailbox. Do not post OTPs in logs or chats.
3. Test one non-destructive authenticated dashboard query. Verify session cookies persist after page reload.
4. Inspect the encrypted `/api/x7q9m2` response. Outer HTTP 200 is **not** proof of success: application status is sealed inside the response.
5. Verify ordinary cross-site browser requests to private APIs are still denied; never disable the proxy or expose `INTERNAL_API_TOKEN` to the browser.

**Troubleshooting unstyled first loads and encrypted login:**

- If a page initially renders without styling, inspect `/_next/static/...` CSS/JS requests in the browser Network tab. A 404 means the deployed CSS or JavaScript bundle may be missing or from a different build. `node scripts/check-build.mjs` now validates static asset references found in Next.js build manifests.
- `/api/health` returning `ok: true` shows that the database is reachable; it does **not** prove login credentials or the encrypted API are valid.
- `/api/x7q9m2` returning outer HTTP 200 is expected even for rejected credentials. Its application status is sealed. The exact UI text `Email, mobile number or password is incorrect.` comes from the server's credential check; do not replace password hashes or bypass authentication to handle it.
- Browser fetch failures while online should be reported as an unavailable connection, not as proof that the user is offline. If login is rejected with invalid credentials, check that the correct login method (mobile PIN vs password vs email) and account are being used.
- Never replace production `.env.local` while redeploying; it may contain data-encryption keys. Back it up securely and remove tracked secrets from Git separately with a planned credential rotation.

**Logs:**

```bash
grep -Ei 'opaque-api|cross_site|fetch failed|smtp|password|postgres|error' ~/persistent_app_*.log | tail -60
```

If you get `fetch failed`, verify `APP_ENV=prod`, the internal port matches the listener, and `curl http://127.0.0.1:3020/api/health` succeeds. If you get `cross_site`, confirm the new build uses a loopback `Origin` matching `127.0.0.1:3020` (regression tests are in `tests/api-routing.test.mts`). These errors happen before SMTP or password validation. For email failures that remain, run `npm run smtp:check` on MilesWeb (it checks `SMTP_PASSWORD`, **not** `SMTP_PASS`).

## Security and secrets

**Urgent repository history issue:** the `dev` branch previously contained a tracked `.env.local`. Adding it to `.gitignore` does **not** untrack it or erase history. Back up your environment file, remove it from Git tracking deliberately, rotate exposed credentials, and consider history cleanup across every branch. Avoid blindly pulling a commit that deletes your only copy of the environment file. Existing database-encryption keys require a planned migration; changing them arbitrarily can make stored data unreadable.

Never run automatic database migrations when deploying a UI/API fix.
