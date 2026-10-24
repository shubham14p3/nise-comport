# NiSE Comport integrations (feature branch)

The encrypted credential vault is available at `/api/admin/integrations` (owner session only). This initial foundation stores credentials, lists configured providers without exposing secrets, and supports removal. **Saving a credential does not yet activate OAuth, publishing, or replace the existing OTP transports.** Those require provider-specific implementation and live testing.

## cPanel setup

1. Generate a 32-byte random hex key: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
2. Set `INTEGRATIONS_ENCRYPTION_KEY` in the private Node.js environment. Never commit it, send it to the browser, or rotate it without first re-encrypting stored rows.
3. Set `DATABASE_URL` and `DATABASE_SSL` for PostgreSQL connectivity. The first admin request creates `integration_credentials` if the DB role has CREATE permission.
4. Set `NEXT_PUBLIC_SITE_URL=https://nicecompute.aitapri.com` **before building**.

## Credentials to obtain

- **Instagram / Facebook:** Create a Meta app at https://developers.facebook.com/apps/, configure Facebook Login for Business / Instagram API, set valid OAuth redirect URLs for the testing subdomain, and request the relevant permissions for professional Instagram accounts and Facebook Pages. App ID is public, App Secret and access tokens are private. Publishing requires approved permissions and provider-specific OAuth code.
- **WhatsApp Cloud API:** In Meta Business Manager set up a WhatsApp Business Account and phone number; obtain the phone number ID and a suitable system-user access token. Create and get approval for an authentication template for OTP. Existing NiSE Comport code already supports Meta WhatsApp OTP via `META_WA_TOKEN`, `META_WA_PHONE_ID`, `META_WA_TEMPLATE`, and `OTP_CHANNEL` environment settings. Vault entries are not yet wired into this sender.
- **Email OTP:** Obtain SMTP host, port, username, and password from cPanel Email Accounts → Connect Devices. Existing OTP uses `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`. Vault entries are not yet wired into the mailer.

## Security

Only the admin role can access the vault endpoint. AES-256-GCM protects stored data, with a random IV and authenticated tag per update. The master key remains outside PostgreSQL. Do not log secrets, return them through GET, or store the master key in the admin UI. Restrict PostgreSQL privileges and back up the encryption key securely.

Next steps: integrate vault lookup with SMTP and Meta WhatsApp transports; implement Meta OAuth callbacks, token renewal, publish/permission flows; add owner-only UI, connection tests, audit trail, and provider-specific tests.
