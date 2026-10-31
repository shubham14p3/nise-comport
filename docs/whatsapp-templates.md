# NiSE COMPORT — WhatsApp template submission pack

These are submission drafts, not proof of Meta approval. Create them in
[WhatsApp Manager → Message templates](https://business.facebook.com/wa/manage/message-templates/)
under the production WABA used by the API sender. Meta makes the final category decision.
Do not enable a template until its name, language and parameter order match the approved version.

Fixed text, paragraph breaks and *bold* formatting live in the approved Meta template.
The website supplies variable values, not the entire template text. Use BODY variables
only for the notification templates below: no header, footer variables or buttons are required.
Use a standard Copy Code Authentication button for OTP. Do not add an image header to
these templates. Campaigns with posters need a separate approved image-header variant.

## Configuration map

| Template | Category to submit | Configuration | BODY variables in exact order |
|---|---|---|---|
| nise_login_otp | Authentication | META_WA_TEMPLATE | OTP; also provided to Copy Code button |
| nise_request_received | Utility | WHATSAPP_CONFIRM_TEMPLATE | Name, request reference, service |
| nise_staff_new_request | Utility | WHATSAPP_STAFF_TEMPLATE | Reference, service, customer/contact, details |
| nise_request_status | Utility | WHATSAPP_STATUS_TEMPLATE | Name, reference, service, status |
| nise_official_reference | Utility | WHATSAPP_OFFICIAL_REF_TEMPLATE | Name, request reference, reference type, official reference |
| nise_review_request | Marketing (Meta decides) | WHATSAPP_REVIEW_TEMPLATE | Name, reference, service, review link |
| nise_promo_offer | Marketing | Campaign editor → Template name | First name, offer summary |
| nise_payment_request | Utility | WHATSAPP_PAYMENT_TEMPLATE | Name, amount in rupees, service, reference |
| nise_callback_received | Utility | WHATSAPP_CALLBACK_TEMPLATE | Name, requested service |

Submit the examples below in English. Set `WHATSAPP_TEMPLATE_LANG` to the exact approved
notification language code, such as `en` or `en_US`. It applies to automatic notifications,
not OTP or campaigns. OTP uses `META_WA_LANG`; campaigns use their selected contact language
(en/hi/bn), so obtain approval for those language variants before using them.

## 1. Login and mobile verification

Name: `nise_login_otp` · Authentication · Copy Code button.

Use Meta's Authentication preset, not a custom Utility/Marketing body. Enable its security
recommendation and a **10 minute** expiry notice to match `src/lib/phone-auth.ts`.
Sample code: `123456`. The website supplies that code to BODY parameter 1 and URL button 0
(the API representation used by Copy Code authentication templates).

Existing code supports mobile sign-in, profile mobile verification and mobile credential
recovery through the shared phone OTP flow: six digits, HMAC hashes, ten-minute validity,
five incorrect attempts, rate limits and one-time consumption. Email OTP is a separate flow.
Saved admin integration credentials can take precedence for an explicitly chosen WhatsApp
channel. Keep their token, sender ID, template and language current too.

Configuration after approval:

```dotenv
WHATSAPP_PROVIDER=meta
META_WA_TOKEN=YOUR_PRIVATE_TOKEN
META_WA_PHONE_ID=YOUR_CURRENT_API_SENDER_ID
META_WA_TEMPLATE=nise_login_otp
META_WA_LANG=en
META_WA_BUTTON=on
OTP_CHANNEL=whatsapp,sms
# Keep the existing OTP_SECRET (32+ characters) and working SMS fallback credentials.
```

Before approval/test delivery, keep `OTP_CHANNEL=sms`. A template draft alone does not enable OTP.
The two token variables may share one authorized token, but WHATSAPP_APP_SECRET is different.
No credentials belong in Git or screenshots. Current app-side OTP recipients must be Indian mobile numbers.

## 2. Customer request received

Name: `nise_request_received` · Utility

```text
Hello {{1}}, NiSE COMPORT has received your request.

*Request:* {{2}}
*Service:* {{3}}

Our team will review the details and contact you if more information is needed.
You can check progress through your account at nisecomport.com.
```

Samples: `Shubham` · `NC-12345` · `PAN card correction`.
Triggered after a full service request is saved. Staff receive a separate template if configured.

## 3. New request for staff

Name: `nise_staff_new_request` · Utility

```text
*NiSE COMPORT — New service request*

*Reference:* {{1}}
*Service:* {{2}}
*Customer:* {{3}}
*Details:* {{4}}

Please review this request in the staff dashboard at nisecomport.com.
```

Samples: `NC-12345` · `PAN card correction` · `Shubham, registered contact` · `Name correction requested`.
`WHATSAPP_STAFF_NUMBER` must be a separate receiving number, not the API sender.
The same template also carries a DB-DOWN reference if a request could not be saved;
that fallback is explicitly identified in its details. Avoid personal document numbers in details.

## 4. Service status update

Name: `nise_request_status` · Utility

```text
Hello {{1}}, here is an update on your NiSE COMPORT request.

*Request:* {{2}}
*Service:* {{3}}
*Status:* {{4}}

Sign in at nisecomport.com to view the details.
```

Samples: `Shubham` · `NC-12345` · `PAN card correction` · `Under review`.
Also used for payment verification and, if the separate payment template is disabled,
quotation-ready notifications. A separate payment template prevents two quote notifications.

## 5. Official application reference

Name: `nise_official_reference` · Utility

```text
Hello {{1}}, an official reference has been recorded for your NiSE COMPORT request.

*Our request:* {{2}}
*Reference type:* {{3}}
*Official reference:* {{4}}

Please save this reference for tracking. You can also view it in your account at nisecomport.com.
```

Samples: `Shubham` · `NC-12345` · `Application acknowledgement` · `EXAMPLE12345`.
Triggered when staff record an official reference through the existing request workflow.

## 6. Feedback request

Name: `nise_review_request` · Marketing (subject to Meta classification)

```text
Hello {{1}}, thank you for choosing NiSE COMPORT.

Your request {{2}} for {{3}} is complete.
We would appreciate your feedback about our service.

*Feedback link:* {{4}}
```

Samples: `Shubham` · `NC-12345` · `PAN card correction` · `https://nisecomport.com/review/NC-12345`.
Triggered by the existing completed-request flow. Enable only for recipients eligible for
this category under your consent process; a callback consent is not marketing consent.

## 7. Promotional campaign

Name: `nise_promo_offer` · Marketing

```text
Hello {{1}}, greetings from *NiSE COMPORT*!

{{2}}

Terms and eligibility apply. Visit nisecomport.com for details.
Reply STOP to stop promotional messages.
```

Samples: `Shubham` · `Example: eligible customers can claim the published service-charge offer`.
Configure in the campaign editor, not a notification environment variable. Existing campaign
code supplies the first name and the first paragraph of campaign content as the offer summary.
Use an approved image-header variant if the campaign has a poster. Use opted-in recipients.

## 8. Payment quotation

Name: `nise_payment_request` · Utility

```text
Hello {{1}}, your NiSE COMPORT payment quotation is ready.

*Quoted amount:* ₹{{2}}
*Service:* {{3}}
*Request:* {{4}}

Sign in at nisecomport.com to review the quote and pay.
Eligible discounts or payment processing charges, if any, are shown before payment.
Never share your PIN or OTP.
```

Samples: `Shubham` · `150.00` · `PAN card correction` · `NC-12345`.
Triggered after a new quotation is committed. Amount is the saved quote in rupees,
before eligible discounts or provider fees. Does not charge the customer automatically.

## 9. Callback acknowledgement

Name: `nise_callback_received` · Utility

```text
Hello {{1}}, NiSE COMPORT has received your callback request regarding {{2}}.

Our team will contact you to discuss the next steps.
If you did not request this callback, please let us know.
```

Samples: `Shubham` · `PAN card correction`.
Triggered only by a successfully saved, explicitly requested service callback. It does not
subscribe the customer to marketing. Partial wizard progress and general chat leads do not trigger it.

## Enable approved notifications

Only populate entries whose corresponding templates are approved:

```dotenv
WHATSAPP_TEMPLATE_LANG=en
WHATSAPP_CONFIRM_TEMPLATE=nise_request_received
WHATSAPP_STAFF_TEMPLATE=nise_staff_new_request
WHATSAPP_STATUS_TEMPLATE=nise_request_status
WHATSAPP_OFFICIAL_REF_TEMPLATE=nise_official_reference
WHATSAPP_REVIEW_TEMPLATE=nise_review_request
WHATSAPP_PAYMENT_TEMPLATE=nise_payment_request
WHATSAPP_CALLBACK_TEMPLATE=nise_callback_received
```

Set valid WHATSAPP_TOKEN / WHATSAPP_PHONE_NUMBER_ID for the current API sender.
Keep the Indian shop number separate if it is used exclusively in the mobile app.
Configure WHATSAPP_APP_SECRET and the matching webhook verification string on the hosted app.
Restart after server environment changes. Rebuild/deploy when pulling these code changes.
Then test request submission, a saved quote, callback acknowledgement, status, official reference,
feedback and OTP individually. API acceptance is not proof of handset delivery.
