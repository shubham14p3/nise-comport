export type Article = {
  slug: string; title: string; excerpt: string; image: string; category: string; paragraphs: string[]; checklist: string[]; serviceSlug: string;
  /** Search title if the headline is long (≤ 60 characters incl. " | NISE COMPORT"). */
  seoTitle?: string;
  /** ISO dates shown on the page and in Article structured data. */
  publishedAt?: string; updatedAt?: string;
  sections?: { heading: string; paragraphs: string[] }[];
  faqs?: { question: string; answer: string }[];
  officialLinks?: { label: string; href: string }[];
  imageAlt?: string;
};

/** Default dates for guides that don't set their own. Update updatedAt when you review a guide. */
export const GUIDE_DEFAULT_DATES = { publishedAt: "2026-09-28", updatedAt: "2026-09-30" };
export const GUIDE_AUTHOR = "Sanjay Kumar";
export const GUIDE_AUTHOR_ROLE = "Head of Firm, NISE COMPORT";
export const articles: Article[] = [
  { slug: "pan-card-application-and-correction-jamshedpur", title: "PAN card application or correction in Jamshedpur: a practical checklist", excerpt: "What to check before starting a new PAN or correction request, which details must match, and what acknowledgement to keep.", image: "/images/blog/pan.png", category: "PAN services", paragraphs: ["A PAN application is easier when the applicant’s name, date of birth and supporting identity records agree. Before visiting a service centre in Kharangajhar, check whether you need a new PAN, a correction to an existing record, or a reprint. Duplicate applications can cause avoidable delays.", "Use the current official application route and follow its document, photograph and payment instructions. NISE COMPORT can help with form navigation and document preparation; the tax authority or authorised PAN service decides processing and issuance. Review every detail before submission and keep the acknowledgement number."], checklist: ["Confirm whether this is a new application, correction or reprint", "Check name and date of birth against supporting records", "Bring the proofs requested by the current official form", "Keep the acknowledgement and official payment receipt"], serviceSlug: "pan-card-jamshedpur", seoTitle: "PAN Card Apply or Correction: Jamshedpur Checklist", officialLinks: [{ label: "Protean PAN services", href: "https://onlineservices.proteantech.in/paam/endUserRegisterContact.html" }, { label: "UTIITSL PAN services", href: "https://www.pan.utiitsl.com/PAN/" }] },
  { slug: "aadhaar-update-help-jamshedpur", title: "Aadhaar update help in Jamshedpur: know which updates need a centre", excerpt: "Understand the difference between online guidance and updates that require an authorised Aadhaar centre.", image: "/images/blog/aadhaar.png", category: "Aadhaar guidance", paragraphs: ["Aadhaar update options and requirements depend on the type of change. Some requests may be available online, while biometrics or other changes require an authorised centre. Confirm the current UIDAI process before travelling, and do not share your OTP or full credentials with anyone.", "NISE COMPORT can help you identify the right official route and prepare a checklist. We cannot change the Aadhaar record or guarantee approval; the responsible authority processes the request. Keep the acknowledgement slip so you can check status through official channels."], checklist: ["Identify the exact field or update you need", "Check the current official UIDAI instructions", "Carry original supporting documents when required", "Never share your OTP; retain the official acknowledgement"], serviceSlug: "aadhaar-assistance-jamshedpur", seoTitle: "Aadhaar Update Help in Jamshedpur: Centre or Online?", officialLinks: [{ label: "UIDAI – updating data on Aadhaar", href: "https://uidai.gov.in/en/updating-data-on-aadhaar" }, { label: "UIDAI enrolment & update charges (PDF)", href: "https://uidai.gov.in/images/Aadhaar_Enrolment__and__Update__-__English.pdf" }] },
  { slug: "jharkhand-income-caste-residence-certificates", title: "Jharkhand income, caste and residence certificate: documents to prepare", excerpt: "A locally useful preparation guide for common Jharkhand certificate applications and follow-up.", image: "/images/blog/certificate.png", category: "Jharkhand certificates", paragraphs: ["Certificate requirements depend on the certificate type, applicant circumstances and current Jharkhand portal instructions. Before starting, identify the exact certificate and check the current checklist published by the responsible department. Common application processes may request identity, address, family or income information, but do not rely on an old checklist as a guarantee.", "Bring the source documents requested by the official form and review spelling, addresses and supporting details carefully. NISE COMPORT can assist with portal navigation and submission steps in Jamshedpur. The issuing authority verifies evidence, decides eligibility and controls processing time."], checklist: ["Confirm the certificate type and applicant category", "Use the current official Jharkhand checklist", "Ensure names and addresses are consistent across proofs", "Save the application reference for status checks"], serviceSlug: "jharkhand-certificates-jamshedpur", seoTitle: "Jharkhand Income, Caste & Residence Certificate Docs", officialLinks: [{ label: "JharSewa (Jharkhand e-District)", href: "https://jharsewa.jharkhand.gov.in/" }] },
  { slug: "voter-registration-correction-jharkhand", title: "Voter registration and correction in Jharkhand: a review checklist", excerpt: "Review the key details before an electoral-roll application or correction is submitted.", image: "/images/blog/voter.png", category: "Voter services", paragraphs: ["Electoral services include different request types, such as new registration, correction or address changes. Select the right request using the current Election Commission instructions. Incorrectly choosing a form can slow down the process.", "Check the applicant’s age, address and supporting documents against the official requirements. The election authority conducts verification and maintains the electoral roll; NISE COMPORT can help with online form navigation and the acknowledgement. Review the completed details yourself before submission."], checklist: ["Choose the correct registration or correction request", "Check eligibility and address proof requirements", "Review all entries before submission", "Keep the reference number for official follow-up"], serviceSlug: "voter-id-services-jamshedpur", seoTitle: "Voter Registration & Correction in Jharkhand", officialLinks: [{ label: "Voters’ Service Portal (ECI)", href: "https://voters.eci.gov.in/" }] },
  { slug: "bike-insurance-renewal-jamshedpur", title: "Renewing two-wheeler insurance in Jamshedpur: what to compare", excerpt: "Check coverage, exclusions and policy dates before choosing a motor-insurance renewal.", image: "/images/blog/insurance.png", category: "Insurance", paragraphs: ["Before renewing a two-wheeler policy, check the registration details, current policy end date, claims history and the coverage you need. Compare the insurer’s premium, exclusions, add-ons and claim process; the lowest quote may not provide the same cover as another option.", "NISE COMPORT can help with an enquiry and application steps where provider services are available. The insurer sets eligibility, premium, policy terms and claim decisions. Read the policy wording and retain the payment receipt and issued document."], checklist: ["Keep registration and existing policy details ready", "Compare coverage, exclusions and add-ons", "Verify the final premium directly with the insurer", "Save the issued policy and payment receipt"], serviceSlug: "bike-insurance-jamshedpur", seoTitle: "Two-Wheeler Insurance Renewal in Jamshedpur" },
  { slug: "passport-driving-licence-application-help", title: "Passport and driving licence applications: prepare before you book", excerpt: "A simple way to organise identity proofs, application details and official appointments.", image: "/images/blog/passport.png", category: "Application help", paragraphs: ["Passport and driving-licence requests follow separate official processes. Requirements can vary by application type, state, age and the issuing authority’s current rules. Read the official checklist before paying fees or scheduling an appointment.", "Make sure your name, address and date of birth match your supporting records. NISE COMPORT can assist with online form entry and appointment-step guidance, but appointments, tests, verification and issuance are controlled by the relevant authority."], checklist: ["Confirm the application type and current official requirements", "Check all personal details against original records", "Use the official portal for appointment and payment steps", "Keep acknowledgement, appointment and receipt details"], serviceSlug: "passport-driving-licence-help", seoTitle: "Passport & Driving Licence: Prepare Before You Book", officialLinks: [{ label: "Passport Seva", href: "https://www.passportindia.gov.in/" }, { label: "Parivahan Sarathi (licences)", href: "https://sarathi.parivahan.gov.in/" }] },
  { slug: "online-form-filling-students-jharkhand", title: "Student and scholarship forms in Jharkhand: avoid common submission errors", excerpt: "Check eligibility, deadlines and uploads before submitting an admission, exam or scholarship form.", image: "/images/blog/7.png", category: "Education", paragraphs: ["Start with the official notification. Confirm the applicant category, eligibility, deadline and required document formats before entering information. A clear checklist helps students avoid last-minute issues such as mismatched names, expired documents or missing signature files.", "The student or guardian remains responsible for the accuracy of submitted details. NISE COMPORT can help with form navigation and upload preparation in Jamshedpur; the institution or department sets eligibility and makes the final decision."], checklist: ["Read the current official notification and deadline", "Prepare clear scans in the listed file formats", "Check name, school and bank details carefully", "Save the final form and acknowledgement"], serviceSlug: "student-scholarship-forms-jamshedpur", seoTitle: "Student & Scholarship Forms in Jharkhand: Avoid Errors" },
  { slug: "online-printing-upload-pickup-jamshedpur", title: "Online printing in Jamshedpur: upload, select pages and request pickup", excerpt: "How to use the NISE COMPORT print request flow without paying online at submission.", image: "/images/blog/11.png", category: "Printing", paragraphs: ["Upload your PDF or supported document after signing in, check the page count and preview, then enter page ranges such as 1-3, 5. Choose copies, paper and colour settings and request a pickup time or delivery. The request goes to the service desk for review.", "Submitting a print request is not an online checkout. NISE COMPORT confirms availability, delivery charges and the final quote before printing. Do not upload documents you are not authorised to share; account uploads are private and follow the site’s retention policy."], checklist: ["Review the preview and selected page ranges", "Choose colour, copies and pickup or delivery", "Submit the request for a staff-confirmed quote", "Proceed only after you approve the final estimate"], serviceSlug: "printing-scanning-jamshedpur", seoTitle: "Online Printing in Jamshedpur: Upload & Pickup" },
  { slug: "income-certificate-jharkhand-application", title: "Income certificate application in Jharkhand: preparation and follow-up", excerpt: "Organise the information for an income certificate application and understand who makes the decision.", image: "/images/blog/10.png", category: "Jharkhand certificates", paragraphs: ["Income certificate processes use details and evidence specified by the relevant Jharkhand authority. Requirements can change, so confirm the current list before applying. Organise household and income information carefully and ensure supporting records are legible.", "A service centre can assist with form navigation and submission, but it cannot certify eligibility or control approval timelines. Keep the reference number and check status through the official route."], checklist: ["Confirm current department instructions", "Prepare household and income information accurately", "Upload legible proofs in required formats", "Track the application with its acknowledgement"], serviceSlug: "jharkhand-certificates-jamshedpur", seoTitle: "Income Certificate in Jharkhand: Apply & Follow Up", officialLinks: [{ label: "JharSewa (Jharkhand e-District)", href: "https://jharsewa.jharkhand.gov.in/" }] },
  { slug: "life-certificate-jeevan-pramaan-help", title: "Jeevan Pramaan life certificate: plan the submission carefully", excerpt: "What pensioners should check before using the current official digital life-certificate process.", image: "/images/blog/jeevanpraman.png", category: "Pension assistance", serviceSlug: "jeevan-pramaan-life-certificate-jamshedpur", seoTitle: "Jeevan Pramaan Life Certificate: Pensioner Checklist", officialLinks: [{ label: "Jeevan Pramaan (official)", href: "https://jeevanpramaan.gov.in/" }], paragraphs: ["Jeevan Pramaan is a digital life-certificate service for eligible pensioners. Check current official instructions and supported submission methods before visiting. Bring only the information and documents requested by the authorised flow, complete required identity verification yourself and retain the acknowledgement for your pension authority. NISE COMPORT can provide navigation assistance where available; the pension-disbursing authority sets acceptance and processing rules."], checklist: ["Check current official instructions", "Confirm whether an authorised biometric step is required", "Keep the acknowledgement for follow-up"] },
  {
    slug: "aadhaar-mobile-number-update-jamshedpur", title: "Aadhaar mobile number update in Jamshedpur: what to know before you go", seoTitle: "Aadhaar Mobile Number Update in Jamshedpur (2026)",
    excerpt: "Changing the mobile number linked to Aadhaar: which route to use, what to carry, the official charge and how to track the request.",
    image: "/images/blog/aadhaar.png", imageAlt: "Aadhaar mobile number update guidance", category: "Aadhaar guidance", serviceSlug: "aadhaar-assistance-jamshedpur", publishedAt: "2026-09-30", updatedAt: "2026-09-30",
    paragraphs: [
      "Your Aadhaar-linked mobile number receives the OTPs used for bank KYC, DigiLocker, PAN–Aadhaar linking, scholarship portals and many other services. If that number is lost, closed or changed, most online Aadhaar services stop working for you until it is updated.",
      "For years a mobile number change needed a visit to an Aadhaar enrolment or update centre, where your identity is confirmed with biometrics. UIDAI has been adding online options through its new Aadhaar app, so check the official UIDAI website or app first to see whether the online route is available to you. If it isn’t, visit an authorised Aadhaar centre.",
    ],
    sections: [
      { heading: "What to carry to an Aadhaar centre", paragraphs: ["Carry your Aadhaar card or number and the new mobile number (the phone itself is useful in case a confirmation SMS arrives). For a mobile number change alone, a supporting document is usually not needed because your biometrics confirm your identity; for name, date-of-birth or address changes, carry original proofs from UIDAI’s accepted list."] },
      { heading: "Official charge", paragraphs: ["UIDAI sets the charge and it must be shown at the centre and on your acknowledgement slip. At the time of writing, UIDAI’s published list shows ₹75 for a demographic update (such as mobile number) done separately. Check the current list on the official UIDAI page before you pay, and report overcharging to UIDAI."] },
      { heading: "After the update", paragraphs: ["Keep the acknowledgement slip with the Update Request Number (URN). Use it to check the status on UIDAI’s website. Once the update is complete, try an OTP-based service (for example, downloading e-Aadhaar) to confirm the new number works."] },
    ],
    checklist: ["Check UIDAI’s website or app for an online option first", "Carry your Aadhaar and the new mobile number", "Pay only the charge on UIDAI’s official list and take the slip", "Save the URN and check the status online", "Test an OTP service after the update"],
    faqs: [
      { question: "Can NISE COMPORT change my Aadhaar mobile number?", answer: "We guide you to the correct official route and help you prepare. The update itself is done by UIDAI through its authorised centres or its own online services." },
      { question: "Should I share my Aadhaar OTP with anyone?", answer: "No. Enter OTPs yourself only in a process you started on an official UIDAI channel. Staff should never ask for your OTP." },
      { question: "How long does the update take?", answer: "UIDAI processes the request; it often takes a few days but can take longer. Track it with your URN." },
    ],
    officialLinks: [{ label: "UIDAI – updating data on Aadhaar", href: "https://uidai.gov.in/en/updating-data-on-aadhaar" }, { label: "UIDAI enrolment & update charges (PDF)", href: "https://uidai.gov.in/images/Aadhaar_Enrolment__and__Update__-__English.pdf" }],
  },
  {
    slug: "aadhaar-update-status-check-urn", title: "How to check your Aadhaar update status with the URN", seoTitle: "Check Aadhaar Update Status with Your URN",
    excerpt: "Find the Update Request Number on your slip, check the status on UIDAI’s website, and know what to do if the update is rejected.",
    image: "/images/service/aadhaar.png", imageAlt: "Aadhaar update status check", category: "Aadhaar guidance", serviceSlug: "aadhaar-assistance-jamshedpur", publishedAt: "2026-09-30", updatedAt: "2026-09-30",
    paragraphs: [
      "Every Aadhaar update request gets a reference. At an enrolment or update centre you receive an acknowledgement slip with an Update Request Number (URN); online requests show a Service Request Number (SRN) on screen. Keep this number until the update is complete.",
      "To check the status, open UIDAI’s myAadhaar website and choose the option to check enrolment and update status. Enter the URN or SRN and the security code. The page shows whether the request is in progress, completed or rejected.",
    ],
    sections: [
      { heading: "If the update is rejected", paragraphs: ["Read the rejection reason carefully. Common causes are a document that doesn’t support the requested change, a spelling that doesn’t match the proof, or an unclear scan. Correct the cause and submit a fresh request with suitable documents. Some fields, such as date of birth, have limits on how many times they can be changed, so check UIDAI’s rules first."] },
      { heading: "If the update is completed", paragraphs: ["Download the updated e-Aadhaar from UIDAI or order a PVC card. Update the new details wherever your old Aadhaar details are used, for example your bank or scholarship profile."] },
    ],
    checklist: ["Find the URN (centre) or SRN (online) on your acknowledgement", "Check status on UIDAI’s myAadhaar website", "If rejected, read the reason before reapplying", "Download the updated e-Aadhaar once completed"],
    faqs: [
      { question: "I lost the acknowledgement slip. What now?", answer: "Contact UIDAI’s helpline (1947) or the centre that took your request. Without the number, checking status online is harder." },
      { question: "Can you check the status for me?", answer: "You can check it yourself on UIDAI’s website in a minute. If the result is confusing, bring the slip and we will explain the next step." },
    ],
    officialLinks: [{ label: "myAadhaar (UIDAI)", href: "https://myaadhaar.uidai.gov.in/" }, { label: "UIDAI – updating data on Aadhaar", href: "https://uidai.gov.in/en/updating-data-on-aadhaar" }],
  },
  {
    slug: "aadhaar-pvc-card-order-guide", title: "Aadhaar PVC card: how to order the official card and track delivery", seoTitle: "Aadhaar PVC Card: Order the Official Card & Track It",
    excerpt: "The official Aadhaar PVC card is printed and posted by UIDAI. Here’s how ordering works, what it costs and how to avoid unofficial printouts.",
    image: "/images/service/aadhaar.png", imageAlt: "Aadhaar PVC card order guidance", category: "Aadhaar guidance", serviceSlug: "aadhaar-pvc-card-order-help", publishedAt: "2026-09-30", updatedAt: "2026-09-30",
    paragraphs: [
      "The Aadhaar PVC card is a wallet-sized plastic version of your Aadhaar with security features. The official card is ordered from UIDAI, printed by UIDAI and sent by post to the address on your Aadhaar record.",
      "Order it from UIDAI’s myAadhaar website. You enter your Aadhaar number, confirm with an OTP, check the preview, pay the fee shown on the official page and receive a Service Request Number (SRN) for tracking.",
    ],
    sections: [
      { heading: "Check your address first", paragraphs: ["The card is posted to the address on your Aadhaar. If you have moved, update the address first and order the PVC card after the update is complete."] },
      { heading: "Official card vs shop printouts", paragraphs: ["Plastic cards printed from a downloaded e-Aadhaar at a shop are not the official PVC card. The e-Aadhaar PDF you download from UIDAI is itself valid; you do not need a plastic copy to use Aadhaar."] },
    ],
    checklist: ["Confirm the address on your Aadhaar is current", "Order only on UIDAI’s official website", "Pay the fee shown on the official page", "Save the SRN and track the order and the post"],
    faqs: [
      { question: "My mobile isn’t linked to Aadhaar. Can I still order?", answer: "UIDAI has offered an option to order with a different mobile number, but features change. Check the current myAadhaar page; linking your mobile first is the simplest route." },
      { question: "Can NISE COMPORT print an official PVC card?", answer: "No. Only UIDAI prints the official Aadhaar PVC card. We can help you place the order on UIDAI’s website." },
    ],
    officialLinks: [{ label: "myAadhaar (UIDAI)", href: "https://myaadhaar.uidai.gov.in/" }],
  },
  {
    slug: "caste-certificate-jharkhand-jharsewa", title: "Caste certificate in Jharkhand: preparing a JharSewa application", seoTitle: "Caste Certificate in Jharkhand: JharSewa Checklist",
    excerpt: "Who issues the caste certificate in Jharkhand, what the online application usually asks for, and how to track it on JharSewa.",
    image: "/images/blog/certificate.png", imageAlt: "Jharkhand caste certificate application checklist", category: "Jharkhand certificates", serviceSlug: "jharkhand-certificates-jamshedpur", publishedAt: "2026-09-30", updatedAt: "2026-09-30",
    paragraphs: [
      "In Jharkhand, caste certificates are applied for online through JharSewa, the state’s e-District portal, and are verified and issued by the revenue authorities of your circle (anchal). The certificate is widely used for education, scholarships, jobs and welfare schemes.",
      "Because verification is done locally, the details you give must match your records exactly: the applicant’s name, father’s name, address and the caste as recorded in family documents. Mismatches are the most common reason for delays.",
    ],
    sections: [
      { heading: "What the application commonly asks for", paragraphs: ["The online form usually asks for identity and address details, family information, a self-declaration and supporting records such as a relative’s caste certificate or land-record (khatiyan) details, depending on your case. Always check the current checklist on JharSewa before you start, because requirements can change."] },
      { heading: "After you apply", paragraphs: ["Note the application number. Use it on JharSewa to check the status and to download the certificate when it is approved. If the office asks for more information, respond quickly to avoid the application being closed."] },
    ],
    checklist: ["Check the current checklist on JharSewa", "Make sure names match across all documents", "Keep supporting family or land records ready", "Save the application number and track it on JharSewa"],
    faqs: [
      { question: "How long does a caste certificate take?", answer: "The issuing office controls verification and timelines. Apply well before any admission or scholarship deadline." },
      { question: "Can NISE COMPORT issue the certificate?", answer: "No. We help prepare and submit the online application; the revenue authorities verify and issue it." },
    ],
    officialLinks: [{ label: "JharSewa (Jharkhand e-District)", href: "https://jharsewa.jharkhand.gov.in/" }],
  },
  {
    slug: "residence-certificate-jharkhand-jharsewa", title: "Residence (domicile) certificate in Jharkhand: what to prepare", seoTitle: "Residence Certificate in Jharkhand: What to Prepare",
    excerpt: "Preparing a Jharkhand residence certificate application on JharSewa: common details, supporting records and follow-up.",
    image: "/images/service/4.png", imageAlt: "Jharkhand residence certificate preparation", category: "Jharkhand certificates", serviceSlug: "jharkhand-certificates-jamshedpur", publishedAt: "2026-09-30", updatedAt: "2026-09-30",
    paragraphs: [
      "A residence (sometimes called local or domicile) certificate is often needed for state admissions, scholarships and recruitment in Jharkhand. Applications are made online on JharSewa and verified by the local revenue office.",
      "Eligibility rules for residence certificates are set by the state government and have changed over time, so read the current instructions on JharSewa before applying rather than relying on an older checklist.",
    ],
    sections: [
      { heading: "Prepare these details", paragraphs: ["Keep the applicant’s identity details, current address, family details and any supporting residence records the portal asks for, such as land-record details or other proof of long-term residence. Make sure spellings match across documents."] },
    ],
    checklist: ["Read the current eligibility note on JharSewa", "Keep identity, address and family details ready", "Gather the supporting residence records the portal lists", "Track the application number until the certificate is issued"],
    faqs: [{ question: "Is a residence certificate the same as a caste certificate?", answer: "No. They are separate certificates with different purposes and evidence. Apply for each one you need." }],
    officialLinks: [{ label: "JharSewa (Jharkhand e-District)", href: "https://jharsewa.jharkhand.gov.in/" }],
  },
  {
    slug: "birth-certificate-registration-correction-jharkhand", title: "Birth certificate in Jharkhand: registration, late registration and corrections", seoTitle: "Birth Certificate in Jharkhand: Register or Correct",
    excerpt: "How birth registration works, why registering within 21 days is easiest, and how to approach delayed registration or corrections.",
    image: "/images/blog/10.png", imageAlt: "Birth certificate registration guidance", category: "Certificates", serviceSlug: "birth-death-certificate-help-jamshedpur", publishedAt: "2026-09-30", updatedAt: "2026-09-30",
    paragraphs: [
      "Births and deaths must be registered with the local registrar under the Registration of Births and Deaths Act. Hospitals often start the registration for births that happen there; for home births, the family (the informant) reports the event to the registrar.",
      "Registration within 21 days of the event is the simplest route. Later registrations are still possible, but they usually need extra documents, a late fee or an order from the prescribed authority, depending on how long the delay is.",
    ],
    sections: [
      { heading: "Corrections", paragraphs: ["If a name or other detail on the certificate is wrong, the registrar can correct it on the basis of suitable evidence, such as hospital records or school documents. Carry the existing certificate and the proof of the correct detail."] },
      { heading: "Adding the child’s name later", paragraphs: ["If the child’s name was not given at registration, it can usually be added later within the time allowed by the rules. Ask the registrar’s office about the current process."] },
    ],
    checklist: ["Register within 21 days whenever possible", "Keep the hospital discharge slip or other proof of birth", "For corrections, bring the certificate and the correct proof", "Save the acknowledgement for follow-up with the registrar"],
    faqs: [{ question: "Who issues the birth certificate?", answer: "The registrar of births and deaths for the area where the birth took place. We help families prepare the application." }],
    officialLinks: [{ label: "Civil Registration System (Office of the Registrar General)", href: "https://crsorgi.gov.in/" }],
  },
  {
    slug: "e-kalyan-scholarship-jharkhand-checklist", title: "e-Kalyan scholarship in Jharkhand: document and deadline checklist", seoTitle: "e-Kalyan Scholarship Jharkhand: Document Checklist",
    excerpt: "A practical checklist for students applying for Jharkhand’s e-Kalyan scholarships: certificates, bank details and common mistakes.",
    image: "/images/blog/7.png", imageAlt: "e-Kalyan scholarship checklist for Jharkhand students", category: "Education", serviceSlug: "student-scholarship-forms-jamshedpur", publishedAt: "2026-09-30", updatedAt: "2026-09-30",
    paragraphs: [
      "e-Kalyan is the Jharkhand government’s online portal for pre-matric and post-matric scholarships for eligible students from Scheduled Tribe, Scheduled Caste, Backward Class and minority communities. Eligibility, amounts and deadlines are announced by the department each year.",
      "Most rejections come from avoidable problems: expired or mismatched certificates, a bank account that is not Aadhaar-seeded for direct benefit transfer, or a missed institute verification step. Prepare these before the window opens.",
    ],
    sections: [
      { heading: "Documents students are commonly asked for", paragraphs: ["Caste certificate, income certificate and residence certificate issued in Jharkhand; Aadhaar; a bank account in the student’s name that can receive DBT payments; the previous year’s marksheet; admission and fee receipts; and a recent photograph. Check the current year’s notice for the exact list."] },
      { heading: "After you submit", paragraphs: ["Print or save the submitted form. Your institution must verify the application on the portal, so tell your college once you have applied and follow the status on e-Kalyan."] },
    ],
    checklist: ["Read this year’s notice for eligibility and deadlines", "Renew caste, income and residence certificates in time", "Make sure the bank account can receive DBT", "Ask your institution to verify the application"],
    faqs: [{ question: "Can NISE COMPORT tell me if I’m eligible?", answer: "The department sets eligibility. We can help you read the notice and fill the form carefully, but the final decision is the department’s." }],
    officialLinks: [{ label: "e-Kalyan Jharkhand (official)", href: "https://ekalyan.cgg.gov.in/" }],
  },
  {
    slug: "learner-driving-licence-jharkhand-sarathi", title: "Learner’s driving licence in Jharkhand: steps on Parivahan Sarathi", seoTitle: "Learner’s Driving Licence in Jharkhand: Steps",
    excerpt: "How to apply for a learner’s licence on Parivahan Sarathi, prepare for the test, and move on to a permanent driving licence.",
    image: "/images/service/passport.png", imageAlt: "Learner driving licence application guidance", category: "Application help", serviceSlug: "passport-driving-licence-help", publishedAt: "2026-09-30", updatedAt: "2026-09-30",
    paragraphs: [
      "Driving licence applications in Jharkhand are made online on the national Parivahan Sarathi portal. You start with a learner’s licence (LL), which lets you practise under the conditions in the rules, and later apply for a permanent driving licence (DL).",
      "On Sarathi you select Jharkhand, fill the application, upload documents, pay the fee online and either take the learner’s test online where the portal offers it or book a slot at your District Transport Office.",
    ],
    sections: [
      { heading: "Before the learner’s test", paragraphs: ["The test covers traffic signs, road rules and safe driving. Sarathi provides practice material. Keep your application number and receipts together."] },
      { heading: "Moving to a permanent licence", paragraphs: ["A permanent driving licence can generally be applied for after holding the learner’s licence for 30 days and before it expires. Book the driving test on Sarathi and bring a suitable vehicle, as required by the transport office."] },
    ],
    checklist: ["Apply on the official Sarathi portal and select Jharkhand", "Keep age and address proofs ready", "Save the application number and payment receipt", "Book the DL test after 30 days, before the LL expires"],
    faqs: [{ question: "Can NISE COMPORT arrange my licence?", answer: "No. The transport authority tests applicants and issues licences. We help with the online form, uploads and appointment booking." }],
    officialLinks: [{ label: "Parivahan Sarathi (official)", href: "https://sarathi.parivahan.gov.in/" }],
  },
  {
    slug: "e-epic-voter-id-download", title: "Digital voter ID (e-EPIC): how to download it", seoTitle: "Download Your Digital Voter ID (e-EPIC)",
    excerpt: "What e-EPIC is, who can download it from the Voters’ Service Portal, and what to do if your mobile number isn’t linked.",
    image: "/images/blog/voter.png", imageAlt: "Digital voter ID e-EPIC download guidance", category: "Voter services", serviceSlug: "voter-id-services-jamshedpur", publishedAt: "2026-09-30", updatedAt: "2026-09-30",
    paragraphs: [
      "e-EPIC is a digital, downloadable version of the Electors Photo Identity Card (voter ID). It is issued by the Election Commission of India through the Voters’ Service Portal and its app.",
      "To download it you sign in on the portal, enter your EPIC number or form reference number and confirm with an OTP sent to the mobile number linked to your voter record. If your mobile number isn’t linked, the portal may ask you to complete verification or update your details first.",
    ],
    sections: [{ heading: "If your details are wrong", paragraphs: ["Download the e-EPIC only after your details are correct. Use the correction form on the Voters’ Service Portal to fix mistakes, then download the e-EPIC once the correction is approved."] }],
    checklist: ["Keep your EPIC number or form reference number ready", "Use the mobile number linked to your voter record", "Correct mistakes before downloading", "Download only from the official portal or app"],
    faqs: [{ question: "Is e-EPIC valid as identity proof?", answer: "It is an official digital version of your voter ID. Individual offices decide which documents they accept, so carry what they ask for." }],
    officialLinks: [{ label: "Voters’ Service Portal (ECI)", href: "https://voters.eci.gov.in/" }],
  },
  {
    slug: "aeps-cash-withdrawal-safety-tips", title: "AEPS cash withdrawal: safety checks before you place your finger", seoTitle: "AEPS Cash Withdrawal: Safety Checks",
    excerpt: "Aadhaar-enabled banking is convenient. These checks help you confirm the amount, keep your biometrics safe and report problems fast.",
    image: "/images/service/1.png", imageAlt: "AEPS banking safety checklist", category: "Banking", serviceSlug: "banking-aeps-money-transfer", publishedAt: "2026-09-30", updatedAt: "2026-09-30",
    paragraphs: [
      "The Aadhaar Enabled Payment System (AEPS) lets you withdraw cash or check your balance at a banking correspondent point using your Aadhaar number and fingerprint. It is useful when a bank branch or ATM is far away, but it needs care.",
      "Before authenticating, say the exact amount you want, watch it being entered, and check the bank name on screen. After the transaction, take the printed or SMS receipt and count your cash before leaving the counter.",
    ],
    sections: [
      { heading: "Protect your biometrics", paragraphs: ["UIDAI lets you lock your Aadhaar biometrics through its official website or app and unlock them only when needed. Many people keep them locked and unlock them just before an AEPS transaction."] },
      { heading: "If something looks wrong", paragraphs: ["If money is debited but not paid, or you see a transaction you didn’t make, contact your bank immediately with the receipt or SMS. For fraud, you can also call the national cybercrime helpline 1930 or report it at cybercrime.gov.in."] },
    ],
    checklist: ["Say the amount and watch it being entered", "Check the bank name and amount on screen", "Take the receipt and count the cash at the counter", "Never share OTPs, PINs or card details", "Consider locking your Aadhaar biometrics when not in use"],
    faqs: [{ question: "Do I need my phone for AEPS?", answer: "Not always, but keep the phone registered with your bank handy so you receive the transaction SMS." }],
    officialLinks: [{ label: "National Cyber Crime Reporting Portal", href: "https://cybercrime.gov.in/" }],
  },
  {
    slug: "land-mutation-jharkhand-jharbhoomi-guide", title: "Land mutation (dakhil-kharij) in Jharkhand: online application checklist", seoTitle: "Land Mutation in Jharkhand: Online Checklist",
    excerpt: "After buying or inheriting land, mutation updates the government record. What to prepare and how to follow up on Jharbhoomi.",
    image: "/images/service/5.png", imageAlt: "Jharkhand land mutation checklist", category: "Land records", serviceSlug: "land-mutation-jharbhoomi-help", publishedAt: "2026-09-30", updatedAt: "2026-09-30",
    paragraphs: [
      "Mutation, also called dakhil-kharij, updates the land revenue record to show the new owner after a sale, gift, inheritance or partition. In Jharkhand, applications can be made online through the Jharbhoomi portal and are verified by the circle office.",
      "A registered deed alone does not update the revenue record. Without mutation, paying land rent, getting certain certificates or selling the land later can become difficult.",
    ],
    sections: [{ heading: "Prepare these before applying", paragraphs: ["The registered deed or other transfer document, plot details (mouza, khata and plot number), identity proof of the applicant and any previous rent receipt. For inheritance, keep documents showing the legal heirs as required by the office."] }],
    checklist: ["Keep the registered deed and plot details ready", "Apply online on Jharbhoomi and note the case number", "Respond to any notice from the circle office", "Check the updated record once mutation is approved"],
    faqs: [{ question: "Is mutation the same as registration?", answer: "No. Registration records the transfer deed; mutation updates the land revenue record. Both are usually needed." }],
    officialLinks: [{ label: "Jharbhoomi – Jharkhand land records", href: "https://jharbhoomi.jharkhand.gov.in/" }],
  },
];

export function articleDates(article: Article) {
  return { publishedAt: article.publishedAt ?? GUIDE_DEFAULT_DATES.publishedAt, updatedAt: article.updatedAt ?? article.publishedAt ?? GUIDE_DEFAULT_DATES.updatedAt };
}

export function findArticle(slug: string) { return articles.find((article) => article.slug === slug); }
export function articlesForService(serviceSlug: string) { return articles.filter((article) => article.serviceSlug === serviceSlug); }

// Public artwork and service explainers from the original NISE COMPORT media library.
export const galleryItems = [
  { title: "Digital citizen services", image: "/images/service/1.png", alt: "NISE COMPORT citizen service information artwork", category: "Services" },
  { title: "PAN application support", image: "/images/service/pan.png", alt: "PAN application assistance service artwork", category: "Government services" },
  { title: "Aadhaar guidance", image: "/images/service/aadhaar.png", alt: "Aadhaar service guidance artwork", category: "Government services" },
  { title: "Insurance enquiry", image: "/images/service/two-wheeler.png", alt: "Two wheeler insurance enquiry artwork", category: "Insurance" },
  { title: "Passport application help", image: "/images/service/passport.png", alt: "Passport application help service artwork", category: "Citizen services" },
  { title: "Online form assistance", image: "/images/service/5.png", alt: "Online application form support artwork", category: "Digital help" },
  { title: "Certificate checklist", image: "/images/service/4.png", alt: "Certificate document support artwork", category: "Jharkhand services" },
  { title: "Print and scan services", image: "/images/service/media.png", alt: "Printing and document services artwork", category: "Print & scan" },
  { title: "Community updates", image: "/images/slider/slide1.png", alt: "NISE COMPORT community service centre artwork", category: "Community" },
];
export const socialPosts = [
  { platform: "WhatsApp", title: "Need help with an online form?", text: "Bring the official form link and your supporting documents to our Kharangajhar desk. Message us first to check what to prepare.", image: "/images/offer/post/1.png", href: "https://wa.me/919771219893" },
  { platform: "Instagram", title: "Local help, with a clear next step", text: "PAN, certificates, insurance enquiries, printing and everyday digital services in Jamshedpur.", image: "/images/offer/post/2.png", href: "https://www.instagram.com/" },
  { platform: "YouTube", title: "Understand your service request", text: "We’re preparing short explainers for documents, applications and digital service requests. Check back for new videos.", image: "/images/offer/post/3.png", href: "https://www.youtube.com/" },
];
export const teamMembers = [
  { name: "Sanjay Kumar", role: "Head of Firm", image: "/images/team/1.png" },
  { name: "Chandrakala Devi", role: "Head of Finance", image: "/images/team/2.png" },
  { name: "Sanjana Shree", role: "Service team", image: "/images/team/10.png" },
  { name: "Gourav", role: "Service team", image: "/images/team/4.png" },
  { name: "Mitunjay", role: "Service team", image: "/images/team/7.png" },
  { name: "Jyoti Verma", role: "Service team", image: "/images/team/8.png" },
  { name: "Amarjeet Kumar", role: "Business partner", image: "/images/team/9.png" },
];
export const offerInfo = {
  title: "Current offers & customer vouchers",
  description: "NISE COMPORT shares limited offers and voucher codes here when they are available. Ask the team to confirm the eligible service, validity and conditions before you start.",
  note: "No discount is active by default. Customer coupons are checked against the live voucher list when you enter a code in a supported request flow. An offer does not reduce government, insurer or other third-party charges unless the offer terms explicitly say so.",
};
