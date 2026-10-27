# Message centre (tickets) — setup

Customers write to you on the website, and anything they email to your support address becomes a ticket too. Staff answer in
**Staff desk → Messages**. Every reply is emailed to the customer and stays on the ticket; when the customer answers the email,
the answer joins the same ticket.

## Addresses

| What | Where |
| --- | --- |
| Customer message centre | `/mail-x7q2` (not in any menu; signed-out visitors are sent to sign-up; staff are sent to the desk). Customers reach it from **My account → Messages** and from the link in every ticket email. |
| Staff | Staff desk → **Messages** tab (owner sees it always; staff need the **Messages** permission in Team). |
| To move the customer address | change `MAIL_PATH` in `src/lib/mail-route.ts` **and** rename the folder `src/app/mail-x7q2`; also change the path in `next.config.ts` (noindex header). |

## One-time setup

1. First run `npm run db:schema:check` to inspect the existing database. Never run all historical migrations on the live, populated PostgreSQL database. Apply only a separately reviewed missing mail-table migration if required.
2. Run `npm install` (adds `imapflow` and `mailparser`, used only to read the support mailbox).
3. Use an existing inbox (for example the currently used `help@aitapri.com`) or create a shop-specific mailbox, then configure **incoming IMAP separately from outgoing SMTP**:
   - On the running server, set `MAIL_SUPPORT_ADDRESS=help@aitapri.com` when that is the actual support inbox, plus `MAIL_IMAP_HOST`, `MAIL_IMAP_PORT=993`, `MAIL_IMAP_USER`, `MAIL_IMAP_PASSWORD`. Keep these outside Git.
   - Alternatively, Owner → System & connections → Email offers dedicated **Incoming IMAP** fields stored in the encrypted vault. Set `INTEGRATIONS_ENCRYPTION_KEY` privately first. A complete server IMAP profile takes precedence; otherwise the complete vault IMAP profile is used. Incomplete SMTP settings never count as a connected inbox.
   - Complete server SMTP settings take priority for outgoing mail; otherwise a complete encrypted UI SMTP profile is used. SMTP and IMAP credentials may use the same account only if the provider supports both protocols.
   - Do not assume emails addressed to `help@aitapri.com` reach another domain's mailbox without an actual mailbox or forwarding rule. Verify delivery in webmail first.
4. Add a cPanel cron job, every 5 minutes, pointing to the **currently deployed canonical address**:
   `curl -s -X POST -H "Authorization: Bearer YOUR_CRON_SECRET" https://nisecomport.com/api/cron/mail`
5. In **Team**, give staff the **Messages** permission.

## How tickets behave

- A new message (website or email) creates a ticket `NC-T1001…` and the customer receives an acknowledgement email.
- Staff statuses: **Open**, **Waiting for customer**, **Get back soon**, **Resolved**, **Closed**.
- When staff reply with **Waiting for customer** (the default) or **Resolved**, the ticket closes by itself after **48 hours** without a
  customer reply, and the customer is told they can reply to reopen it. **Get back soon** never auto-closes.
- A customer reply (website or email) reopens the ticket. Customers can also close or reopen their own tickets.
- A request or print reference (`NC-…`, `PR-…`, `PAN-…`) written in a message is linked to that job when it belongs to the same customer;
  staff see the job's uploaded files next to the ticket and can preview, print, download or zip them. Staff can also link or unlink by hand.
- Files: pictures, PDF, Word, Excel, CSV, text; up to 10 per message and 15 MB each. Files are stored privately, never served as web pages.
- **Storage used** is shown to staff in the left column (attachments, customer documents and free disk space). `MAIL_STORAGE_LIMIT_MB` sets the cap.

## Who is told about new messages

Every new customer message and every customer reply is emailed to **all owners**, **all staff who have the Messages permission**, and the shared
address `STAFF_ALERT_EMAIL`. Disabled or deleted accounts are skipped. Each person gets their own copy with a button that opens the Messages tab.

## Safety rules built in

- Emails from machines (bounces, out-of-office, newsletters) never open tickets or get answers.
- An emailed reply only joins a ticket when the ticket code in the subject matches **and** it comes from the ticket owner's address.
- Mail is shown as plain text only; links are plain links. Attachments are checked by type and content, and renamed programs are refused.
- A single address can open at most 10 tickets a day by email; signed-in customers have their own limits.
