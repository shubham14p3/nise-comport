/**
 * Form text in English, Hindi and Bengali (insurance form, request-flow extras, status names).
 *
 * Rule for every form: what is SENT and SAVED is always the English value or a fixed code
 * ("renew", "whatsapp", "Petrol"); only what is SHOWN changes with the language. Messages that
 * come back from the server are shown through these labels, by field, in the chosen language.
 * No imports so it can be unit-tested.
 */
type Locale = "en" | "hi" | "bn";
type T3 = Record<Locale, string>;
const t3 = (en: string, hi: string, bn: string): T3 => ({ en, hi, bn });

export const INSURANCE_TEXT = {
  need: t3("What do you need?", "आपको क्या चाहिए?", "আপনার কী দরকার?"),
  purposes: {
    new: t3("New vehicle / new policy", "नई गाड़ी / नई पॉलिसी", "নতুন গাড়ি / নতুন পলিসি"),
    renew: t3("Renew before expiry", "समाप्ति से पहले रिन्यूअल", "মেয়াদের আগে রিনিউ"),
    expired: t3("Policy already expired", "पॉलिसी खत्म हो चुकी है", "পলিসির মেয়াদ শেষ"),
    claim: t3("Help with a claim", "क्लेम में मदद", "ক্লেমে সাহায্য"),
  },
  bike: t3("Bike / scooter", "बाइक / स्कूटर", "বাইক / স্কুটার"),
  car: t3("Car", "कार", "গাড়ি"),
  expiredWarn: t3(
    "An expired policy gives no cover. Don’t drive until it’s renewed. The insurer may ask for an inspection (photos or a visit); the No Claim Bonus is kept only if you renew within 90 days.",
    "खत्म हुई पॉलिसी में कोई कवर नहीं होता। रिन्यू होने तक गाड़ी न चलाएँ। बीमा कंपनी जाँच (फ़ोटो या विज़िट) माँग सकती है; नो क्लेम बोनस तभी बचेगा जब 90 दिन के भीतर रिन्यू करें।",
    "মেয়াদ শেষ পলিসিতে কোনো কভার নেই। রিনিউ না হওয়া পর্যন্ত গাড়ি চালাবেন না। বিমা কোম্পানি পরিদর্শন (ছবি বা ভিজিট) চাইতে পারে; ৯০ দিনের মধ্যে রিনিউ করলে তবেই নো ক্লেম বোনাস থাকবে।",
  ),
  optional: t3("optional", "वैकल्पिक", "ঐচ্ছিক"),
  vehicleLegend: t3("Vehicle", "गाड़ी", "গাড়ি"),
  regNo: t3("Vehicle number", "गाड़ी नंबर", "গাড়ির নম্বর"),
  regNoNew: t3("Leave empty if not registered yet", "रजिस्ट्रेशन न हुआ हो तो खाली छोड़ें", "রেজিস্ট্রেশন না হলে খালি রাখুন"),
  make: t3("Make", "कंपनी", "কোম্পানি"),
  model: t3("Model / variant", "मॉडल / वेरिएंट", "মডেল / ভেরিয়েন্ট"),
  fuel: t3("Fuel", "ईंधन", "জ্বালানি"),
  choose: t3("Choose", "चुनें", "বাছুন"),
  year: t3("Year of manufacture", "निर्माण वर्ष", "তৈরির বছর"),
  city: t3("City of registration", "रजिस्ट्रेशन का शहर", "রেজিস্ট্রেশনের শহর"),
  fuels: { Petrol: t3("Petrol", "पेट्रोल", "পেট্রোল"), Diesel: t3("Diesel", "डीज़ल", "ডিজেল"), CNG: t3("CNG", "सीएनजी", "সিএনজি"), Electric: t3("Electric", "इलेक्ट्रिक", "ইলেকট্রিক"), Hybrid: t3("Hybrid", "हाइब्रिड", "হাইব্রিড") } as Record<string, T3>,
  policyLegend: t3("Current / last policy", "मौजूदा / पिछली पॉलिसी", "বর্তমান / আগের পলিসি"),
  insurer: t3("Insurer", "बीमा कंपनी", "বিমা কোম্পানি"),
  startTyping: t3("Start typing", "लिखना शुरू करें", "লিখতে শুরু করুন"),
  policyType: t3("Policy type", "पॉलिसी का प्रकार", "পলিসির ধরন"),
  notSure: t3("Not sure", "पता नहीं", "জানি না"),
  prevTypes: { Comprehensive: t3("Comprehensive", "कॉम्प्रिहेंसिव", "কম্প্রিহেনসিভ"), "Third-party only": t3("Third-party only", "केवल थर्ड-पार्टी", "শুধু থার্ড-পার্টি"), "Own damage only": t3("Own damage only", "केवल ओन डैमेज", "শুধু ওন ড্যামেজ") } as Record<string, T3>,
  endsOn: t3("Policy ends on", "पॉलिसी खत्म होने की तारीख", "পলিসি শেষের তারিখ"),
  expiredOn: t3("Expired on", "खत्म हुई तारीख", "মেয়াদ শেষের তারিখ"),
  remind: t3("We remind you before it’s due next year.", "अगले साल समय से पहले हम याद दिलाएँगे।", "পরের বছর সময়ের আগে আমরা মনে করিয়ে দেব।"),
  claimed: t3("Any claim in the last policy year?", "पिछले पॉलिसी साल में कोई क्लेम?", "গত পলিসি বছরে কোনো ক্লেম?"),
  yes: t3("Yes", "हाँ", "হ্যাঁ"), no: t3("No", "नहीं", "না"),
  ncb: t3("Current NCB", "मौजूदा NCB", "বর্তমান NCB"),
  policyNo: t3("Policy number", "पॉलिसी नंबर", "পলিসি নম্বর"),
  happened: t3("What happened", "क्या हुआ", "কী হয়েছে"),
  type: t3("Type", "प्रकार", "ধরন"),
  date: t3("Date", "तारीख", "তারিখ"),
  fir: t3("Police FIR", "पुलिस FIR", "পুলিশ FIR"),
  firOptions: { na: t3("Not needed / not sure", "ज़रूरी नहीं / पता नहीं", "দরকার নেই / জানি না"), yes: t3("Filed", "दर्ज है", "দায়ের করা হয়েছে"), no: t3("Not yet", "अभी नहीं", "এখনও না") } as Record<string, T3>,
  incidents: {
    Accident: t3("Accident", "दुर्घटना", "দুর্ঘটনা"), Theft: t3("Theft", "चोरी", "চুরি"), Fire: t3("Fire", "आग", "আগুন"),
    "Flood / water": t3("Flood / water", "बाढ़ / पानी", "বন্যা / জল"), "Glass / minor damage": t3("Glass / minor damage", "शीशा / छोटा नुकसान", "কাচ / ছোট ক্ষতি"),
    "Third-party injury or damage": t3("Third-party injury or damage", "किसी और को चोट या नुकसान", "অন্যের আঘাত বা ক্ষতি"), Other: t3("Other", "अन्य", "অন্যান্য"),
  } as Record<string, T3>,
  description: t3("Short description", "छोटा विवरण", "সংক্ষিপ্ত বিবরণ"),
  descriptionHint: t3("Where, how, what is damaged. Don’t move a badly damaged vehicle before photos.", "कहाँ, कैसे, क्या टूटा। ज़्यादा टूटी गाड़ी को फ़ोटो से पहले न हटाएँ।", "কোথায়, কীভাবে, কী ক্ষতি। খুব ক্ষতিগ্রস্ত গাড়ি ছবির আগে সরাবেন না।"),
  coverLegend: t3("Cover you want", "आपको कौन-सा कवर चाहिए", "কোন কভার চান"),
  policy: t3("Policy", "पॉलिसी", "পলিসি"),
  covers: { comprehensive: t3("Comprehensive", "कॉम्प्रिहेंसिव", "কম্প্রিহেনসিভ"), tp: t3("Third-party only", "केवल थर्ड-पार्टी", "শুধু থার্ড-পার্টি"), saod: t3("Own damage only", "केवल ओन डैमेज", "শুধু ওন ড্যামেজ"), unsure: t3("Not sure — advise me", "पता नहीं — सलाह दें", "জানি না — পরামর্শ দিন") } as Record<string, T3>,
  term: t3("Term", "अवधि", "মেয়াদ"),
  terms: { "1 year": t3("1 year", "1 साल", "১ বছর"), "Long-term (2–5 years)": t3("Long-term (2–5 years)", "लंबी अवधि (2–5 साल)", "দীর্ঘমেয়াদি (২–৫ বছর)"), "Not sure": t3("Not sure", "पता नहीं", "জানি না") } as Record<string, T3>,
  loan: t3("On loan / hypothecation?", "गाड़ी लोन पर है?", "গাড়ি লোনে আছে?"),
  addOns: t3("Add-ons you’d like quotes for", "किन ऐड-ऑन का कोटेशन चाहिए", "কোন অ্যাড-অনের কোটেশন চান"),
  addOnNames: {
    "zero-dep": t3("Zero depreciation", "ज़ीरो डेप्रिसिएशन", "জিরো ডেপ্রিসিয়েশন"), rsa: t3("Roadside assistance", "रोडसाइड सहायता", "রোডসাইড সহায়তা"),
    engine: t3("Engine protect", "इंजन प्रोटेक्ट", "ইঞ্জিন প্রোটেক্ট"), consumables: t3("Consumables", "कंज़्यूमेबल्स", "কনজিউমেবলস"),
    "ncb-protect": t3("NCB protection", "NCB सुरक्षा", "NCB সুরক্ষা"), rti: t3("Return to invoice", "रिटर्न टू इनवॉइस", "রিটার্ন টু ইনভয়েস"),
    key: t3("Key & lock replacement", "चाबी और लॉक बदलना", "চাবি ও লক বদল"), tyre: t3("Tyre protect", "टायर प्रोटेक्ट", "টায়ার প্রোটেক্ট"),
    passenger: t3("Passenger cover", "सवारी कवर", "যাত্রী কভার"), "pa-owner": t3("Owner-driver PA cover", "मालिक-चालक PA कवर", "মালিক-চালক PA কভার"),
  } as Record<string, T3>,
  addOnTexts: {
    "zero-dep": t3("Full value of replaced parts without depreciation cut. Best for new vehicles (up to 5 years).", "बदले गए पार्ट्स का पूरा पैसा, घिसावट की कटौती के बिना। नई गाड़ियों (5 साल तक) के लिए सबसे अच्छा।", "বদলানো যন্ত্রাংশের পুরো দাম, অবচয় বাদ ছাড়া। নতুন গাড়ির (৫ বছর পর্যন্ত) জন্য সেরা।"),
    rsa: t3("Towing, battery jump-start, flat tyre, fuel delivery, key help, 24×7.", "टोइंग, बैटरी, पंक्चर, ईंधन, चाबी की मदद, 24×7।", "টোয়িং, ব্যাটারি, পাংচার, জ্বালানি, চাবির সাহায্য, ২৪×৭।"),
    engine: t3("Engine and gearbox damage from water entry or oil leakage, which the base policy excludes.", "पानी घुसने या तेल रिसने से इंजन/गियरबॉक्स का नुकसान, जो सामान्य पॉलिसी में नहीं होता।", "জল ঢোকা বা তেল লিকে ইঞ্জিন/গিয়ারবক্সের ক্ষতি, যা সাধারণ পলিসিতে নেই।"),
    consumables: t3("Engine oil, coolant, nuts, bolts, washers and similar items used in repairs.", "मरम्मत में लगने वाला इंजन ऑयल, कूलेंट, नट-बोल्ट आदि।", "মেরামতে লাগা ইঞ্জিন অয়েল, কুল্যান্ট, নাট-বোল্ট ইত্যাদি।"),
    "ncb-protect": t3("Keep your No Claim Bonus even after a claim (usually one claim a year).", "क्लेम के बाद भी नो क्लेम बोनस बना रहे (आमतौर पर साल में एक क्लेम)।", "ক্লেমের পরেও নো ক্লেম বোনাস থাকে (সাধারণত বছরে একটি ক্লেম)।"),
    rti: t3("On theft or total loss, get the invoice value (plus road tax and registration) instead of the IDV.", "चोरी या पूरे नुकसान पर IDV की जगह बिल की कीमत (रोड टैक्स और रजिस्ट्रेशन सहित)।", "চুরি বা সম্পূর্ণ ক্ষতিতে IDV-র বদলে ইনভয়েসের দাম (রোড ট্যাক্স ও রেজিস্ট্রেশন সহ)।"),
    key: t3("New keys and locks if keys are lost, stolen or damaged.", "चाबी खोने, चोरी या टूटने पर नई चाबी और लॉक।", "চাবি হারালে, চুরি বা ভাঙলে নতুন চাবি ও লক।"),
    tyre: t3("Damage to tyres and tubes, normally covered only in an accident.", "टायर-ट्यूब का नुकसान, जो आमतौर पर सिर्फ़ दुर्घटना में कवर होता है।", "টায়ার-টিউবের ক্ষতি, যা সাধারণত শুধু দুর্ঘটনায় কভার হয়।"),
    passenger: t3("Personal accident cover for passengers / pillion rider.", "सवारियों / पीछे बैठने वाले के लिए दुर्घटना कवर।", "যাত্রী / পেছনের আরোহীর দুর্ঘটনা কভার।"),
    "pa-owner": t3("Compulsory ₹15 lakh cover unless you already have one for another vehicle or a separate PA policy.", "₹15 लाख का ज़रूरी कवर, जब तक दूसरी गाड़ी या अलग PA पॉलिसी में न हो।", "₹১৫ লাখের বাধ্যতামূলক কভার, যদি না অন্য গাড়িতে বা আলাদা PA পলিসিতে থাকে।"),
  } as Record<string, T3>,
  detailsLegend: t3("Your details", "आपकी जानकारी", "আপনার তথ্য"),
  name: t3("Owner’s name", "मालिक का नाम", "মালিকের নাম"),
  phone: t3("Mobile number", "मोबाइल नंबर", "মোবাইল নম্বর"),
  whatsapp: t3("WhatsApp number", "व्हाट्सऐप नंबर", "হোয়াটসঅ্যাপ নম্বর"),
  ifDifferent: t3("If different", "अगर अलग हो", "আলাদা হলে"),
  email: t3("Email", "ईमेल", "ইমেল"),
  forPolicy: t3("For the policy copy", "पॉलिसी कॉपी के लिए", "পলিসির কপির জন্য"),
  callTime: t3("Best time to call", "कॉल का सही समय", "কল করার ভালো সময়"),
  callTimePh: t3("e.g. after 6 pm", "जैसे शाम 6 बजे के बाद", "যেমন সন্ধ্যা ৬টার পর"),
  note: t3("Anything else", "और कुछ", "আর কিছু"),
  files: t3("RC, old policy", "RC, पुरानी पॉलिसी", "RC, পুরোনো পলিসি"),
  filesClaim: t3(", photos, FIR", ", फ़ोटो, FIR", ", ছবি, FIR"),
  filesHint: t3("optional · PDF or photo", "वैकल्पिक · PDF या फ़ोटो", "ঐচ্ছিক · PDF বা ছবি"),
  attach: t3("Attach a file", "फ़ाइल जोड़ें", "ফাইল যোগ করুন"),
  attaching: t3("Attaching…", "जोड़ रहे हैं…", "যোগ হচ্ছে…"),
  signIn: t3("Sign in", "साइन इन करें", "সাইন ইন করুন"),
  signInNote: t3("to attach your RC and old policy and track this request. Or just send the form: we’ll call you and collect them on WhatsApp.", "ताकि RC और पुरानी पॉलिसी जोड़ सकें और अनुरोध ट्रैक कर सकें। या सीधे फ़ॉर्म भेजें: हम कॉल करके व्हाट्सऐप पर ले लेंगे।", "যাতে RC ও পুরোনো পলিসি যোগ করে অনুরোধ ট্র্যাক করতে পারেন। বা সরাসরি ফর্ম পাঠান: আমরা কল করে হোয়াটসঅ্যাপে নিয়ে নেব।"),
  facilitator: t3(
    "NISE COMPORT helps you compare, buy, renew and claim. The policy is issued by the insurance company you choose, and claims are decided and paid by that insurer under its policy terms. NISE COMPORT is not the insurer and is not liable for the insurer’s decisions, but we stay with you from quote to claim settlement.",
    "NISE COMPORT तुलना, खरीद, रिन्यूअल और क्लेम में मदद करता है। पॉलिसी आपकी चुनी बीमा कंपनी जारी करती है, और क्लेम का फ़ैसला व भुगतान वही कंपनी अपनी शर्तों पर करती है। NISE COMPORT बीमा कंपनी नहीं है और उसके फ़ैसलों के लिए ज़िम्मेदार नहीं है, लेकिन कोटेशन से क्लेम निपटने तक हम आपके साथ रहते हैं।",
    "NISE COMPORT তুলনা, কেনা, রিনিউ ও ক্লেমে সাহায্য করে। পলিসি দেয় আপনার বাছাই করা বিমা কোম্পানি, আর ক্লেমের সিদ্ধান্ত ও টাকা দেয় সেই কোম্পানি তাদের শর্তে। NISE COMPORT বিমা কোম্পানি নয় এবং তাদের সিদ্ধান্তের জন্য দায়ী নয়, তবে কোটেশন থেকে ক্লেম মেটা পর্যন্ত আমরা পাশে থাকি।",
  ),
  consent: t3(
    "I understand NISE COMPORT arranges the policy and helps with claims; the insurer issues the policy and settles claims. You may call or WhatsApp me about this.",
    "मैं समझता/समझती हूँ कि NISE COMPORT पॉलिसी दिलाने और क्लेम में मदद करता है; पॉलिसी और क्लेम बीमा कंपनी देती है। इस बारे में आप मुझे कॉल या व्हाट्सऐप कर सकते हैं।",
    "আমি বুঝেছি NISE COMPORT পলিসি করিয়ে দেয় ও ক্লেমে সাহায্য করে; পলিসি ও ক্লেম দেয় বিমা কোম্পানি। এ নিয়ে আমাকে কল বা হোয়াটসঅ্যাপ করতে পারেন।",
  ),
  sending: t3("Sending…", "भेज रहे हैं…", "পাঠানো হচ্ছে…"),
  getQuotes: t3("Get my quotes", "कोटेशन पाएँ", "কোটেশন নিন"),
  getClaimHelp: t3("Get claim help", "क्लेम में मदद लें", "ক্লেমে সাহায্য নিন"),
  thanks: t3("Thank you", "धन्यवाद", "ধন্যবাদ"),
  doneRequest: t3("Your request {ref} is with our team. We’ll call or WhatsApp you with quotes from the insurers, usually the same working day.", "आपका अनुरोध {ref} हमारी टीम के पास है। आमतौर पर उसी कार्यदिवस में हम कॉल या व्हाट्सऐप पर कोटेशन भेजेंगे।", "আপনার অনুরোধ {ref} আমাদের টিমের কাছে। সাধারণত একই কাজের দিনে কল বা হোয়াটসঅ্যাপে কোটেশন পাঠাব।"),
  doneLead: t3("Our team will call you on {phone} with quotes, usually the same working day.", "हमारी टीम आमतौर पर उसी कार्यदिवस में {phone} पर कोटेशन के लिए कॉल करेगी।", "আমাদের টিম সাধারণত একই কাজের দিনে {phone} নম্বরে কোটেশনের জন্য কল করবে।"),
  track: t3("Track my request", "मेरा अनुरोध ट्रैक करें", "আমার অনুরোধ ট্র্যাক করুন"),
  waUs: t3("WhatsApp us", "व्हाट्सऐप करें", "হোয়াটসঅ্যাপ করুন"),
  sendFailed: t3("Could not send the form. Please check the fields marked in red.", "फ़ॉर्म नहीं भेजा जा सका। लाल निशान वाले खाने जाँचें।", "ফর্ম পাঠানো গেল না। লাল চিহ্নিত ঘরগুলো দেখুন।"),
  attachFailed: t3("Could not attach the file.", "फ़ाइल नहीं जुड़ी।", "ফাইল যোগ হলো না।"),
  /** Field problems shown in the chosen language (the server's English text is only a fallback). */
  problems: {
    name: t3("Enter your name.", "अपना नाम लिखें।", "আপনার নাম লিখুন।"),
    phone: t3("Enter a 10-digit mobile number.", "10 अंकों का मोबाइल नंबर डालें।", "১০ সংখ্যার মোবাইল নম্বর দিন।"),
    whatsapp: t3("Check the WhatsApp number.", "व्हाट्सऐप नंबर जाँचें।", "হোয়াটসঅ্যাপ নম্বর দেখুন।"),
    email: t3("Check the email.", "ईमेल जाँचें।", "ইমেল দেখুন।"),
    regNo: t3("Use the number plate format, e.g. JH05AB1234.", "नंबर प्लेट जैसा लिखें, जैसे JH05AB1234।", "নম্বর প্লেটের মতো লিখুন, যেমন JH05AB1234।"),
    model: t3("Tell us the vehicle make and model.", "गाड़ी की कंपनी और मॉडल बताएँ।", "গাড়ির কোম্পানি ও মডেল লিখুন।"),
    incident: t3("Choose what happened.", "क्या हुआ, चुनें।", "কী হয়েছে বাছুন।"),
    files: t3("Attach again.", "फिर से जोड़ें।", "আবার যোগ করুন।"),
  } as Record<string, T3>,
};

/** Extra request-flow text (agreement links, restored draft, WhatsApp copy, page heading). */
export const WIZARD_EXTRA = {
  kicker: t3("4 quick steps · takes about 2 minutes", "4 आसान चरण · लगभग 2 मिनट", "৪টি সহজ ধাপ · প্রায় ২ মিনিট"),
  titleA: t3("Start your request,", "अपना अनुरोध शुरू करें,", "আপনার অনুরোধ শুরু করুন,"),
  titleB: t3("we’ll handle the rest.", "बाकी हम सँभाल लेंगे।", "বাকিটা আমরা সামলাব।"),
  lead: t3("Tell us what you need. We confirm documents, fees and timing before any work begins.", "बताइए क्या चाहिए। काम शुरू होने से पहले हम दस्तावेज़, शुल्क और समय पक्का करते हैं।", "কী দরকার জানান। কাজ শুরুর আগে আমরা কাগজপত্র, খরচ ও সময় নিশ্চিত করি।"),
  terms: t3("Terms", "शर्तें", "শর্তাবলি"),
  privacy: t3("Privacy", "गोपनीयता", "গোপনীয়তা"),
  restored: t3("We kept your unfinished request from last time.", "पिछली बार का अधूरा अनुरोध हमने सँभाल कर रखा है।", "গতবারের অসম্পূর্ণ অনুরোধ আমরা রেখে দিয়েছি।"),
  startFresh: t3("Start fresh", "नए सिरे से शुरू करें", "নতুন করে শুরু করুন"),
  waSent: t3("We’ve also sent a copy to your WhatsApp.", "हमने आपके व्हाट्सऐप पर भी एक कॉपी भेज दी है।", "আপনার হোয়াটসঅ্যাপেও একটি কপি পাঠিয়েছি।"),
  waTap: t3("Tap the WhatsApp button to keep a copy in your chat with us.", "हमारे साथ चैट में कॉपी रखने के लिए व्हाट्सऐप बटन दबाएँ।", "আমাদের সঙ্গে চ্যাটে কপি রাখতে হোয়াটসঅ্যাপ বোতাম চাপুন।"),
};

/** Request status names (the code, e.g. "in_progress", is what's stored). */
export const STATUS_TEXT: Record<string, T3> = {
  submitted: t3("Submitted", "भेजा गया", "পাঠানো হয়েছে"),
  reviewing: t3("Reviewing", "जाँच जारी", "যাচাই চলছে"),
  waiting_for_customer: t3("Waiting for you", "आपका इंतज़ार", "আপনার অপেক্ষা"),
  in_progress: t3("In progress", "काम जारी", "কাজ চলছে"),
  ready_for_pickup: t3("Ready for pickup", "लेने के लिए तैयार", "নেওয়ার জন্য তৈরি"),
  out_for_delivery: t3("Out for delivery", "डिलीवरी पर", "ডেলিভারিতে"),
  completed: t3("Completed", "पूरा हुआ", "সম্পূর্ণ"),
  cancelled: t3("Cancelled", "रद्द", "বাতিল"),
  rejected: t3("Not possible", "संभव नहीं", "সম্ভব নয়"),
  closed: t3("Closed", "बंद", "বন্ধ"),
  printing: t3("Printing", "प्रिंट हो रहा है", "প্রিন্ট হচ্ছে"),
};

export function statusText(status: string, locale: Locale) {
  return STATUS_TEXT[status]?.[locale] ?? status.replace(/_/g, " ").replace(/^./, (letter) => letter.toUpperCase());
}

export function fillText(text: string, values: Record<string, string>) {
  return text.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");
}

/** Service names shown in Hindi / Bengali (the slug is what's saved; English is the default). */
export const SERVICE_NAMES: Record<string, { hi: string; bn: string }> = {
  "pan-card": { hi: "पैन कार्ड आवेदन और सुधार", bn: "প্যান কার্ড আবেদন ও সংশোধন" },
  aadhaar: { hi: "आधार सेवा मार्गदर्शन", bn: "আধার পরিষেবা সহায়তা" },
  "income-caste-residence-certificate": { hi: "आय, जाति, निवास और EWS प्रमाण पत्र", bn: "আয়, জাতি, বাসস্থান ও EWS সার্টিফিকেট" },
  "voter-id": { hi: "वोटर आईडी सेवाएँ", bn: "ভোটার আইডি পরিষেবা" },
  "passport-driving-licence": { hi: "पासपोर्ट और ड्राइविंग लाइसेंस फ़ॉर्म", bn: "পাসপোর্ট ও ড্রাইভিং লাইসেন্স ফর্ম" },
  "aeps-money-transfer": { hi: "AEPS बैंकिंग और मनी ट्रांसफ़र", bn: "AEPS ব্যাংকিং ও টাকা পাঠানো" },
  "bike-insurance": { hi: "बाइक / स्कूटर बीमा", bn: "বাইক / স্কুটার বিমা" },
  "car-insurance": { hi: "कार बीमा और रिन्यूअल", bn: "গাড়ির বিমা ও রিনিউ" },
  "health-life-insurance": { hi: "स्वास्थ्य, जीवन और व्यक्तिगत बीमा", bn: "স্বাস্থ্য, জীবন ও ব্যক্তিগত বিমা" },
  "scholarship-forms": { hi: "छात्र, छात्रवृत्ति और प्रवेश फ़ॉर्म", bn: "ছাত্র, বৃত্তি ও ভর্তির ফর্ম" },
  "exam-forms": { hi: "परीक्षा, भर्ती और ऑनलाइन फ़ॉर्म", bn: "পরীক্ষা, নিয়োগ ও অনলাইন ফর্ম" },
  "bill-payment-recharge": { hi: "फ़ीस, बिल भुगतान और रिचार्ज", bn: "ফি, বিল পেমেন্ট ও রিচার্জ" },
  "itr-gst": { hi: "ITR, GST और व्यवसाय फ़ॉर्म", bn: "ITR, GST ও ব্যবসার ফর্ম" },
  "printing-scanning": { hi: "प्रिंटिंग, स्कैनिंग और फ़ोटोकॉपी", bn: "প্রিন্টিং, স্ক্যানিং ও ফটোকপি" },
  "computer-repair": { hi: "कंप्यूटर, प्रिंटर और CCTV", bn: "কম্পিউটার, প্রিন্টার ও CCTV" },
  "website-design": { hi: "दुकान के लिए वेबसाइट और डिजिटल सहायता", bn: "দোকানের ওয়েবসাইট ও ডিজিটাল সহায়তা" },
  "ticket-booking": { hi: "ट्रेन, फ़्लाइट, बस और होटल बुकिंग", bn: "ট্রেন, ফ্লাইট, বাস ও হোটেল বুকিং" },
  "lic-policy": { hi: "LIC पॉलिसी सेवा", bn: "LIC পলিসি পরিষেবা" },
  "mutual-fund-sip": { hi: "SIP और म्यूचुअल फ़ंड जानकारी", bn: "SIP ও মিউচুয়াল ফান্ড তথ্য" },
  "rent-agreement": { hi: "किरायानामा और NOC फ़ॉर्म", bn: "ভাড়ার চুক্তি ও NOC ফর্ম" },
  "fssai-license": { hi: "FSSAI फ़ूड लाइसेंस", bn: "FSSAI খাদ্য লাইসেন্স" },
  "udyam-registration": { hi: "उद्यम / MSME रजिस्ट्रेशन", bn: "উদ্যম / MSME রেজিস্ট্রেশন" },
  "jeevan-pramaan": { hi: "जीवन प्रमाण (डिजिटल लाइफ़ सर्टिफ़िकेट)", bn: "জীবন প্রমাণ (ডিজিটাল লাইফ সার্টিফিকেট)" },
  "birth-death-certificate": { hi: "जन्म और मृत्यु प्रमाण पत्र", bn: "জন্ম ও মৃত্যু সার্টিফিকেট" },
  "land-mutation": { hi: "दाखिल-खारिज और झारभूमि", bn: "মিউটেশন (দাখিল-খারিজ) ও ঝাড়ভূমি" },
  "aadhaar-pvc-card": { hi: "आधार PVC कार्ड ऑर्डर", bn: "আধার PVC কার্ড অর্ডার" },
  "bank-account-opening": { hi: "बैंक खाता खुलवाना", bn: "ব্যাংক অ্যাকাউন্ট খোলা" },
  "ayushman-card": { hi: "आयुष्मान कार्ड और आभा", bn: "আয়ুষ্মান কার্ড ও আভা" },
  "ration-card": { hi: "राशन कार्ड आवेदन और सुधार", bn: "রেশন কার্ড আবেদন ও সংশোধন" },
  "abua-awas-yojana": { hi: "अबुआ आवास योजना", bn: "আবুয়া আবাস যোজনা" },
};

/** The service name in the chosen language (falls back to the English name). */
export function serviceName(slug: string, english: string, locale: Locale) {
  return locale === "en" ? english : SERVICE_NAMES[slug]?.[locale] ?? english;
}

/** "Do it yourself, or let us do it" box shown with official links. */
export const OFFICIAL_TEXT = {
  boxTitle: t3("Prefer we do it for you?", "क्या हम आपके लिए कर दें?", "আমরা কি আপনার হয়ে করে দেব?"),
  boxText: t3("Leave your name and number. We check your documents, fill the form correctly and keep you updated. Our service charge is told before we start.", "अपना नाम और नंबर छोड़ें। हम दस्तावेज़ जाँचकर सही फ़ॉर्म भरेंगे और आपको अपडेट देंगे। सेवा शुल्क काम शुरू होने से पहले बताया जाएगा।", "নাম ও নম্বর দিন। আমরা কাগজপত্র দেখে সঠিক ফর্ম পূরণ করব এবং আপডেট দেব। পরিষেবা খরচ কাজ শুরুর আগে জানানো হবে।"),
  boxButton: t3("Get it done by us", "हमसे करवाएँ", "আমাদের দিয়ে করান"),
  dialogTitle: t3("Get {service} done by NISE COMPORT", "{service} NISE COMPORT से करवाएँ", "{service} NISE COMPORT দিয়ে করান"),
  leaving: t3("You were opening {site}. You can do it there yourself, or let us handle it.", "आप {site} खोल रहे थे। आप वहाँ खुद कर सकते हैं, या यह काम हमें सौंप सकते हैं।", "আপনি {site} খুলছিলেন। নিজে করতে পারেন, অথবা কাজটা আমাদের দিন।"),
  docs: t3("Documents usually needed", "आमतौर पर ज़रूरी दस्तावेज़", "সাধারণত দরকারি কাগজপত্র"),
  name: t3("Your name", "आपका नाम", "আপনার নাম"),
  phone: t3("Mobile / WhatsApp number", "मोबाइल / व्हाट्सऐप नंबर", "মোবাইল / হোয়াটসঅ্যাপ নম্বর"),
  note: t3("Anything we should know? (optional)", "कुछ और बताना है? (वैकल्पिक)", "আর কিছু জানাতে চান? (ঐচ্ছিক)"),
  send: t3("Call me back", "मुझे कॉल करें", "আমাকে কল করুন"),
  sending: t3("Sending…", "भेज रहे हैं…", "পাঠানো হচ্ছে…"),
  privacy: t3("We use your number only to help with this request. Never share OTPs or PINs.", "आपका नंबर सिर्फ़ इसी काम के लिए इस्तेमाल होगा। OTP या पिन कभी साझा न करें।", "আপনার নম্বর শুধু এই কাজের জন্য ব্যবহার হবে। OTP বা PIN কখনো শেয়ার করবেন না।"),
  thanks: t3("Thank you, {name}! We’ll call you on {phone} soon. Keep the documents above ready.", "धन्यवाद, {name}! हम जल्द ही {phone} पर कॉल करेंगे। ऊपर दिए दस्तावेज़ तैयार रखें।", "ধন্যবাদ, {name}! শিগগিরই {phone} নম্বরে কল করব। উপরের কাগজপত্র তৈরি রাখুন।"),
  whatsapp: t3("Chat on WhatsApp now", "अभी व्हाट्सऐप पर बात करें", "এখনই হোয়াটসঅ্যাপে কথা বলুন"),
  continue: t3("No thanks, open {site}", "नहीं, {site} खोलें", "না, {site} খুলুন"),
  close: t3("Close", "बंद करें", "বন্ধ করুন"),
  errName: t3("Please enter your name.", "कृपया अपना नाम लिखें।", "আপনার নাম লিখুন।"),
  errPhone: t3("Enter a valid 10-digit mobile number.", "सही 10 अंकों का मोबाइल नंबर डालें।", "সঠিক ১০ সংখ্যার মোবাইল নম্বর দিন।"),
  errSend: t3("Could not send. Please WhatsApp or call us.", "नहीं भेजा जा सका। कृपया व्हाट्सऐप या कॉल करें।", "পাঠানো গেল না। হোয়াটসঅ্যাপ বা কল করুন।"),
  official: t3("Official site", "आधिकारिक साइट", "সরকারি সাইট"),
};
