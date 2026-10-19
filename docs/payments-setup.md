# Payments setup — NISE COMPORT

Three ways to pay, all on `/pay/<request reference>`:

| Option | Cost to you | Cost to customer | Confirmation |
|---|---|---|---|
| UPI QR | ₹0 | ₹0 | Manual: customer enters the UTR, staff confirm in Admin → Payments |
| Razorpay | ~2% + GST on the fee | `PAYMENT_ONLINE_FEE_PERCENT` added | Automatic (webhook) |
| Cashfree | ~1.95% to 2% (UPI often lower) | same fee added | Automatic (webhook) |

Staff create the amount in **Admin → Payments → Ask to pay** (request reference + amount) and send the customer the link `https://www.nisecomport.com/pay/<reference>`. Rates change, so confirm current pricing on each provider's site. Charge the fee only on online options, and show it clearly (the page does).

## 1. UPI QR (do this first, today)
Env: `UPI_ID` (e.g. `nisecomport@okaxis`), `UPI_PAYEE_NAME`. Use a **current account / business UPI ID** if possible; a personal one works but has daily limits. Then run `npm run db:migrate`.

## 2. Razorpay — documents
No GST number is needed for a proprietorship or an individual. Typically asked:
- PAN card of the proprietor (and business PAN if a firm)
- Aadhaar (for KYC of the proprietor)
- Udyam registration certificate (business proof) — or shop licence / CSC registration letter
- Bank account proof: cancelled cheque or recent statement in the same name as the PAN/business
- Website URL with live **Terms, Privacy, Refund & Cancellation, Contact and Pricing** pages (you have all five)
- Business address proof (electricity bill or rent agreement) if asked
Steps: Sign up → complete KYC → add website → wait for review (usually 2–5 working days). Then Settings → API keys (Key ID + Secret) and Webhooks → URL `https://www.nisecomport.com/api/webhooks/razorpay`, events `payment.captured` and `order.paid`, set a secret → `RAZORPAY_WEBHOOK_SECRET`.

## 3. Cashfree — documents
Same set: proprietor PAN, Aadhaar, Udyam (or other business proof), cancelled cheque/bank statement, website with policy pages. GST is optional for small businesses. Steps: sign up → submit KYC and business details (website + policies) → get Test mode keys immediately, Production after approval. Payment Gateway → Developers → API keys → `CASHFREE_APP_ID`, `CASHFREE_SECRET_KEY`; Webhooks (payload version must be the same as `CASHFREE_API_VERSION`, or the 2025 and 2023 versions also work) → `https://www.nisecomport.com/api/webhooks/cashfree`. Use `CASHFREE_ENV=sandbox` until approved, then `production`.

## Notes
- A gateway may ask what you sell: "assisted online government and digital services (CSC / Pragya Kendra), printing, insurance assistance". Do not describe it as government services provided directly.
- Gateway fees reach your bank account on T+1 to T+2, net of commission.
- Customer needs a 10-digit mobile number in their profile to pay with Cashfree.
- Test with the sandbox/test keys and ₹1 before going live.
