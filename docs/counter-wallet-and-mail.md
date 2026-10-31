# Counter wallet, collection and mailbox setup

Counter desk → owner wallet settings controls deduction (default 10%) and accumulation (default 5%). The per-visit checkbox defaults to deduction. A zero balance earns credit instead. Accumulation collects the full bill; a deduction visit cannot earn credit too. Counter bill tickets are excluded from completed-order loyalty to avoid rewarding the same visit twice. Credit is posted when a visit is recorded; record genuine visits only.

Counter desk → History shows ten visits per page. Owners see all, staff see their own. Raise payment request requires Charge permission and confirmation that the amount is still unpaid. It creates a customer payment ticket for the saved collect amount, after wallet deduction, and a shareable link. It does not mark payment received or insurance approved. Online Payments remains the place to verify cash/UPI receipts. Counter visits created before this change can also be charged. Do not charge an already-paid visit.

Run `npm run db:migrate` during deployment to add the new read indexes. No existing balances are recalculated.

Counter shows email/mobile verification status only. Verification actions belong to Find customer or the customer profile. Staff contact corrections in Find customer wait for admin approval; the pending banner shows proposed values while searches continue to show the saved values.

## Incoming email

No AI Tapri mailbox is hardcoded. SMTP is outgoing; these separate values select incoming mail:

```dotenv
MAIL_SUPPORT_ADDRESS=info@nisecomport.com
MAIL_IMAP_HOST=YOUR_MAIL_PROVIDER_IMAP_HOST
MAIL_IMAP_PORT=993
MAIL_IMAP_USER=info@nisecomport.com
MAIL_IMAP_PASSWORD=YOUR_MAILBOX_PASSWORD
MAIL_IMAP_FOLDER=INBOX
```

Use the provider's actual host. Supply all three IMAP credentials together. Restart after changing `.env.local`. A partial override cannot reconnect a different saved account. A saved Email integration is used only with no environment IMAP override; it must match the support mailbox. Existing imported conversations remain until an owner selects and deletes them.

Admin mail selection removes up to 100 loaded conversations at a time from the website inbox. It does not delete remote provider mail or purge stored attachments; import identifiers are retained to prevent historical messages being imported again. Staff and customers cannot use the deletion endpoint.

## WhatsApp

The chat offers the configured WhatsApp assistant and the original shop contact separately. Set `NEXT_PUBLIC_WHATSAPP_ASSISTANT` to the active API sender and rebuild when changing it. Template bodies, sample values and exact environment names are in `whatsapp-templates.md`. Drafts still require submission/approval in Meta WhatsApp Manager.

## Counter visit conversations and contact numbers

Each counter visit has a collapsed Updates / ask a question button in customer history and Counter desk history. Only the owning customer, recording staff member with Counter permission, and owners can read or reply. A shared mobile number does not grant access. Opening loads the latest 20 messages; older messages are cursor-paged. Updates and reference numbers are plain text, at most 2,000 characters, with retry-safe sends and a refresh button. Online request rows do not gain this conversation control.

Migration 0044 adds the conversation table and an indexed visit/date cursor. It also aligns account WhatsApp values with their current mobile values and installs a database trigger to maintain that rule across every account-writing flow. This does not verify a number or change login ownership. The profile WhatsApp field is read-only and follows Mobile.
