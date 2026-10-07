/**
 * Document checklists for the "NISE COMPORT Help" chat. Each guide lists what to bring for a
 * service, with variants (new card, correction, address change…) the customer can tap.
 *
 * Deliberately no outside websites: the answer is always "bring these, we do the rest",
 * with call/WhatsApp buttons. Plain module (no imports).
 */
type Text3 = { en: string; hi: string; bn: string };
export type HelpSection = { heading: string; items: string[]; note?: string };
export type HelpVariant = { id: string; label: Text3; sections: HelpSection[]; /** Our own page for this case (replaces "Start a request"). */ href?: string };
export type HelpGuide = {
  id: string; title: Text3; words: string[]; intro: string;
  variants: HelpVariant[];
  /** Service page for "View details / Start a request". */
  service?: string;
  tip?: string;
};

const ID = ["Aadhaar card", "PAN card", "Voter ID", "Passport", "Driving licence"];
const ADDRESS = ["Aadhaar card", "Electricity, water or gas bill (recent)", "Bank or post office passbook", "Ration card", "Registered rent agreement or sale deed"];
const AGE = ["Birth certificate", "Class 10 or 12 marksheet / certificate", "PAN card", "Passport", "Aadhaar card"];
const INS_NOTE = "NISE COMPORT arranges the policy; the insurance company issues it and decides claims. We support you until the claim is settled.";
const v = (id: string, en: string, hi: string, bn: string, sections: HelpSection[]): HelpVariant => ({ id, label: { en, hi, bn }, sections });

export const HELP_GUIDES: HelpGuide[] = [
  {
    id: "voter", title: { en: "Voter ID (EPIC)", hi: "वोटर आईडी", bn: "ভোটার আইডি" }, service: "voter-id-services-jamshedpur",
    words: ["voter", "voter id", "epic", "election card", "matdata", "वोटर", "मतदाता", "ভোটার"],
    intro: "We fill the voter forms for you. Bring originals; we scan and return them.",
    variants: [
      v("new", "New voter card", "नया वोटर कार्ड", "নতুন ভোটার কার্ড", [
        { heading: "Photo", items: ["1 recent passport-size photo"] },
        { heading: "Identity proof (any one)", items: [...ID.slice(0, 4), "Bank/post office passbook with photo"] },
        { heading: "Address proof (any one)", items: ADDRESS },
        { heading: "Age proof (any one, if you are 18–21)", items: AGE },
      ]),
      v("name", "Correct name", "नाम सुधार", "নাম সংশোধন", [{ heading: "Any one showing the correct name", items: ["Aadhaar card", "PAN card", "Passport", "Marriage certificate (name change after marriage)", "Gazette notification (formal name change)"] }]),
      v("address", "Change address / shifting", "पता बदलना / शिफ्टिंग", "ঠিকানা বদল", [{ heading: "Any one address proof (yours or close family's)", items: ["Aadhaar card", "Electricity, water or gas bill", "Bank or post office passbook", "Passport", "Registered rent/lease deed (tenants) or sale deed (owners)"] }]),
      v("dob", "Correct date of birth", "जन्मतिथि सुधार", "জন্মতারিখ সংশোধন", [{ heading: "Any one", items: ["Birth certificate", "Aadhaar card", "PAN card", "Class 10 or 12 marksheet"] }]),
      v("gender", "Correct gender / replace card", "लिंग सुधार / नया कार्ड", "লিঙ্গ সংশোধন / কার্ড বদল", [{ heading: "Bring", items: ["Your voter ID number", "A document showing the correct gender (Aadhaar or passport)", "For a lost card: just your voter ID number or old card copy"] }]),
    ],
  },
  {
    id: "passport", title: { en: "Passport", hi: "पासपोर्ट", bn: "পাসপোর্ট" }, service: "passport-driving-licence-help",
    words: ["passport", "पासपोर्ट", "পাসপোর্ট"],
    intro: "We fill the form and book the appointment. Carry originals plus one set of self-attested photocopies to the appointment.",
    variants: [v("fresh", "Fresh passport", "नया पासपोर्ट", "নতুন পাসপোর্ট", [
      { heading: "Date of birth proof (any one)", items: ["Birth certificate", "Class 10 marksheet", "School leaving certificate"] },
      { heading: "Identity proof (any one)", items: ["Aadhaar card", "PAN card", "Voter ID", "Driving licence"] },
      { heading: "Address proof (any one)", items: ["Aadhaar card", "Electricity, water or landline bill (last 3 months)", "Running bank passbook with photo"] },
      { heading: "On the day", items: ["Printed appointment letter", "Application receipt (we print both for you)"] },
    ])],
  },
  {
    id: "dl", title: { en: "Driving licence", hi: "ड्राइविंग लाइसेंस", bn: "ড্রাইভিং লাইসেন্স" }, service: "passport-driving-licence-help",
    words: ["driving licence", "driving license", "dl", "learner", "licence", "license", "ड्राइविंग", "लाइसेंस", "লাইসেন্স"],
    intro: "Learner's licence first, then the driving test. We fill the forms and book your slot.",
    variants: [v("new", "Learner / new licence", "लर्नर / नया लाइसेंस", "লার্নার / নতুন লাইসেন্স", [
      { heading: "Age proof (any one)", items: ["Birth certificate", "PAN card", "Class 10 marksheet", "Passport", "School leaving certificate"] },
      { heading: "Address proof (any one)", items: ["Aadhaar card", "Voter ID", "Passport", "Electricity, water or phone bill (last 3 months)", "Bank passbook", "Registered rent agreement"] },
      { heading: "Also", items: ["2 passport-size photos", "Medical certificate (Form 1A) if you are over 40 or for a commercial licence", "Your signature"] },
    ])],
  },
  {
    id: "residence", title: { en: "Residence certificate (Jharkhand)", hi: "आवासीय प्रमाण पत्र", bn: "বাসস্থান সার্টিফিকেট" }, service: "jharkhand-certificates-jamshedpur",
    words: ["residence", "residential", "domicile", "local resident", "niwas", "awasiya", "आवासीय", "निवास", "স্থানীয়", "বাসস্থান"],
    intro: "We apply online for you and give you the acknowledgement to track it.",
    variants: [v("apply", "Apply", "आवेदन", "আবেদন", [
      { heading: "Identity & address (any one)", items: ["Aadhaar card", "Voter ID", "Ration card", "Passport", "Driving licence", "Electricity or phone bill"] },
      { heading: "Local residence proof", items: ["Land record (Khatiyan) or sale deed (Kewala)", "Land rent (lagan) receipt"] },
      { heading: "Also", items: ["Self-declaration form (we prepare it)", "Family tree (Vanshavali), if asked, signed by the Mukhiya/ward member", "1 passport-size photo"] },
    ])],
  },
  {
    id: "caste", title: { en: "Caste certificate (Jharkhand)", hi: "जाति प्रमाण पत्र", bn: "জাতি সার্টিফিকেট" }, service: "jharkhand-certificates-jamshedpur",
    words: ["caste", "jati", "sc", "st", "obc", "bc", "जाति", "জাতি"],
    intro: "Bring these and we file the application for you.",
    variants: [
      v("state", "Caste certificate", "जाति प्रमाण पत्र", "জাতি সার্টিফিকেট", [
        { heading: "Bring", items: ["Identity proof: Aadhaar, Voter ID, PAN or driving licence", "Jharkhand residence certificate", "Land record (Khatiyan) copy", "Family tree (Vanshavali) — needed for SC, ST, BC-I and BC-II", "Self-declaration or affidavit (we prepare it)", "1 passport-size photo", "Verification letter from the Mukhiya, ward member or MLA, if asked"] },
      ]),
      v("obc", "OBC (BC-I / BC-II)", "ओबीसी (BC-I / BC-II)", "ওবিসি (BC-I / BC-II)", [{ heading: "Also bring", items: ["Income certificate", "Land document that mentions the caste"] }]),
      v("central", "Central (SC/ST/OBC)", "केंद्रीय प्रमाण पत्र", "কেন্দ্রীয় সার্টিফিকেট", [{ heading: "Also bring", items: ["Reference number of your state caste certificate"] }]),
    ],
  },
  {
    id: "income", title: { en: "Income certificate", hi: "आय प्रमाण पत्र", bn: "আয় সার্টিফিকেট" }, service: "jharkhand-certificates-jamshedpur",
    words: ["income certificate", "income", "aay", "आय", "আয়"],
    intro: "An income affidavit is compulsory; we help you prepare it.",
    variants: [v("apply", "Apply", "आवेदन", "আবেদন", [
      { heading: "Bring", items: ["Income affidavit (notary) stating total family income", "Identity proof: Aadhaar, Voter ID or PAN", "Address proof: ration card, electricity bill or Voter ID", "Age proof: birth certificate, school leaving certificate or PAN", "1 passport-size photo"] },
      { heading: "If it applies", items: ["Land record (Khatiyan) if you own land", "Salary slips or employer letter if salaried", "Parent's affidavit if the applicant is under 18"] },
    ])],
  },
  {
    id: "insurance", title: { en: "Car & bike insurance", hi: "कार और बाइक बीमा", bn: "গাড়ি ও বাইকের বিমা" }, service: "bike-insurance-jamshedpur",
    words: ["insurance", "bima", "policy", "renew", "renewal", "bike insurance", "car insurance", "two wheeler", "scooter", "claim", "ncb", "no claim", "idv", "zero dep", "third party", "expired", "बीमा", "বিমা"],
    intro: "We compare quotes from several insurers and do the paperwork. The insurer issues the policy and settles claims; we stay with you until it's done.",
    variants: [
      { ...v("new", "New vehicle", "नई गाड़ी", "নতুন গাড়ি", [
        { heading: "Vehicle", items: ["Dealer sale invoice (or RC if already registered)", "Chassis and engine number (on the invoice)", "Model, variant and fuel type"] },
        { heading: "You", items: ["Aadhaar card", "PAN card (for KYC)", "Mobile number for the OTP", "Nominee name for personal accident cover"] },
        { heading: "Good to know", items: ["New car: 1-year own damage + 3-year third party (or bundled)", "New bike: 1-year own damage + 5-year third party (or bundled)", "Ask about zero depreciation and return-to-invoice add-ons"], note: INS_NOTE },
      ]), href: "/insurance?need=new#quote" },
      { ...v("renew", "Renew before expiry", "समाप्ति से पहले रिन्यूअल", "মেয়াদের আগে রিনিউ", [
        { heading: "Bring", items: ["RC (registration certificate)", "Current policy copy (shows your No Claim Bonus)", "Valid PUC certificate", "Aadhaar or PAN for KYC, and your mobile number"] },
        { heading: "Good to know", items: ["Renew up to 45 days before the end date", "No inspection needed and your NCB (20% to 50%) is kept", "You can switch insurer and keep your NCB"], note: INS_NOTE },
      ]), href: "/insurance?need=renew#quote" },
      { ...v("expired", "Policy expired", "पॉलिसी खत्म हो गई", "পলিসির মেয়াদ শেষ", [
        { heading: "Bring", items: ["RC (registration certificate)", "Old policy copy (if you have it)", "Valid PUC certificate", "Aadhaar or PAN for KYC, and your mobile number", "Vehicle available for inspection (photos or visit), if the insurer asks"] },
        { heading: "Good to know", items: ["Don't drive until it's renewed: no cover, and fines apply", "Renew within 90 days of expiry to keep your NCB", "Third-party-only cover may not need an inspection"], note: INS_NOTE },
      ]), href: "/insurance?need=expired#quote" },
      { ...v("claim", "Claim help", "क्लेम सहायता", "ক্লেম সহায়তা", [
        { heading: "Bring", items: ["Policy copy and RC", "Driving licence of the person driving at the time", "Photos of the damage and the spot", "FIR copy for theft, injury or third-party damage", "Workshop estimate and original repair bills", "Signed claim form (we help you fill it) and a cancelled cheque"] },
        { heading: "Steps", items: ["Tell the insurer straight away (we can register it for you)", "Don't repair before the surveyor inspects", "Use a network garage for a cashless claim", "Theft: FIR first, then the insurer; keep both keys"], note: INS_NOTE },
      ]), href: "/insurance?need=claim#quote" },
    ],
  },
  {
    id: "ayushman", title: { en: "Ayushman card (PM-JAY) & ABHA", hi: "आयुष्मान कार्ड और आभा", bn: "আয়ুষ্মান কার্ড ও আভা" }, service: "ayushman-card-abha-jamshedpur",
    words: ["ayushman", "pmjay", "pm jay", "golden card", "abha", "health card", "आयुष्मान", "आभा", "আয়ুষ্মান"],
    intro: "We check eligibility and make the card with your Aadhaar verification.",
    variants: [
      v("ayushman", "Ayushman card", "आयुष्मान कार्ड", "আয়ুষ্মান কার্ড", [
        { heading: "Bring", items: ["Aadhaar card (each family member)", "Mobile linked to Aadhaar for the OTP", "Ration card or the PM/CM letter for the family"] },
        { heading: "If asked", items: ["Income certificate", "Caste certificate (SC/ST)", "Address proof: Voter ID, bill or driving licence"] },
        { heading: "Aged 70 or more?", items: ["Just Aadhaar and the linked mobile — no income limit"] },
      ]),
      v("abha", "ABHA health ID", "आभा हेल्थ आईडी", "আভা হেলথ আইডি", [{ heading: "Bring", items: ["Aadhaar card and the mobile linked to it", "Without Aadhaar: driving licence, PAN, Voter ID or passport"] }]),
    ],
  },
  {
    id: "udyam", title: { en: "Udyam (MSME) registration", hi: "उद्यम (MSME) पंजीकरण", bn: "উদ্যম (MSME) রেজিস্ট্রেশন" }, service: "udyam-msme-registration-help-jamshedpur",
    words: ["udyam", "msme", "udyog", "business registration", "उद्यम", "উদ্যম"],
    intro: "Paperless — no documents to upload, just these details.",
    variants: [v("apply", "Register", "पंजीकरण", "রেজিস্ট্রেশন", [{ heading: "Bring", items: ["Owner's Aadhaar number and the linked mobile (OTP)", "PAN of the business or proprietor", "GSTIN, if you have one", "Bank account number and IFSC", "What the business does (manufacturing, trading or services)", "Investment in machinery and yearly turnover (your own estimate)"] }])],
  },
  {
    id: "bank", title: { en: "Bank account opening", hi: "बैंक खाता खोलना", bn: "ব্যাংক অ্যাকাউন্ট খোলা" }, service: "bank-account-opening-bc-jamshedpur",
    words: ["bank account", "savings account", "open account", "khata", "बैंक खाता", "खाता", "অ্যাকাউন্ট"],
    intro: "Open a savings account at our banking correspondent point.",
    variants: [v("savings", "Savings account", "बचत खाता", "সেভিংস অ্যাকাউন্ট", [
      { heading: "Identity (any one)", items: ID },
      { heading: "Address (any one)", items: ["Aadhaar card", "Passport", "Voter ID", "Utility bill (under 2 months old)", "Registered lease or sale deed"] },
      { heading: "Also", items: ["PAN card (or Form 60 if you don't have PAN)", "2 passport-size photos"] },
    ])],
  },
  {
    id: "abua", title: { en: "Abua Awas Yojana", hi: "अबुआ आवास योजना", bn: "আবুয়া আবাস যোজনা" }, service: "abua-awas-yojana-help-jamshedpur",
    words: ["abua", "awas", "housing", "ghar", "pm awas", "आवास", "अबुआ", "আবাস"],
    intro: "Jharkhand's housing scheme. We help you get the papers ready for the block/panchayat.",
    variants: [v("apply", "Apply", "आवेदन", "আবেদন", [{ heading: "Bring", items: ["Aadhaar card", "Aadhaar-linked bank passbook", "Income certificate", "Jharkhand residence certificate", "Caste certificate (if applicable)", "Ration card / BPL card", "MGNREGA job card (if you have one)", "Land document for the house site (if applicable)", "1 passport-size photo and your mobile number"] }])],
  },
  {
    id: "ration", title: { en: "Ration card", hi: "राशन कार्ड", bn: "রেশন কার্ড" }, service: "ration-card-help-jamshedpur",
    words: ["ration", "rashan", "pds", "food card", "राशन", "রেশন"],
    intro: "New card, adding a member or correction — we prepare the application.",
    variants: [v("new", "New ration card", "नया राशन कार्ड", "নতুন রেশন কার্ড", [
      { heading: "Identity", items: ["Aadhaar card of every family member", "Voter ID", "PAN card of earning members"] },
      { heading: "Address", items: ["Recent electricity, water or gas bill", "Registered rent agreement if you live on rent"] },
      { heading: "Also", items: ["Income certificate", "Photo of the head of the family (usually the eldest woman)", "Her bank passbook", "Surrender/deletion certificate if you had a card elsewhere"] },
    ])],
  },
  {
    id: "aadhaar", title: { en: "Aadhaar card", hi: "आधार कार्ड", bn: "আধার কার্ড" }, service: "aadhaar-assistance-jamshedpur",
    words: ["aadhaar", "aadhar", "adhar", "uid", "आधार", "আধার"],
    intro: "Originals are needed for Aadhaar. Children under 5 need only a birth certificate and a parent's Aadhaar.",
    variants: [
      v("new", "New Aadhaar", "नया आधार", "নতুন আধার", [
        { heading: "Identity (any one)", items: ["Passport", "PAN card", "Voter ID", "Driving licence", "Government photo ID"] },
        { heading: "Address (any one)", items: ["Bank statement/passbook (last 3 months)", "Electricity, water or gas bill (last 3 months)", "Ration card", "Registered rent or sale agreement"] },
        { heading: "Date of birth (any one)", items: ["Birth certificate", "School marksheet", "Passport"] },
      ]),
      v("name", "Name / gender / photo", "नाम / लिंग / फोटो", "নাম / লিঙ্গ / ছবি", [{ heading: "Any one", items: ["Passport", "PAN card", "Voter ID", "Driving licence", "Marriage certificate or divorce decree (name change)"], note: "Photo changes need only your visit for biometrics." }]),
      v("address", "Address update", "पता अपडेट", "ঠিকানা আপডেট", [{ heading: "Any one", items: ["Bank statement or passbook", "Electricity, water or gas bill (last 3 months)", "Ration card", "Registered rent or lease agreement"] }]),
      v("dob", "Date of birth", "जन्मतिथि", "জন্মতারিখ", [{ heading: "Any one", items: ["Birth certificate", "Class 10 certificate", "Passport or PAN with date of birth"] }]),
      v("family", "Head of family", "परिवार के मुखिया", "পরিবারের প্রধান", [{ heading: "Relationship proof", items: ["Ration (PDS) card, CGHS/ESIC card or birth certificate showing the relation", "Aadhaar of the head of family"] }]),
    ],
  },
  {
    id: "pan", title: { en: "PAN card", hi: "पैन कार्ड", bn: "প্যান কার্ড" }, service: "pan-card-jamshedpur",
    words: ["pan", "pan card", "पैन", "প্যান"],
    intro: "New PAN or correction — Aadhaar-based in most cases.",
    variants: [
      v("new", "New PAN", "नया पैन", "নতুন প্যান", [{ heading: "Bring", items: ["Aadhaar card (name and date of birth must be correct)", "Mobile linked to Aadhaar for the OTP", "1 passport-size photo and signature (for the physical form)"] }]),
      v("correction", "Correction", "सुधार", "সংশোধন", [{ heading: "Bring", items: ["Your PAN or PAN card copy", "Proof of the correct detail: Aadhaar, passport, birth certificate or marksheet", "Marriage certificate or gazette for a name change"] }]),
    ],
  },
];

const normal = (text: string) => ` ${text.toLowerCase().normalize("NFC").replace(/[^\p{L}\p{M}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim()} `;

/** The guide a message is asking about, preferring the longest matching word ("bank account" over "bank"). */
export function findGuide(text: string): HelpGuide | null {
  const clean = normal(text);
  let best: HelpGuide | null = null; let score = 0;
  for (const guide of HELP_GUIDES) {
    for (const word of guide.words) {
      const hit = clean.includes(` ${word} `) || (word.length > 4 && clean.includes(word));
      if (hit && word.length > score) { best = guide; score = word.length; }
    }
  }
  return best;
}

/** Variant mentioned in the message (e.g. "voter id address change" → address). */
export function findVariant(guide: HelpGuide, text: string) {
  const clean = normal(text);
  const hints: Record<string, string[]> = {
    name: ["name", "naam", "नाम", "নাম"], address: ["address", "shift", "pata", "पता", "ঠিকানা"], dob: ["birth", "dob", "age", "जन्म", "জন্ম"],
    gender: ["gender", "lost", "replace", "लिंग"], correction: ["correction", "correct", "change", "update", "सुधार", "সংশোধন"],
    claim: ["claim", "accident", "क्लेम"], new: [" new ", "brand new", "nayi", "नई"], expired: ["expired", "expire", "lapsed", "khatam", "समाप्त", "खत्म"], renew: ["renew", "रिन्यू"], abha: ["abha", "आभा"], obc: ["obc", "bc 1", "bc 2", "bc-i"], central: ["central"], family: ["family", "head", "मुखिया"],
  };
  return guide.variants.find((variant) => (hints[variant.id] ?? []).some((word) => clean.includes(word))) ?? guide.variants[0];
}
