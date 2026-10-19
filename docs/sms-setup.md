# SMS codes (mobile number sign-in)

SMS is off until you add keys. With it on, customers can verify their mobile number in **Profile** and then sign in with
the number plus a 6-digit SMS code (or the number plus password). Without keys nothing changes and the SMS buttons stay hidden.

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
- Run `npm run db:migrate` first (adds the phone code table and the verified-number column).
- Sign in, open Profile, enter your mobile number, Save, then choose "Verify this number by SMS".
- Provider request formats were written from their public documentation. If a provider changes its API, the error shows in the server log as `[sms] send failed`.

## Safety built in
- One code per minute and six a day per number, 30 an hour per network, five wrong guesses per code, codes last 10 minutes.
- Only a number proven by SMS can sign in once SMS is on. A number can be verified on one account only.
- A sign-in code request gives the same reply whether or not the number is registered.
- Changing the number in the profile removes its verified status.
