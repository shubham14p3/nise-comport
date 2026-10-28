# Service callback → offline or online application

## Customer entry

Applies to **all listed service cards** in the service search and individual service pages.

- **Request callback:** accessible modal, mobile-first; only full name, Indian mobile number and email plus specific contact consent. No login, document scan, OTP or payment.
- **Continue online:** opens the existing service-specific application/quotation flow immediately. Preserve all its sign-in and completed-form verification requirements.
- Callback data is stored in the existing PostgreSQL `leads` table. `details.email` and `details.serviceSlug` are staff-only metadata. Existing `leads` indexes and schemas remain unchanged, so **no database migration is needed**.
- Separate callback consent never adds the caller to campaign contacts. Public lead creation is rate-limited by IP and mobile number; email and service slug are validated server-side.
- After callback submission, show receipt/success in the modal, without inventing a government reference or claiming the application was filed.

## Staff flow (Admin → Inbox)

| Status | Meaning | Next action |
|---|---|---|
| `new` | Waiting for first call | Call / WhatsApp |
| `called` | Staff contacted customer | Close offline or send online form |
| `offline_closed` | Customer chose in-person/offline service, or staff closed that enquiry | Archived from active callback queue |
| `online_invited` | Customer agreed to proceed online; staff sent email with the existing application link | Await full application |
| `done` | Online application received (matching email, mobile and service) | Retain audit record, archive |
| `spam` | Invalid callback | Archived |

**Send online form** is staff initiated, with a confirmation. It checks SMTP configuration,
resolves the real service and sends the correct existing online route. A failed email does not
pretend that an invitation was sent. Staff can close a lead offline even after an invitation
if the customer changes their mind. The lead is kept in PostgreSQL for audit; closing is not deletion.

After a signed-in customer sends a full application from the invitation, the application gets its
usual NISE tracking reference. The original callback is marked `done` only when **email,
mobile number and service slug match** the invitation. No full application form is prefilled
from an unverified anonymous callback, avoiding account/identity confusion.

### Test checklist

1. Open `/services`, search for a service, verify both buttons appear on the card.
2. Open a service detail page, verify callback and online options in the hero and aside.
3. As a signed-out visitor, submit contact details with consent and verify success. Without
   consent, or with an invalid email or mobile, the API must not create a lead.
4. Staff open Admin → Inbox; see the service, name, mobile and email; mark Called.
5. Choose **Close offline**. Confirm the active Inbox no longer includes the callback, while
   it remains in the Leads history/status list and the audit trail.
6. For a separate callback, confirm customer consent to proceed online, click **Send online form**,
   and verify email delivered with the correct application route and status `online_invited`.
7. Verify SMTP failure leaves the callback open without claiming an email was sent.
8. Sign in and submit the online application with the invited email/mobile/service. The new
   authenticated NISE request should appear with its tracking reference; matching callback
   should leave the active Inbox.
9. Verify no other leads sharing a phone but different email or service were automatically closed.
10. Test mobile modal focus, Escape and close controls; confirm that PAN/Voter/Passport flows
    still use their existing specialized form and sign-in-gated final preview.

### Deployment

No PostgreSQL migration or additional Node instance is needed. Existing `SMTP_*`
credentials must work to enable staff to email form invitations. Continue using your
existing application server and encrypted draft/form workflow.

No CI/build result is established by pushing these files. Run `npm run verify` and test
one callback round trip against your development PostgreSQL before production deployment.
