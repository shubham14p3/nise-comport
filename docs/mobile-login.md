# Mobile sign-in, "find my records" and verify rewards

**Sign-in.** /login and /signup open on mobile number (+91, exactly 10 digits) with a 6-digit PIN. A toggle switches to email.
- Sign-up: number + name → site makes a random PIN, shows it once, signs in. Only a hash is stored. Staff can see it while a records request is pending (Inbox) and can reset it.
- 5 wrong PINs for a number pause it 15 minutes (same answer for unknown numbers).
- Accounts made this way have a placeholder email (`...@mobile.nisecomport.invalid`); mail is never sent to it. Adding a real email needs only a code.

**Records.** If the number (main, WhatsApp or alternate) matches imported records, a pending claim opens (valid 7 days, staff emailed, reminder after 2 days). Nothing shows until: staff approve, staff send a WhatsApp code the customer types in Profile → My records, or the customer verifies the number by SMS. Customers see first name, service and dates only; each view is logged; "This isn't me" alerts staff.

**Rewards.** ₹20 wallet credit for a verified mobile (SMS code or WhatsApp code) and ₹20 for a verified email, once each (unique index on wallet reference).

**Needs:** `RECORDS_ENCRYPTION_KEY` (same value as the PAN key if records were imported with it), `npm run db:migrate` (migration 0029), SMS keys (docs/sms-setup.md) to enable SMS codes, `STAFF_ALERT_EMAIL` and SMTP for staff emails, the cleanup cron for reminders.
