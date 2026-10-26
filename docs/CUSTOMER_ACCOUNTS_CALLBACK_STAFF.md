# Customer account creation, staff ownership, admin-only history and messaging validation

## Customer first contact

On any service listing or detail page, the customer chooses **Request callback** or **Continue online**.

Callback collects name, Indian mobile number and email. A checkbox permits callback contact; a **separate optional checkbox** lets them start creating an account. If opted in, the API requests an email sign-up challenge and the callback success page links to `/signup?callback=1`; encrypted tab/session state prepopulates the details and lets the user finish by verifying their email code, then choosing an account password. We deliberately **do not email a temporary password or create an active account from unverified contact details**. An existing account is not duplicated.

Existing, scoped welcome coupon: **₹30 on email verification + ₹20 on phone verification**, one-time per type, and only where minimum purchase, expiry, and eligible services permit. This is discount balance, **not SMS gateway message credits**. The coupon is stored in the existing `coupons` system; the callback form only advertises eligibility and does not award a coupon.

## Staff callback desk

- Staff with the `requests` permission and administrators see the shared Inbox.
- **Take case** claims an unassigned callback (atomic check); an admin may take over a colleague's case. `handledBy` is the current owner, and each action separately records `actorId` in the activity log.
- **All callbacks / My callbacks** filter plus the current owner name; no need to understand technical status codes.
- Staff call, mark contacted, **Send online form** (email after customer consent) or **Close offline**.
- Another staff member cannot change an assigned callback unless ownership is reassigned by an admin.
- Closed cases are kept in the database for audit; they disappear from the active callback desk.

## Admin → Customers

**Admin only**, independent of regular Staff Permissions. New Customers tab:

- Search up to 50 recent customers by name, mobile, or email.
- Open a customer and inspect field-level history for name, email, mobile, address, profile settings, account creation, email confirmation and mobile verification. Each history item records timestamp, actor and before/after where appropriate. Credentials, OTPs and password hashes are never part of the history.
- Correct name, email, mobile with mandatory reason. Changes are recorded in PostgreSQL's existing `activity_log` with `permission=team`. Email corrections revoke sessions and invalidate email verification, phone corrections invalidate mobile verification.
- Disable / enable access, or **Archive account** after all service requests have closed. Archiving logs out and anonymizes the login record but retains statutory records / required transaction audit. This is **not an immediate physical deletion of every historical service document**. Staff accounts are managed separately in Admin → Team.
- Changes before audit deployment cannot be reconstructed. Admin history is restricted to the latest 150 entries per customer.

No migration required: uses existing `leads.handledBy`, `users` and `activity_log`.

## SMS and WhatsApp setup / verification

**Admin → System & connections** already reports `delivery.sms` and `delivery.whatsappOtp` as availability *configured* flags, not live delivery checks.

### SMS provider choices

**MSG91**: On the provider dashboard check **One API → Balance**, or **SMS Segmento → Dashboard**, for the remaining OTP/SMS balance; see https://msg91.com/help/text-sms/how-to-check-balance-in-msg91 .
Configure backend environment: `OTP_SECRET` (>=32 random characters), `SMS_PROVIDER=msg91`, `OTP_CHANNEL=sms`, `MSG91_AUTH_KEY`, `MSG91_TEMPLATE_ID`. Complete the provider's applicable DLT registration and approved OTP template setup.

**Fast2SMS**: Check the SMS balance on the logged-in provider account, then configure `FAST2SMS_API_KEY`, `SMS_PROVIDER=fast2sms`, `OTP_CHANNEL=sms` and `OTP_SECRET`. If using a DLT template, also add the sender ID/template ID.

In NISE COMPORT, **Profile → Verify mobile** sends a real OTP to an Indian mobile number. Receive and submit that OTP to confirm real delivery and mark the account verified. A stored API key, a displayed SMS enabled flag, or a claim of "50 credits" does **not** confirm delivery or available provider balance.

### WhatsApp

For chat bot / messages, configure Meta WhatsApp Business Cloud API environment on the existing server: `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN`. In the Meta app, add webhook `https://YOUR_DEPLOYED_DOMAIN/api/whatsapp/webhook` and subscribe to the `messages` event. Use approved message templates when initiating outside the customer conversation window.

For **WhatsApp OTP**, this project additionally supports Meta via `WHATSAPP_PROVIDER=meta`, `META_WA_TOKEN`, `META_WA_PHONE_ID`, `META_WA_TEMPLATE`, `OTP_CHANNEL=whatsapp,sms`. A verified authentication template and billing are required. Alternatively use supported MSG91/Fast2SMS WhatsApp credentials per `docs/sms-setup.md`.

To test: send **menu** from a personal WhatsApp number to the configured business number and confirm a reply plus activity in **Admin → WhatsApp chats**. Check webhook status / delivery reports in Meta Business and message OTP delivery to a real phone. Never expose provider keys in GitHub or NEXT_PUBLIC variables.

**Provider-specific credit balance is NOT accessible from repository code or configuration flags.** A reported 50 credits must be verified by logging into the corresponding provider dashboard; no credentials were exposed, and no chargeable test SMS was sent while implementing.

## Pre-merge validation

Run `npm run verify` in a checkout of `pan-49a`. Verify:
1. Callback opt-out creates a lead but no signup email; opt-in triggers a safe email challenge; existing email does not create duplicate account.
2. Customer verifies email and optional mobile, and the welcome coupon reflects one-time, scope-limited credit.
3. Staff A takes a case, Staff B sees staff A as owner and cannot act, Admin may take over; actor history records both people.
4. Logged-in customer changes name and phone. Admin → Customers shows old/new and the customer actor; staff cannot access it.
5. Admin corrections revoke email verification and sessions when email changes; disabled users cannot sign in; archiving rejects accounts with active work.
6. Run one real SMS OTP and one WhatsApp menu request, checking actual delivery and provider balance separately.

Until live DB, email, gateway and browser tests pass, this is **committed code rather than production-verified functionality**.
