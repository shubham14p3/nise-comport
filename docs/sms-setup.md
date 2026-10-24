# SMS codes (mobile number sign-in)

SMS is off until you add valid provider keys **and** a production `OTP_SECRET` (32 or more characters). Customers can always use their existing email/password or mobile/PIN; mobile/password does not depend on SMS. SMS/WhatsApp one-time-code buttons appear only when configured. With a previously verified phone number, customers may use an OTP to recover a PIN or password.

Pick one provider. Both are supported; set `SMS_PROVIDER=msg91` or `fast2sms` if you add keys for both.

## MSG91
1. Sign up at msg91.com, finish business KYC.
2. Register your business and a sender ID on DLT with your telecom operator (required in India for OTP SMS). MSG91 guides you.
3. Create an OTP template, for example: `Your NISE COMPORT code is ##OTP##. Do not share it. Valid 10 minutes.` and get it approved.
4. Environment: `MSG91_AUTH_KEY` (API keys page) and `MSG91_TEMPLATE_ID`.

## Fast2SMS
1. Sign up at fast2sms.com and recharge the wallet.
2. Environment: `FAST2SMS_API_KEY` (Dev API page). With only this, the site uses Fast2SMS's OTP route.
3. If you have your own DLT-approved template, also set `FAST2SMS_SENDER_ID` and `FAST2SMS_TEMPLATE_ID` to use the DLT route.

## Check it
- Run `npm run db:schema:check` to verify the existing production database. Do **not** blindly replay all historical migrations or use `db:push` against production.
- Sign in, open Profile, enter your mobile number, Save, then choose "Verify this number by SMS".
- Provider keys only indicate configuration, not live network health. Test one real delivery before announcing the feature. Failed delivery is reported to the user, and no new verification code can be accepted if sending fails.

## WhatsApp codes (optional)
Both providers can also send the code on WhatsApp. Add `OTP_CHANNEL=whatsapp,sms` (WhatsApp first, SMS if it fails).
- **Customers choose:** with both channels on, login and "Verify mobile" show **Send SMS** and **Send on WhatsApp**. The other channel is the automatic fallback.
- **Meta directly (cheapest, no middleman markup):** in Meta Business → WhatsApp → API setup, add a number, create a *Authentication* template with a copy-code button, make a permanent System User token. Set `WHATSAPP_PROVIDER=meta`, `META_WA_TOKEN`, `META_WA_PHONE_ID`, `META_WA_TEMPLATE`. Meta charges about ₹0.115 per delivered code plus GST.
- **MSG91**: connect your WhatsApp Business number in MSG91, create an *Authentication* template (code as variable 1), then set `MSG91_WHATSAPP_NUMBER`, `MSG91_WHATSAPP_TEMPLATE`, `MSG91_WHATSAPP_NAMESPACE`. Set `MSG91_WHATSAPP_BUTTON=off` if the template has no button.
- **Fast2SMS**: get a WhatsApp template approved in their panel and set `FAST2SMS_WHATSAPP_MESSAGE_ID`.
- The WhatsApp request formats were written from memory of the providers' docs and could not be test-sent from here: send yourself one code first and check the server log for `[otp] whatsapp send failed`.

## Safety built in
- One code per minute and six a day per number, 30 an hour per network, five wrong guesses per code, codes last 10 minutes.
- SMS/WhatsApp code sign-in and self-service mobile recovery require a number previously verified for one account. A registered, unambiguous mobile number may also be used with the account password independently of OTP configuration.
- A sign-in code request gives the same reply whether or not the number is registered.
- Changing the number in the profile removes its verified status.

## Configuration and safety
- Add `OTP_SECRET` (32 or more random characters) to the **backend environment only**; never `NEXT_PUBLIC_` keys or GitHub.
- Configure `OTP_CHANNEL=sms`, `whatsapp` or `sms,whatsapp` (plus the corresponding provider keys).
- With no keys or an invalid production OTP secret, the account pages hide self-service mobile recovery and any SMS/WhatsApp OTP choices. Email/password and mobile PIN remain available.
- Manual staff-assisted PIN recovery requires identity verification; staff must never reset a PIN simply because someone knows the phone number.
