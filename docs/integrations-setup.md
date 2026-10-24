# NiSE Comport integrations (feature branch)

The encrypted credential vault is available at `/api/admin/integrations` (owner session only). The owner dashboard now provides four encrypted credential forms. Facebook Page publishing and Instagram single-image publishing are implemented using manually supplied access tokens. Email sends prefer encrypted SMTP credentials, falling back to existing environment configuration. WhatsApp OTP can use encrypted Cloud API credentials when the caller explicitly selects the WhatsApp channel. **OAuth account connection, token renewal, multi-media scheduling, and fully automated WhatsApp channel discovery remain outstanding. No provider has been live-tested.**

## cPanel setup

1. Generate a 32-byte random hex key: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
2. Set `INTEGRATIONS_ENCRYPTION_KEY` in the private Node.js environment. Never commit it, send it to the browser, or rotate it without first re-encrypting stored rows.
3. Set `DATABASE_URL` and `DATABASE_SSL` for PostgreSQL connectivity. The first admin request creates `integration_credentials` if the DB role has CREATE permission.
4. Set `NEXT_PUBLIC_SITE_URL=https://nicecompute.aitapri.com` **before building**.

## Credentials to obtain

- **Instagram / Facebook:** Create a Meta app at https://developers.facebook.com/apps/, configure Facebook Login for Business / Instagram API, set valid OAuth redirect URLs for the testing subdomain, and request the relevant permissions for professional Instagram accounts and Facebook Pages. App ID is public, App Secret and access tokens are private. Publishing requires approved permissions and provider-specific OAuth code.
- **WhatsApp Cloud API:** In Meta Business Manager set up a WhatsApp Business Account and phone number; obtain the phone number ID and a suitable system-user access token. Create and get approval for an authentication template for OTP. Existing NiSE Comport code already supports Meta WhatsApp OTP via `META_WA_TOKEN`, `META_WA_PHONE_ID`, `META_WA_TEMPLATE`, and `OTP_CHANNEL` environment settings. Vault credentials are used when WhatsApp is explicitly selected. The existing login UI still derives available channels from environment configuration, so set the matching `OTP_CHANNEL=whatsapp,sms` and Meta WhatsApp environment settings until asynchronous vault-aware channel discovery is implemented.
- **Email OTP:** Obtain SMTP host, port, username, and password from cPanel Email Accounts → Connect Devices. Existing OTP uses `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`. The mailer now prefers complete encrypted SMTP vault settings and otherwise uses the environment configuration.

## Security

Only the admin role can access the vault endpoint. AES-256-GCM protects stored data, with a random IV and authenticated tag per update. The master key remains outside PostgreSQL. Do not log secrets, return them through GET, or store the master key in the admin UI. Restrict PostgreSQL privileges and back up the encryption key securely.

Remaining work before production: Meta OAuth callbacks and automatic token refresh, verified account permissions, test connection endpoints, audit logs, WhatsApp vault-aware login channel discovery, schema migration under least privilege, and automated integration tests. Do not merge or deploy as complete until build checks and real provider tests pass.
