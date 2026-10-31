# Admin-only customer preview and granular staff access

## Customer preview

1. Sign in as an administrator, open **Desk → Customers**, and search by name, email or phone.
2. Select the **exact account** and choose **Impersonate**. An administrator-owned, signed 15-minute read-only preview opens at `/customer-preview`. The administrator session is **not replaced**. The preview reads the selected customer's actual account ID and customer data from PostgreSQL; the target's password, PIN and OTP are never needed.
3. The preview shows basic customer information, online requests, print orders, counter visits, wallet entries and saved addresses. It has no forms or write actions. Use **Return to Admin** or the automatic expiry return. Extensions are constrained by a 30-minute total maximum (extension cannot exceed the original 30-minute window).
4. Start, extend, end and explicit account provisioning actions are audited. Admin access is rechecked for every read; a revoked admin session cannot keep previewing.
5. If no account exists, use **Create customer from mobile** in Customers. This is an explicit owner action. It creates a mobile-only account with an unknown random password and unverified contact information. If any account already uses the phone, creation is refused; select the existing account instead. A counter-created account is already a user and must be reused.
6. A team/owner member can have customer activity on the same user ID, with no separate account or role change. Other owner accounts may be previewed only by the primary owner.

**Limitations:** This is a read-only admin customer preview, not a true authentication switch and not the entire interactive customer website. It does not allow the customer to sign in without verifying their identity. It does not automatically claim imported registers by mobile number: claims still require ownership verification. Never edit target records during preview.

## Staff sidebar

Team Management now lists each staff-eligible module individually, with grouped checkboxes and a separate charge/refund permission. Choosing a tab saves a `tab:<id>` grant plus its minimal legacy backend permission. New staff default to Requests only. Owner-only Customers, Team, and System & connections cannot be delegated via the staff picker.

For an account with explicit `tab:<id>` grants, the dashboard hides unchecked tabs, and the opaque encrypted API gateway denies requests to unchecked module routes. Legacy staff without tab grants keep their existing permissions until an owner edits their module selections.

## Test plan

- Preview customer with password; preview mobile-only counter customer without password; preview staff as customer; return and wait for expiration.
- Verify 15-minute timeout, 30-minute total extension ceiling, simultaneous browser tabs and admin session revocation.
- For a phone shared by multiple users, require exact account selection. Explicit creation must not create a duplicate.
- Verify preview does not permit modifying payments, PINs, passwords, applications, account settings or customer records.
- Grant only Contacts to a new staff user: confirm WhatsApp campaigns are absent and encrypted campaign API operations return 403. Grant both: confirm both work. Repeat for Inbox, Messages, Payments and Requests.
