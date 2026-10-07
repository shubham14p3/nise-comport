# Photo inbox

Drop photos here, then run `npm run photos`. They are resized, converted to WebP, cleaned of
location (GPS) data, given SEO-friendly names and added to the gallery and service pages.

Put each photo in a folder named after the service it shows, for example:

    photo-inbox/pan-card/IMG_1234.jpg
    photo-inbox/aadhaar/counter.webp
    photo-inbox/shop/front-of-shop.jpg      (shop, counter, team: shown in the gallery only)

Service folder names: pan-card, aadhaar, income-caste-residence-certificate, voter-id,
passport-driving-licence, aeps-money-transfer, bike-insurance, car-insurance, health-life-insurance,
scholarship-forms, exam-forms, bill-payment-recharge, itr-gst, printing-scanning, computer-repair,
website-design, ticket-booking, lic-policy, mutual-fund-sip, rent-agreement, fssai-license,
udyam-registration, jeevan-pramaan, birth-death-certificate, land-mutation, aadhaar-pvc-card,
bank-account-opening, ayushman-card, ration-card, abua-awas-yojana — or shop / team.

Photos dropped straight into photo-inbox/ (no folder) count as "shop".
Processed originals move to photo-inbox/_done/. Nothing in this folder is uploaded to GitHub.
