export type ServiceEditorial = {
  image: string;
  imageAlt: string;
  audience: string;
  beforeYouStart: string[];
  faqs: { question: string; answer: string }[];
  officialLinks?: { label: string; href: string }[];
};

/** Page-specific guidance to make each service route useful before a customer enquires. */
export const serviceEditorial: Record<string, ServiceEditorial> = {
  "pan-card": {
    image: "/images/service/pan.png", imageAlt: "PAN application assistance information artwork",
    audience: "People applying for a PAN for the first time, or checking an eligible correction or reprint route.",
    beforeYouStart: ["Decide whether you need a new PAN, correction, reprint or help checking an existing application.", "Keep your name and date-of-birth details consistent with the proof you plan to use.", "Bring the current provider checklist; the accepted documents depend on the application route."],
    faqs: [
      { question: "Can I apply for a new PAN and a correction on the same page?", answer: "The correct route depends on whether a PAN has already been allotted. Tell us which situation applies; the authorised PAN provider's current instructions determine the application type." },
      { question: "Will you guarantee that my PAN is issued?", answer: "No. NISE COMPORT can help prepare and submit an eligible application. The authorised provider and tax authority control verification, processing and issuance." },
    ],
  },
  "aadhaar": {
    image: "/images/service/aadhaar.png", imageAlt: "Aadhaar service guidance artwork",
    audience: "Residents who need help understanding the correct official Aadhaar update route or preparing for an authorised appointment.",
    beforeYouStart: ["Identify exactly which detail you need to update.", "Check whether that change is available online or needs an authorised Aadhaar centre.", "Carry only the proof listed for that update; never share an OTP or biometric credential with anyone."],
    faqs: [
      { question: "Can every Aadhaar change be completed at NISE COMPORT?", answer: "No. Some updates require an authorised Aadhaar centre or official UIDAI process. We can help identify the route, but only the authorised service can make the record change." },
      { question: "Should I give my Aadhaar OTP to staff?", answer: "No. Keep your OTP private and enter it yourself only in the official flow you initiated." },
    ],
  },
  "income-caste-residence-certificate": {
    image: "/images/blog/certificate.png", imageAlt: "Jharkhand certificate application preparation artwork",
    audience: "Applicants preparing an income, caste, residence or EWS certificate request through the applicable Jharkhand process.",
    beforeYouStart: ["Confirm the exact certificate and applicant category.", "Use the current checklist from the responsible Jharkhand department; evidence varies by certificate and applicant.", "Check that names, address and family details match the supporting records."],
    faqs: [
      { question: "Are income, caste, residence and EWS certificates the same application?", answer: "No. They have different eligibility rules and supporting evidence. Select the exact certificate first and follow the current checklist for that application." },
      { question: "How long does a certificate take?", answer: "The responsible authority controls verification and processing time. NISE COMPORT cannot promise an approval date." },
    ],
  },
  "voter-id": {
    image: "/images/blog/voter.png", imageAlt: "Voter ID and electoral service guidance artwork",
    audience: "Eligible residents who need help understanding voter registration, a correction, or an electoral-roll address request.",
    beforeYouStart: ["Identify whether this is a new registration, correction, address change or another electoral request.", "Check the Election Commission's current form and evidence requirements.", "Review every detail yourself before submission and keep the acknowledgement."],
    faqs: [
      { question: "Does NISE COMPORT issue a Voter ID card?", answer: "No. We can help with form navigation and application preparation. The Election Commission verifies the request and maintains the electoral roll." },
      { question: "Can I apply for a correction and a new registration together?", answer: "The correct form depends on your current electoral-roll status and the change requested. Check the official election-service guidance before submitting." },
    ],
  },
  "passport-driving-licence": {
    image: "/images/service/passport.png", imageAlt: "Passport and driving licence application assistance artwork",
    audience: "Applicants who want help understanding the online form, preparing information, or navigating an official appointment process.",
    beforeYouStart: ["Decide whether you need a fresh passport or a re-issue, and whether your driving-licence request is a learner, new, renewal or correction service.", "Use the official portal's document guidance for your exact applicant and service type; a generic checklist may not fit your case.", "Keep original documents available for the official appointment. Applicants must attend when the authority requires in-person verification."],
    faqs: [
      { question: "How do I know whether to choose a fresh passport or re-issue?", answer: "Passport Seva separates fresh and re-issue applications. Check the official application guidance against your passport history and the service you need before selecting a category." },
      { question: "Do I need to attend a Passport Seva appointment in person?", answer: "The official process requires applicants to attend the selected Passport Seva Kendra or Post Office Passport Seva Kendra with the appointment details and original documents. Confirm the instructions for your application on Passport Seva." },
      { question: "Which passport documents should I bring?", answer: "The accepted documents vary by applicant, application category and circumstances. Use the official Passport Seva Document Advisor for your case; the short list on this page is only a preparation reminder." },
      { question: "Can NISE COMPORT issue my passport or guarantee an appointment?", answer: "No. We can help with form navigation and preparation. Passport Seva and the relevant authorities control appointments, verification, fees, processing and issuance." },
    ],
    officialLinks: [
      { label: "Passport Seva: Fresh and re-issue application guidance", href: "https://www.passportindia.gov.in/psp/Apply" },
      { label: "Passport Seva: Document guidance", href: "https://www.passportindia.gov.in/psp/ListDocuments" },
      { label: "Passport Seva: Application FAQs", href: "https://www.passportindia.gov.in/psp/FaqApplicationForm" },
    ],
  },
  "aeps-money-transfer": {
    image: "/images/service/1.png", imageAlt: "Local assisted banking and digital service artwork",
    audience: "Customers asking about currently available Business Correspondent, AEPS, cash, account or domestic transfer services.",
    beforeYouStart: ["Call or message first to confirm that the partner service is available.", "Confirm the amount, beneficiary details and any service charge before authorising a transaction.", "Keep your PIN and OTP private; enter confidential details yourself through the authorised partner device."],
    faqs: [
      { question: "Are AEPS or cash services always available?", answer: "Availability depends on the partner network, service hours, account rules and transaction limits. Contact the service desk before travelling for a time-sensitive transaction." },
      { question: "Should I tell staff my banking PIN or OTP?", answer: "No. Never disclose your PIN or OTP. Complete confidential verification yourself in the authorised banking flow." },
    ],
  },
  "bike-insurance": {
    image: "/images/service/two-wheeler.png", imageAlt: "Two-wheeler insurance enquiry artwork",
    audience: "Bike and scooter owners buying a new policy, renewing (even after expiry), switching insurer or making a claim.",
    beforeYouStart: ["Keep your RC and last policy copy handy; the NCB on it lowers your premium.", "Renew before the end date: an expired policy loses cover, may need an inspection and loses NCB after 90 days.", "Check IDV, add-ons and exclusions on the quote; a very low IDV means a smaller payout.", "NISE COMPORT arranges the policy with the insurer. The insurer issues it and settles claims; we help you until the claim is closed."],
    faqs: [
      { question: "Can you guarantee a premium or claim?", answer: "No. The insurer decides eligibility, premium, coverage, exclusions and claim outcomes. We help with the paperwork and follow-up all the way." },
      { question: "What should I compare before renewing?", answer: "Premium, IDV, NCB applied, add-ons (zero depreciation, roadside help), cashless garages nearby and the insurer's claim record." },
      { question: "My bike policy expired. Can I still renew?", answer: "Yes. Don't ride until it's renewed. The insurer may ask for an inspection. Renew within 90 days of expiry to keep your NCB." },
      { question: "Which insurers can you quote?", answer: "We compare from the insurers we're tied up with at the time, which can include public and private general insurers. Ask us for the current list." },
    ],
  },
  "car-insurance": {
    image: "/images/blog/insurance.png", imageAlt: "Motor insurance preparation artwork",
    audience: "Car owners buying a new policy, renewing before or after expiry, switching insurer with their NCB, or making a claim.",
    beforeYouStart: ["Keep your RC and last policy copy ready; your NCB moves with you to any insurer.", "Renew up to 45 days before expiry: no inspection, no gap in cover, NCB kept.", "Decide on add-ons: zero depreciation for cars up to 5 years, engine protect in flood-prone areas, return to invoice for new cars.", "NISE COMPORT arranges the policy with the insurer. The insurer issues it and settles claims; we support you until the claim is closed."],
    faqs: [
      { question: "Does an online quote guarantee the final premium?", answer: "No. The insurer confirms eligibility, vehicle details, coverage and final premium before issuing a policy." },
      { question: "Who decides whether a claim is paid?", answer: "The insurance company that issued your policy applies its terms and decides claims. NISE COMPORT does not underwrite policies or decide claims, and isn't liable for the insurer's decision, but we help you register, document and follow up the claim to the end." },
      { question: "What is a cashless claim?", answer: "At the insurer's network garage, the insurer pays the garage directly. You pay only the deductible, depreciation (unless you have zero dep) and anything not covered." },
      { question: "Can I keep my NCB if I sell the car?", answer: "Yes. Ask for an NCB certificate or retention letter; you can use it on your next car's policy, usually within 3 years." },
    ],
  },
  "health-life-insurance": {
    image: "/images/blog/insurance.png", imageAlt: "Insurance information and enquiry artwork",
    audience: "People looking for information on available health, life or personal-accident insurance application routes.",
    beforeYouStart: ["Decide what type of cover information you need.", "Read the insurer's exclusions, waiting periods, premium terms and policy wording.", "Submit medical, identity or income information only through the insurer's authorised process."],
    faqs: [
      { question: "Can NISE COMPORT recommend a policy or promise returns?", answer: "We can help with an enquiry or application route where available. Product suitability, advice, underwriting, returns and claims are governed by the insurer or authorised provider." },
      { question: "What information might an insurer request?", answer: "The insurer decides what information is needed for the selected product. Provide accurate details directly through its authorised application flow." },
    ],
  },
  "scholarship-forms": {
    image: "/images/blog/7.png", imageAlt: "Student form and scholarship preparation artwork",
    audience: "Students and families preparing an eligible admission, scholarship or education application.",
    beforeYouStart: ["Read the latest institution or scheme notification and note the deadline.", "Check eligibility, file formats and category-specific evidence before visiting.", "Review every entry, bank detail and uploaded document before submission."],
    faqs: [
      { question: "Can NISE COMPORT confirm that a student is eligible?", answer: "No. The scheme or institution sets eligibility and makes the final decision. We can help you understand the published checklist." },
      { question: "What should I bring for an online form?", answer: "Bring the official link or notification and the identity, education, bank or category documents the current instructions request." },
    ],
  },
  "exam-forms": {
    image: "/images/service/5.png", imageAlt: "Online application form assistance artwork",
    audience: "Applicants preparing an examination, recruitment or other online application with a published deadline.",
    beforeYouStart: ["Bring the official notice or application link and verify the last date.", "Prepare clear files in the specified format and size.", "The applicant must check all information and approve the form before it is submitted."],
    faqs: [
      { question: "Will NISE COMPORT choose my answers or certify my details?", answer: "No. You are responsible for the accuracy of your information and must review the completed application before submission." },
      { question: "Can you guarantee the form will be accepted?", answer: "No. The recruiting body, examination authority or institution controls eligibility, acceptance and later stages." },
    ],
  },
  "bill-payment-recharge": {
    image: "/images/service/1.png", imageAlt: "Digital bill and payment assistance artwork",
    audience: "Customers asking about supported education-fee, utility, recharge or other partner payment services.",
    beforeYouStart: ["Bring the latest bill or fee notice and the correct consumer or student reference.", "Confirm the payable amount, convenience fee and payment channel before proceeding.", "Keep the transaction reference and receipt until the biller confirms settlement."],
    faqs: [
      { question: "What if a payment is pending or the receipt has not arrived?", answer: "Keep the transaction reference. Settlement, reversal and receipts are controlled by the biller or payment provider; our team can help you check the available status." },
      { question: "Can I pay every bill at the service desk?", answer: "Only currently supported billers and partner channels are available. Contact us with the bill type before travelling." },
    ],
  },
  "itr-gst": {
    image: "/images/service/4.png", imageAlt: "Business and tax form preparation artwork",
    audience: "Individuals and small businesses who need help organising documents or navigating an available online form process.",
    beforeYouStart: ["Identify the form, filing period and relevant business or individual category.", "Gather source records and prior registration or filing references.", "Ask whether your situation needs review by a qualified tax professional; form assistance is not tax or legal advice."],
    faqs: [
      { question: "Does form-filling assistance count as tax advice?", answer: "No. Portal navigation and document preparation do not replace advice from a qualified tax professional. Complex tax positions should be reviewed by one." },
      { question: "Who is responsible for the submitted information?", answer: "The applicant or business owner is responsible for accurate source details and should review the final form before it is submitted." },
    ],
  },
  "printing-scanning": {
    image: "/images/service/media.png", imageAlt: "Document printing and scanning service artwork",
    audience: "Residents, students and businesses who need document printing, scanning or photocopy assistance.",
    beforeYouStart: ["Check that the uploaded file is the final version and that you have permission to share it.", "Select the page numbers carefully and preview the document before requesting a print.", "Choose pickup or delivery; delivery availability and charge are confirmed by the team."],
    faqs: [
      { question: "Do I pay online when I send a print request?", answer: "No. Sending the request is not checkout. Staff review the job and confirm the final quote and any delivery charge before printing." },
      { question: "Can I choose only some pages or make selected pages colour?", answer: "Yes. The print request form accepts page ranges, copies and print options. Check the estimate and preview before submitting." },
      { question: "How long are uploaded files kept?", answer: "Files are stored privately and removed according to the configured retention policy. Do not upload documents you are not authorised to share." },
    ],
  },
  "computer-repair": {
    image: "/images/service/4.png", imageAlt: "Computer and printer service enquiry artwork",
    audience: "Households and small businesses asking about computer, printer, peripheral or CCTV product and service availability.",
    beforeYouStart: ["Share the device type, model and a short description of the problem or requirement.", "Keep warranty or purchase details available for repair enquiries.", "Ask the team to confirm stock, service availability and an estimate before approving work."],
    faqs: [
      { question: "Do you have every product or part in stock?", answer: "Availability changes. Contact the team with the model and requirement for a current answer." },
      { question: "Will repair work start before I approve the estimate?", answer: "The team should confirm the scope and estimate with you before proceeding." },
    ],
  },
  "website-design": {
    image: "/images/service/1.png", imageAlt: "Digital support for local business artwork",
    audience: "Shops and local service providers looking to discuss website or basic digital-presence support.",
    beforeYouStart: ["Write down the business name, services, contact details and the outcome you want.", "Use only photos, logos and text you own or have permission to publish.", "Agree the work scope, access needs and estimate before production starts."],
    faqs: [
      { question: "Can a website project guarantee a Google ranking?", answer: "No. Search visibility depends on useful content, site quality, competition and local business information; no ranking position can be guaranteed." },
      { question: "What should I prepare before asking for a website estimate?", answer: "Prepare your business summary, service list, approved contact details, available brand assets and examples of what you want the site to help customers do." },
    ],
  },
  "ticket-booking": {
    image: "/images/service/1.png", imageAlt: "Travel booking assistance artwork",
    audience: "Travellers who want help comparing supported booking steps for train, flight, bus or hotel requests.",
    beforeYouStart: ["Bring the route, travel dates, passenger count and a reachable contact number.", "Check passenger names against identity records before any booking is confirmed.", "Review fare, baggage, cancellation and refund rules from the provider before payment."],
    faqs: [
      { question: "Can you guarantee a seat or fare?", answer: "No. Availability and fares can change until the booking provider confirms the reservation." },
      { question: "Who handles a cancellation or refund?", answer: "The ticket, hotel or travel provider's terms control cancellations and refunds. Keep the provider reference and receipt for follow-up." },
    ],
  },

  "lic-policy": {
    image: "/images/blog/insurance.png", imageAlt: "Insurance policy document assistance artwork",
    audience: "LIC policyholders who need help locating a current service route or organising policy information for an enquiry.",
    beforeYouStart: ["Bring the policy number or a copy of the policy document if available.", "Decide whether you need a premium receipt, contact update, policy status or another service.", "Use LIC's official process for payments, claims and account authentication; keep OTPs private."],
    faqs: [{ question: "Can NISE COMPORT settle a claim or change LIC records?", answer: "No. LIC controls policy records, servicing, underwriting and claim decisions. We can help identify a route or prepare an enquiry." }, { question: "Should I share a policy login password or OTP?", answer: "No. Enter credentials yourself only on the official LIC service you initiated." }],
  },
  "mutual-fund-sip": {
    image: "/images/service/1.png", imageAlt: "Digital account process assistance artwork",
    audience: "Customers seeking process information or application-navigation help through an appropriately authorised investment provider, where available.",
    beforeYouStart: ["Decide whether you need help with an existing provider account or general process information.", "Review the provider's risks, charges, product documents and cancellation terms.", "Never share OTPs, passwords or account access; investment values can fall as well as rise."],
    faqs: [{ question: "Will this desk choose an SIP or fund for me?", answer: "No. This is administrative process guidance, not financial advice or an investment recommendation." }, { question: "Are SIP returns guaranteed?", answer: "No. Mutual fund investments are subject to market risk and returns are not guaranteed. Read the scheme information and consult an authorised adviser if you need advice." }],
  },
  "rent-agreement": {
    image: "/images/blog/10.png", imageAlt: "Document preparation assistance artwork",
    audience: "Tenants, owners and local organisations who need help preparing information or typing a customer-reviewed document.",
    beforeYouStart: ["Bring the parties' correct names, property address and agreed terms.", "Confirm what the receiving office, society, employer or institution requires.", "Seek a lawyer's review when the document affects legal rights, duties or a dispute."],
    faqs: [{ question: "Does typing a rent agreement make it legally valid?", answer: "Typing alone does not determine validity. Applicable requirements depend on the document and circumstances; get legal advice and confirm stamp or registration steps." }, { question: "Can you decide what terms should be included?", answer: "The parties provide and approve their terms. NISE COMPORT provides document or process assistance, not legal advice." }],
  },
  "fssai-license": {
    image: "/images/service/4.png", imageAlt: "Small business registration preparation artwork",
    audience: "Food businesses that want help preparing information for an eligible FSSAI registration or licence application.",
    beforeYouStart: ["Write down the food activity, premises address and business type.", "Check current official FSSAI eligibility and document requirements for that activity.", "The business owner must review declarations and submit accurate details."],
    faqs: [{ question: "Does every food business use the same FSSAI application?", answer: "No. The appropriate route depends on the current rules and the business activity and scale. Confirm the category through official FSSAI guidance." }, { question: "Can NISE COMPORT guarantee a licence?", answer: "No. The authority reviews the application and makes the decision. We can assist with preparation and portal navigation where available." }],
  },
  "udyam-registration": {
    image: "/images/service/1.png", imageAlt: "Small business digital registration assistance artwork",
    audience: "Owners of eligible small businesses who need help understanding the Udyam portal and preparing registration information.",
    beforeYouStart: ["Confirm whether you need a new registration or a correction to an existing record.", "Review the official Udyam portal's current eligibility and required details.", "Keep authentication private and review all enterprise declarations before submitting."],
    faqs: [{ question: "Is Udyam registration handled by NISE COMPORT?", answer: "No. Registration is through the official government portal. NISE COMPORT can help with process navigation; the portal handles the record." }, { question: "What assistance charge applies?", answer: "We explain any separate assistance fee before you decide. Check the official portal for its current terms and do not confuse an assistance charge with a government fee." }],
  },
};
