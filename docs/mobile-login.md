# Account access: email, mobile, password and PIN

## One account, two identifiers
- **Email + password**: works after email sign-up/verification.
- **Mobile number + password**: works when the mobile is registered on exactly one active account **and the account has a password the customer chose**. A password authenticates the account; enabling or disabling SMS does not change password login. If two accounts share an old number, mobile/password login fails closed; email login remains available.
- **Mobile number + 6-digit PIN**: works only if the account has an explicitly provisioned Argon2 PIN hash; the system never infers PIN access from an imported profile number. A mobile-first signup receives a generated PIN once. The user may optionally create a strong password at signup so either credential works.
- **Email one-time code**: optional sign-in only when SMTP and the email OTP secret work. A placeholder `.invalid` address created for a mobile-only account is never treated as a deliverable email.
- **SMS/WhatsApp sign-in**: shown only for configured delivery channels and a valid `OTP_SECRET`. Requires the mobile to have been verified for exactly one active account.

**Switching email/mobile at login must not create a second account.** Email sign-ups may add a mobile and use it as a password login identifier if it is unambiguous; staff may provision an additional PIN where appropriate.

## Resetting access
- **Forgot email password**: email reset code sent to the verified email, then a new password; other sessions are invalidated.
- **Forgot mobile PIN / mobile password**: if the mobile was previously **verified** and a production SMS or WhatsApp OTP channel is correctly configured, the reset page offers the selected channel. A one-time code valid 10 minutes is required before changing credentials; existing sessions are invalidated.
- **Unverified mobile, no provider keys, delivery outage or no access to the number**: self-service mobile recovery is unavailable; staff must verify identity out of band and use the existing logged staff PIN reset. Do not reset a customer's PIN on a number alone.
- **No SMS provider or missing production OTP secret**: SMS and WhatsApp OTP buttons and self-service mobile recovery tabs are hidden, while email/password and mobile/PIN continue working. The page can say recovery is coming soon and offer staff contact.

## Legacy record claims
The October 19, 20 and 24 backup comparison confirmed **9,890 untouched legacy register-based approvals** in the original `record_claims`. These do NOT prove phone ownership. New phone ownership claims use `mobile_record_claims` and `mobile_record_flags` from migration `0034_isolated_mobile_claims.sql`; historical rows are preserved.

New matched records remain protected pending staff approval or a verified code. Verification rewards are handled by the current reward modules and should not be inferred from historical claim approvals.

## Backend/service requirements
- `OTP_SECRET` at least 32 characters in production and an actual configured provider (`MSG91_AUTH_KEY` + `MSG91_TEMPLATE_ID`, or `FAST2SMS_API_KEY`, or the WhatsApp keys outlined in `docs/sms-setup.md`).
- `OTP_CHANNEL` lists only channels you wish to offer. Credentials present do not prove the external provider is healthy; failed sends return a 503 and should trigger a fallback to email or staff recovery.
- Email-based recovery requires deliverable email and working SMTP.
- Chat-widget quick help is **local rule-based content**, not ChatGPT. No OpenAI or other LLM API is wired into this repository; never label or advertise that widget as ChatGPT.

## Safe production deployment
Check current PostgreSQL schema with `npm run db:schema:check`. Do not run `db:push`, `db:setup`, or blindly replay old migrations on the existing production database. See `docs/database-safe-sync.md`.
