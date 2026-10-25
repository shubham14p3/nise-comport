# WhatsApp assistant setup — NISE COMPORT

The assistant answers customers on WhatsApp automatically, and everything is saved in **Admin → WhatsApp chats**, where staff can read and reply.

## What it does
| Customer sends | Assistant replies |
|---|---|
| hi / menu | Menu: 1 Charges, 2 Track, 3 Pay, 4 Documents, 5 Address, 6 Talk to team |
| "PAN card price" | Your service charge from **Admin → Service prices**. If the price is blank: "we quote after checking" and staff are alerted |
| "documents for voter ID" | The checklist from the service page, and a reminder not to send documents on chat |
| "status" or a reference | Latest requests for the number on their account (existing feature) |
| "pay" | Their open payment and the `/pay/<reference>` link (they sign in on the site) |
| address / timings | Address, hours, map link |
| agent / complaint / refund / anything unclear | Hand-over: flagged "needs reply" in Admin and in the inbox |
| STOP / YES | Existing opt-out and opt-in handling |
| photo or document | Asks them to upload it securely on the website instead |

Limits: 40 messages per customer per hour. Replies are free-form text, which WhatsApp allows only within 24 hours of the customer's last message. To message first (payment reminders, status updates) you need Meta-approved templates, already supported by the campaign tools.

## One-time setup (Meta)
1. Go to developers.facebook.com → create an app → type **Business** → add the **WhatsApp** product.
2. Use a business phone number that is **not already on WhatsApp / WhatsApp Business app** (or delete that account first). Verify it by SMS or call.
3. Business verification (needed for higher limits): business name and address, Udyam certificate, PAN, a utility bill or bank statement, and your website `nisecomport.com`.
4. Create a **System User** in Business Settings, give it the app and `whatsapp_business_messaging` and `whatsapp_business_management`, and generate a **permanent token** → `WHATSAPP_TOKEN`.
5. From WhatsApp → API Setup copy the **Phone number ID** → `WHATSAPP_PHONE_NUMBER_ID`. App settings → Basic → **App secret** → `WHATSAPP_APP_SECRET`.
6. Choose a long random string (16+ characters) → `WHATSAPP_VERIFY_TOKEN`.
7. WhatsApp → Configuration → Webhook: callback URL `https://www.nisecomport.com/api/whatsapp/webhook`, verify token as above, then subscribe to **messages**.
8. Run `npm run db:migrate` (creates the chat log table).

Costs: Meta charges per conversation category (service replies inside 24 hours are free; marketing/utility templates are charged). Check current rates in Meta's pricing page.

## QR-scanned brochure (two messages)
The landing page at `/welcome?src=poster` displays both the service catalogue and
business contact card immediately. Tapping WhatsApp pre-fills an enquiry from the
customer (it never sends by itself). Once the visitor taps **Send**, a configured
Meta Cloud API webhook at `/api/whatsapp/webhook` invokes the existing bot,
which responds with two separate NISE COMPORT messages. No automatic business
messages can be delivered without the Cloud API credentials, verified webhook,
and an active business phone number. Website previews work even without Meta.

To include Instagram: set `NEXT_PUBLIC_INSTAGRAM_URL` and optionally
`NEXT_PUBLIC_INSTAGRAM_HANDLE` (for example, `@youractualhandle`) in the
build environment, or include the Instagram URL in `NEXT_PUBLIC_SAME_AS`.
The contact email is `NEXT_PUBLIC_CONTACT_EMAIL`; the current website comes
from `NEXT_PUBLIC_SITE_URL`. Rebuild/redeploy after changing `NEXT_PUBLIC_*`
values, and regenerate any QR poster that points directly to a WhatsApp URL
instead of the `/welcome` landing page.

## Test
Send "menu" from a personal phone to the business number. You should get the menu and see the chat in Admin → WhatsApp chats.
