/**
 * Interface text in English, Hindi and Bengali for the header, footer, chat assistant,
 * sign-in pages and the step-by-step request flows.
 *
 * Page content (service pages, guides) is translated per route under /hi and /bn instead.
 * Please have native speakers review wording before launch.
 *
 * This file has no imports so it can be unit-tested with plain Node.
 */
export type Locale = "en" | "hi" | "bn";
export const LOCALES: Locale[] = ["en", "hi", "bn"];

export const LOCALE_META: Record<Locale, { label: string; short: string; htmlLang: string; english: string }> = {
  en: { label: "English", short: "EN", htmlLang: "en-IN", english: "English" },
  hi: { label: "हिन्दी", short: "हिं", htmlLang: "hi-IN", english: "Hindi" },
  bn: { label: "বাংলা", short: "বাং", htmlLang: "bn-IN", english: "Bengali" },
};

export const LANG_COOKIE = "nc_lang";

/** App screens (and /offers) follow the visitor's chosen language; content pages follow their URL (/, /hi, /bn). */
export const APP_PATHS = ["/login", "/signup", "/forgot-password", "/profile", "/request", "/print", "/pan/request", "/admin", "/offers"];

export function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "hi" || value === "bn";
}

export function localeFromPath(pathname: string): Locale {
  if (pathname === "/hi" || pathname.startsWith("/hi/")) return "hi";
  if (pathname === "/bn" || pathname.startsWith("/bn/")) return "bn";
  return "en";
}

export function isAppPath(pathname: string) {
  return APP_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

/** Removes a /hi or /bn prefix. */
export function basePath(pathname: string) {
  const stripped = pathname.replace(/^\/(hi|bn)(?=\/|$)/, "");
  return stripped || "/";
}

/**
 * Where the language menu should go. Translated service pages keep the visitor on the same
 * service; other content pages go to the translated home page; app screens stay put.
 */
export function localizedHref(pathname: string, target: Locale, translated: { hi: readonly string[]; bn: readonly string[] }) {
  if (isAppPath(pathname)) return null;
  const base = basePath(pathname);
  const service = /^\/services\/([^/]+)$/.exec(base)?.[1];
  if (target === "en") return base;
  if (service && translated[target].includes(service)) return `/${target}/services/${service}`;
  return `/${target}`;
}

const en = {
  nav: {
    services: "Services", offers: "Offers", gallery: "Gallery", guides: "Guides", contact: "Contact", about: "About us",
    areas: "Areas we serve", faq: "FAQs", team: "Our team", social: "Updates", pan: "PAN help hub",
    track: "Track request", signIn: "Sign in", myProfile: "My account", signOut: "Sign out", signingOut: "Signing out…",
    menu: "Menu", close: "Close", language: "Language", changeLanguage: "Change language",
    startRequest: "Start a request", call: "Call", whatsapp: "WhatsApp", home: "Home", account: "Account", request: "Request",
    skip: "Skip to content",
  },
  ticker: { live: "LIVE", viewAll: "All offers" },
  footer: {
    tagline: "Your neighbourhood CSC & Pragya Kendra. Sarkari & digital kaam, sorted with a human touch.",
    explore: "Explore", help: "Help", visit: "Visit us", hours: "Opening hours", hoursFallback: "Mon–Sat · call before visiting",
    directions: "Get directions", languages: "Languages",
    disclaimer: "NISE COMPORT is an independent CSC / Pragya Kendra service centre, not a government office, bank or insurer. Official and third-party fees are separate from our service charge.",
    rights: "All rights reserved.", privacy: "Privacy", terms: "Terms",
  },
  chat: {
    open: "Chat with us", close: "Close chat", title: "NISE COMPORT Help", status: "Helps instantly · team replies on WhatsApp",
    greeting: "Namaste! 👋 Welcome to NISE COMPORT Help. Ask what documents you need, or what we can do for you today.",
    docsLabel: "What documents do I need?", docsPick: "Which service? Tap one, or type it (e.g. “voter ID address change”).",
    docsFor: "Documents for", otherCases: "Other cases:", bringNote: "Bring originals; we scan and return them. Not sure about anything? Call us or WhatsApp us and we’ll check for you.",
    callbackLabel: "Call me back", callbackAsk: "Leave your name and mobile number. Our team will call you during shop hours.",
    namePlaceholder: "Your name", phonePlaceholder: "10-digit mobile number", callbackSend: "Request a call",
    callbackThanks: "Thank you{name}! We’ll call you on {phone} soon. You can also WhatsApp us right now.",
    callbackError: "That number doesn’t look right. Please enter a 10-digit mobile number.",
    pick: "Pick a topic or type your question.",
    placeholder: "Type your question…", send: "Send",
    viewDetails: "View details", startRequest: "Start request", continueWa: "Continue on WhatsApp", callUs: "Call us", directions: "Directions",
    noMatch: "I couldn’t find an exact match. Our team can answer this on WhatsApp.",
    matches: "These might be what you need:",
    waPrefix: "Hi NISE COMPORT, I need help with",
    restart: "Start over",
    topics: {
      pan: { label: "PAN card", answer: "New PAN, corrections and reprints. Keep proof of identity, address and date of birth ready. We confirm the exact list before you visit." },
      aadhaar: { label: "Aadhaar help", answer: "We guide you to the right Aadhaar update route, appointment and documents. Biometric updates happen at authorised Aadhaar centres." },
      certificates: { label: "Certificates", answer: "Income, caste, residence, EWS, birth and death certificates through the official Jharkhand process. Approval is by the department." },
      banking: { label: "Banking & AEPS", answer: "AEPS cash withdrawal, money transfer, balance enquiry and account-opening help at our banking point." },
      offers: { label: "Offers & codes", answer: "Every festival and big Team India match has a ₹50 code, and new accounts get a ₹50 welcome coupon. Codes live today:" },
      insurance: { label: "Insurance", answer: "Bike, car, health and life insurance enquiries through participating insurers. Compare, renew or buy with local help." },
      print: { label: "Print & scan", answer: "Upload from your phone, choose pages, colour and copies, then pick up at the counter or ask for delivery." },
      bills: { label: "Bills & recharge", answer: "Electricity, mobile, DTH, fees and other supported payments with a receipt." },
      forms: { label: "Exam & job forms", answer: "Exam, recruitment, scholarship and admission forms, filled carefully with document uploads." },
      track: { label: "Track my request", answer: "Sign in and open “My requests” to see live status and your reference number." },
      visit: { label: "Timing & location", answer: "Hanuman Mandir Road, Kharangajhar, Telco, Jamshedpur. Tap Directions for the route." },
      human: { label: "Talk to a person", answer: "Sure! Tap below and your message opens in WhatsApp. A team member replies during shop hours." },
    },
  },
  wizard: {
    stepOf: "Step {n} of {total}",
    steps: ["Service", "Details", "Visit", "Review"],
    next: "Continue", back: "Back", submit: "Send request", sending: "Sending…", edit: "Edit",
    s1Title: "What do you need help with?", s1Sub: "Pick a category, then the exact service.",
    search: "Search e.g. PAN correction, income certificate", allCategories: "All",
    somethingElse: "Something else / not sure", somethingElseSub: "Tell us in the next step",
    s2Title: "Tell us a little more", s2Sub: "A few words help us confirm documents and fees before you visit.",
    name: "Your name", phone: "Mobile / WhatsApp number", phoneHint: "10-digit Indian mobile number",
    contactVia: "How should we update you?", viaWhatsapp: "WhatsApp", viaPhone: "Phone call", viaEmail: "Email",
    describe: "What exactly do you need?", describeHint: "Never type OTPs, PINs, passwords or full Aadhaar/PAN numbers.",
    quickPicks: "Quick picks",
    attach: "Add a supporting document", attachHint: "Optional · PDF, Word or image up to 20 MB", attachLater: "Sign in first to attach a document. Your answers are saved.",
    remove: "Remove",
    s3Title: "How would you like to get it done?", s3Sub: "Choose what suits you. We confirm the final time.",
    walkin: "Visit the centre", walkinSub: "Pick a day and time slot",
    callback: "Call me back first", callbackSub: "We call to confirm documents and fees",
    doorstep: "Doorstep help", doorstepSub: "Near Telco & Kharangajhar, on request",
    online: "Mostly online", onlineSub: "Share documents on WhatsApp when we ask",
    day: "Preferred day", slot: "Preferred time", morning: "Morning", afternoon: "Afternoon", evening: "Evening",
    today: "Today", tomorrow: "Tomorrow",
    address: "Address for doorstep help", savedAddress: "Saved address",
    s4Title: "Check and send", s4Sub: "Make sure everything looks right.",
    summaryService: "Service", summaryContact: "Contact", summaryVisit: "Visit", summaryNote: "Your note", summaryFile: "Document",
    offerApplied: "Offer added to this request", offerCheck: "We check eligibility when you send it.",
    consent: "I agree: the details and documents I share are correct and mine (or I’m allowed to share them). NISE COMPORT is a service provider that helps me apply; approvals and decisions rest with the government office, bank or insurer. My data is kept safely and used only for this request. NISE COMPORT isn’t responsible for problems caused by wrong information I give. I’ll show originals when asked and never share OTPs or PINs.",
    signInNote: "You’ll sign in or create a free account to send. Your answers stay saved.",
    signInToSend: "Sign in & send",
    successTitle: "Request sent! 🎉", successSub: "Your reference number", successNext: "We’ll contact you soon with the document checklist and fees.",
    track: "Track in my account", shareWa: "Send details on WhatsApp", another: "Start another request",
    offerNotApplied: "The offer wasn’t added:",
    errChooseService: "Choose a service to continue.", errDescribe: "Please describe what you need (at least 8 characters).",
    errPhone: "Enter a valid 10-digit mobile number.", errName: "Please enter your name.", errMode: "Choose how you’d like to get it done.",
    errDay: "Pick a preferred day.", errAddress: "Add the address for doorstep help.", errConsent: "Please tick the confirmation to continue.",
    errFile: "The file is larger than 20 MB. Attach a smaller file or bring it to the centre.",
    demo: "The local demo account can’t send requests. Create a real account to continue.",
  },
  rail: {
    live: "Live offers", validTill: "Valid till", claim: "Claim", applies: "Applies here", firstOnly: "First time only",
    helpTitle: "Stuck somewhere?", helpSub: "Chat on WhatsApp, a real person replies.", helpCta: "Ask on WhatsApp",
    trust: ["Clear fees before we start", "Live request tracking", "Help in English, हिन्दी & বাংলা"],
  },
  auth: {
    language: "Language",
    signinTitle: "Welcome back 👋", signinSub: "Sign in to track requests and manage your details.",
    signupTitle: "Create your free account", signupSub: "Takes a minute. Track every request in one place.",
    otpTitle: "Check your inbox", otpSub: "Enter the 6-digit code sent to", otpSpam: "Can’t find it? Check spam or promotions.",
    name: "Your name", namePh: "e.g. Priya Kumari", firstName: "First name", firstNamePh: "e.g. Priya", lastName: "Last name", lastNamePh: "e.g. Kumari", whatsapp: "WhatsApp number", email: "Email address", phone: "Mobile number", optional: "Optional",
    password: "Password", passwordPh: "Your password", newPasswordPh: "At least {n} characters",
    passwordHint: "Use {n}+ characters. A short phrase is easy to remember and hard to guess.",
    show: "Show password", hide: "Hide password",
    signin: "Sign in", signup: "Continue", verify: "Verify & continue", wait: "Please wait…", verifying: "Verifying…",
    codeSignin: "Sign in with an email code", forgot: "Forgot password?",
    resend: "Resend code", resendIn: "Resend in {s}s", differentEmail: "Use a different email",
    codeLabel: "6-digit code", codeRules: "Codes expire after 10 minutes and allow 5 attempts. Our staff will never ask for this code.",
    haveAccount: "Already have an account?", newHere: "New to NISE COMPORT?", createAccount: "Create an account", signinLink: "Sign in",
    agree: "By continuing, you agree to our", terms: "Terms", privacy: "Privacy Policy", and: "and",
    panelKicker: "ONE ACCOUNT · EVERY KAAM", panelTitle: "Your documents & requests, all in one place.",
    benefits: ["Track every request live", "Save addresses for delivery", "Get offers before anyone else"],
    safe: "Protected with encrypted connections. We never ask for OTPs or PINs.",
    devHint: "Developer mode: if SMTP isn’t configured, the email (with the code) is printed in the terminal running “npm run dev”.",
    failSignin: "We couldn’t sign you in. Please try again.", failSend: "We couldn’t send a code. Please try again.",
    failVerify: "We couldn’t verify that code.", failResend: "Could not resend the code.",
    sentVerify: "Please verify your email. If a code isn’t already in your inbox, we’ve just sent one.",
    newCodeSent: "A new code is on its way. Only the newest code works.",
    enterEmailFirst: "Enter your email address first.",
    back: "Back to home",
    resetTitle: "Reset your password", resetSub: "We’ll email you a 6-digit code.", resetSend: "Send reset code",
    resetCodeTitle: "Choose a new password", newPassword: "New password", resetSave: "Save new password",
    resetDone: "Password updated. You can sign in now.", backToSignin: "Back to sign in",
  },
};

export type Dictionary = typeof en;

const hi: Dictionary = {
  nav: {
    services: "सेवाएँ", offers: "ऑफ़र", gallery: "गैलरी", guides: "गाइड", contact: "संपर्क", about: "हमारे बारे में",
    areas: "सेवा क्षेत्र", faq: "सवाल-जवाब", team: "हमारी टीम", social: "अपडेट", pan: "पैन सहायता",
    track: "अनुरोध ट्रैक करें", signIn: "साइन इन", myProfile: "मेरा खाता", signOut: "साइन आउट", signingOut: "साइन आउट हो रहा है…",
    menu: "मेन्यू", close: "बंद करें", language: "भाषा", changeLanguage: "भाषा बदलें",
    startRequest: "अनुरोध शुरू करें", call: "कॉल", whatsapp: "व्हाट्सऐप", home: "होम", account: "खाता", request: "अनुरोध",
    skip: "मुख्य सामग्री पर जाएँ",
  },
  ticker: { live: "लाइव", viewAll: "सभी ऑफ़र" },
  footer: {
    tagline: "आपका पड़ोस का CSC और प्रज्ञा केंद्र। सरकारी और डिजिटल काम, भरोसेमंद मदद के साथ।",
    explore: "देखें", help: "मदद", visit: "हमसे मिलें", hours: "खुलने का समय", hoursFallback: "सोम–शनि · आने से पहले कॉल करें",
    directions: "रास्ता देखें", languages: "भाषाएँ",
    disclaimer: "NISE COMPORT एक स्वतंत्र CSC / प्रज्ञा केंद्र सेवा केंद्र है, सरकारी कार्यालय, बैंक या बीमा कंपनी नहीं। सरकारी और अन्य शुल्क हमारे सेवा शुल्क से अलग हैं।",
    rights: "सर्वाधिकार सुरक्षित।", privacy: "गोपनीयता", terms: "शर्तें",
  },
  chat: {
    open: "हमसे चैट करें", close: "चैट बंद करें", title: "NISE COMPORT Help", status: "तुरंत मदद · टीम व्हाट्सऐप पर जवाब देती है",
    greeting: "नमस्ते! 👋 NISE COMPORT Help में आपका स्वागत है। पूछिए कौन-से कागज़ चाहिए, या आज हम किस काम में मदद करें।",
    docsLabel: "कौन-से कागज़ चाहिए?", docsPick: "कौन-सी सेवा? किसी पर टैप करें या लिखें (जैसे “वोटर आईडी पता बदलना”)।",
    docsFor: "ज़रूरी कागज़ात:", otherCases: "दूसरे काम:", bringNote: "मूल कागज़ साथ लाएँ; हम स्कैन करके लौटा देते हैं। कोई शंका हो तो हमें कॉल या व्हाट्सऐप करें, हम जाँच कर बता देंगे।",
    callbackLabel: "मुझे कॉल करें", callbackAsk: "अपना नाम और मोबाइल नंबर दें। दुकान के समय में हमारी टीम आपको कॉल करेगी।",
    namePlaceholder: "आपका नाम", phonePlaceholder: "10 अंकों का मोबाइल नंबर", callbackSend: "कॉल का अनुरोध भेजें",
    callbackThanks: "धन्यवाद{name}! हम जल्द ही {phone} पर कॉल करेंगे। चाहें तो अभी व्हाट्सऐप भी कर सकते हैं।",
    callbackError: "यह नंबर सही नहीं लग रहा। कृपया 10 अंकों का मोबाइल नंबर डालें।",
    pick: "कोई विषय चुनें या अपना सवाल लिखें।",
    placeholder: "अपना सवाल लिखें…", send: "भेजें",
    viewDetails: "जानकारी देखें", startRequest: "अनुरोध शुरू करें", continueWa: "व्हाट्सऐप पर जारी रखें", callUs: "कॉल करें", directions: "रास्ता",
    noMatch: "सटीक जानकारी नहीं मिली। हमारी टीम व्हाट्सऐप पर जवाब दे सकती है।",
    matches: "शायद आपको ये चाहिए:",
    waPrefix: "नमस्ते NISE COMPORT, मुझे इसमें मदद चाहिए:",
    restart: "फिर से शुरू करें",
    topics: {
      pan: { label: "पैन कार्ड", answer: "नया पैन, सुधार और रीप्रिंट। पहचान, पता और जन्मतिथि का प्रमाण तैयार रखें। आने से पहले हम पूरी सूची बता देंगे।" },
      aadhaar: { label: "आधार सहायता", answer: "आधार अपडेट का सही तरीका, अपॉइंटमेंट और दस्तावेज़ हम बताते हैं। बायोमेट्रिक अपडेट अधिकृत आधार केंद्र पर होते हैं।" },
      certificates: { label: "प्रमाण पत्र", answer: "आय, जाति, निवास, EWS, जन्म और मृत्यु प्रमाण पत्र – झारखंड की आधिकारिक प्रक्रिया से। मंज़ूरी विभाग देता है।" },
      banking: { label: "बैंकिंग व AEPS", answer: "AEPS नकद निकासी, मनी ट्रांसफ़र, बैलेंस जानकारी और खाता खोलने में मदद।" },
      offers: { label: "ऑफ़र व कोड", answer: "हर त्योहार और टीम इंडिया के हर बड़े मैच पर ₹50 का कोड, और नए खाते पर ₹50 का वेलकम कूपन। आज के लाइव कोड:" },
      insurance: { label: "बीमा", answer: "बाइक, कार, हेल्थ और लाइफ़ बीमा – सहभागी कंपनियों के ज़रिए। तुलना, रिन्यूअल या नई पॉलिसी में मदद।" },
      print: { label: "प्रिंट व स्कैन", answer: "फ़ोन से अपलोड करें, पेज, रंग और कॉपी चुनें, फिर काउंटर से लें या डिलीवरी कहें।" },
      bills: { label: "बिल व रिचार्ज", answer: "बिजली, मोबाइल, DTH, फ़ीस और अन्य भुगतान – रसीद के साथ।" },
      forms: { label: "परीक्षा व नौकरी फ़ॉर्म", answer: "परीक्षा, भर्ती, स्कॉलरशिप और एडमिशन फ़ॉर्म – दस्तावेज़ अपलोड सहित, ध्यान से।" },
      track: { label: "अनुरोध ट्रैक करें", answer: "साइन इन करके “मेरे अनुरोध” खोलें – लाइव स्टेटस और रेफ़रेंस नंबर वहीं दिखेगा।" },
      visit: { label: "समय व पता", answer: "हनुमान मंदिर रोड, खरंगाझार, टेल्को, जमशेदपुर। रास्ते के लिए ‘रास्ता’ दबाएँ।" },
      human: { label: "किसी व्यक्ति से बात", answer: "ज़रूर! नीचे दबाएँ, आपका संदेश व्हाट्सऐप में खुलेगा। दुकान के समय में टीम जवाब देती है।" },
    },
  },
  wizard: {
    stepOf: "चरण {n} / {total}",
    steps: ["सेवा", "जानकारी", "समय", "पुष्टि"],
    next: "आगे बढ़ें", back: "पीछे", submit: "अनुरोध भेजें", sending: "भेजा जा रहा है…", edit: "बदलें",
    s1Title: "किस काम में मदद चाहिए?", s1Sub: "पहले श्रेणी चुनें, फिर सही सेवा।",
    search: "खोजें, जैसे पैन सुधार, आय प्रमाण पत्र", allCategories: "सभी",
    somethingElse: "कुछ और / पक्का नहीं पता", somethingElseSub: "अगले चरण में बताएँ",
    s2Title: "थोड़ा और बताइए", s2Sub: "कुछ शब्द लिखने से हम आने से पहले दस्तावेज़ और शुल्क बता पाएँगे।",
    name: "आपका नाम", phone: "मोबाइल / व्हाट्सऐप नंबर", phoneHint: "10 अंकों का भारतीय मोबाइल नंबर",
    contactVia: "आपको अपडेट कैसे दें?", viaWhatsapp: "व्हाट्सऐप", viaPhone: "फ़ोन कॉल", viaEmail: "ईमेल",
    describe: "आपको ठीक-ठीक क्या चाहिए?", describeHint: "OTP, पिन, पासवर्ड या पूरा आधार/पैन नंबर कभी न लिखें।",
    quickPicks: "झटपट चुनें",
    attach: "सहायक दस्तावेज़ जोड़ें", attachHint: "वैकल्पिक · PDF, Word या फ़ोटो, 20 MB तक", attachLater: "दस्तावेज़ जोड़ने के लिए पहले साइन इन करें। आपके जवाब सुरक्षित हैं।",
    remove: "हटाएँ",
    s3Title: "काम कैसे करवाना चाहेंगे?", s3Sub: "जो सुविधाजनक हो चुनें। अंतिम समय हम पक्का करेंगे।",
    walkin: "केंद्र पर आएँ", walkinSub: "दिन और समय चुनें",
    callback: "पहले मुझे कॉल करें", callbackSub: "हम दस्तावेज़ और शुल्क कॉल पर बताएँगे",
    doorstep: "घर पर मदद", doorstepSub: "टेल्को और खरंगाझार के पास, अनुरोध पर",
    online: "ज़्यादातर ऑनलाइन", onlineSub: "माँगने पर दस्तावेज़ व्हाट्सऐप पर भेजें",
    day: "पसंदीदा दिन", slot: "पसंदीदा समय", morning: "सुबह", afternoon: "दोपहर", evening: "शाम",
    today: "आज", tomorrow: "कल",
    address: "घर पर मदद का पता", savedAddress: "सहेजा पता",
    s4Title: "जाँचें और भेजें", s4Sub: "देख लें कि सब सही है।",
    summaryService: "सेवा", summaryContact: "संपर्क", summaryVisit: "समय", summaryNote: "आपका नोट", summaryFile: "दस्तावेज़",
    offerApplied: "यह ऑफ़र अनुरोध में जोड़ा गया", offerCheck: "भेजते समय पात्रता जाँची जाएगी।",
    consent: "मैं सहमत हूँ: मेरे दिए विवरण और दस्तावेज़ सही हैं और मेरे हैं (या मुझे साझा करने की अनुमति है)। NISE COMPORT आवेदन में मदद करने वाला सेवा प्रदाता है; मंज़ूरी और फ़ैसले सरकारी कार्यालय, बैंक या बीमा कंपनी के हाथ में हैं। मेरा डेटा सुरक्षित रखा जाएगा और सिर्फ़ इसी अनुरोध के लिए इस्तेमाल होगा। मेरी दी गई गलत जानकारी से हुई दिक्कत के लिए NISE COMPORT ज़िम्मेदार नहीं है। माँगे जाने पर मूल दस्तावेज़ दिखाऊँगा/दिखाऊँगी और OTP या पिन किसी से साझा नहीं करूँगा/करूँगी।",
    signInNote: "भेजने के लिए साइन इन करें या मुफ़्त खाता बनाएँ। आपके जवाब सुरक्षित रहेंगे।",
    signInToSend: "साइन इन करके भेजें",
    successTitle: "अनुरोध भेज दिया गया! 🎉", successSub: "आपका रेफ़रेंस नंबर", successNext: "हम जल्द ही दस्तावेज़ सूची और शुल्क के साथ संपर्क करेंगे।",
    track: "मेरे खाते में ट्रैक करें", shareWa: "विवरण व्हाट्सऐप पर भेजें", another: "नया अनुरोध शुरू करें",
    offerNotApplied: "ऑफ़र नहीं जुड़ा:",
    errChooseService: "आगे बढ़ने के लिए सेवा चुनें।", errDescribe: "कृपया बताएँ क्या चाहिए (कम से कम 8 अक्षर)।",
    errPhone: "सही 10 अंकों का मोबाइल नंबर डालें।", errName: "कृपया अपना नाम लिखें।", errMode: "काम करवाने का तरीका चुनें।",
    errDay: "पसंदीदा दिन चुनें।", errAddress: "घर पर मदद के लिए पता जोड़ें।", errConsent: "आगे बढ़ने के लिए पुष्टि पर टिक करें।",
    errFile: "फ़ाइल 20 MB से बड़ी है। छोटी फ़ाइल जोड़ें या केंद्र पर लाएँ।",
    demo: "लोकल डेमो खाते से अनुरोध नहीं भेजा जा सकता। आगे बढ़ने के लिए असली खाता बनाएँ।",
  },
  rail: {
    live: "लाइव ऑफ़र", validTill: "मान्य", claim: "पाएँ", applies: "यहाँ लागू", firstOnly: "केवल पहली बार",
    helpTitle: "कहीं अटक गए?", helpSub: "व्हाट्सऐप पर चैट करें, असली व्यक्ति जवाब देगा।", helpCta: "व्हाट्सऐप पर पूछें",
    trust: ["काम से पहले साफ़ शुल्क", "लाइव अनुरोध ट्रैकिंग", "English, हिन्दी और বাংলা में मदद"],
  },
  auth: {
    language: "भाषा",
    signinTitle: "फिर से स्वागत है 👋", signinSub: "अनुरोध ट्रैक करने और अपनी जानकारी संभालने के लिए साइन इन करें।",
    signupTitle: "अपना मुफ़्त खाता बनाएँ", signupSub: "बस एक मिनट। हर अनुरोध एक ही जगह ट्रैक करें।",
    otpTitle: "अपना इनबॉक्स देखें", otpSub: "यहाँ भेजा गया 6 अंकों का कोड डालें:", otpSpam: "नहीं मिला? स्पैम या प्रमोशन फ़ोल्डर देखें।",
    name: "आपका नाम", namePh: "जैसे प्रिया कुमारी", firstName: "पहला नाम", firstNamePh: "जैसे प्रिया", lastName: "अंतिम नाम", lastNamePh: "जैसे कुमारी", whatsapp: "व्हाट्सऐप नंबर", email: "ईमेल पता", phone: "मोबाइल नंबर", optional: "वैकल्पिक",
    password: "पासवर्ड", passwordPh: "आपका पासवर्ड", newPasswordPh: "कम से कम {n} अक्षर",
    passwordHint: "{n}+ अक्षर रखें। छोटा वाक्य याद रखना आसान और अंदाज़ा लगाना मुश्किल होता है।",
    show: "पासवर्ड दिखाएँ", hide: "पासवर्ड छिपाएँ",
    signin: "साइन इन", signup: "आगे बढ़ें", verify: "सत्यापित करें", wait: "कृपया रुकें…", verifying: "सत्यापन हो रहा है…",
    codeSignin: "ईमेल कोड से साइन इन करें", forgot: "पासवर्ड भूल गए?",
    resend: "कोड दोबारा भेजें", resendIn: "{s} सेकंड में दोबारा भेजें", differentEmail: "दूसरा ईमेल इस्तेमाल करें",
    codeLabel: "6 अंकों का कोड", codeRules: "कोड 10 मिनट में समाप्त होता है और 5 बार कोशिश की जा सकती है। हमारा स्टाफ़ यह कोड कभी नहीं माँगेगा।",
    haveAccount: "पहले से खाता है?", newHere: "NISE COMPORT पर नए हैं?", createAccount: "खाता बनाएँ", signinLink: "साइन इन",
    agree: "आगे बढ़कर आप हमारी इनसे सहमत हैं:", terms: "शर्तें", privacy: "गोपनीयता नीति", and: "और",
    panelKicker: "एक खाता · हर काम", panelTitle: "आपके दस्तावेज़ और अनुरोध, सब एक जगह।",
    benefits: ["हर अनुरोध लाइव ट्रैक करें", "डिलीवरी के लिए पते सहेजें", "ऑफ़र सबसे पहले पाएँ"],
    safe: "एन्क्रिप्टेड कनेक्शन से सुरक्षित। हम कभी OTP या पिन नहीं माँगते।",
    devHint: "डेवलपर मोड: SMTP सेट नहीं है तो कोड वाला ईमेल “npm run dev” वाले टर्मिनल में दिखेगा।",
    failSignin: "साइन इन नहीं हो सका। कृपया फिर कोशिश करें।", failSend: "कोड नहीं भेजा जा सका। कृपया फिर कोशिश करें।",
    failVerify: "कोड सत्यापित नहीं हो सका।", failResend: "कोड दोबारा नहीं भेजा जा सका।",
    sentVerify: "कृपया अपना ईमेल सत्यापित करें। इनबॉक्स में कोड नहीं है तो हमने अभी भेज दिया है।",
    newCodeSent: "नया कोड भेजा जा रहा है। केवल नया कोड ही काम करेगा।",
    enterEmailFirst: "पहले अपना ईमेल पता डालें।",
    back: "होम पर वापस",
    resetTitle: "पासवर्ड रीसेट करें", resetSub: "हम आपको 6 अंकों का कोड ईमेल करेंगे।", resetSend: "रीसेट कोड भेजें",
    resetCodeTitle: "नया पासवर्ड चुनें", newPassword: "नया पासवर्ड", resetSave: "नया पासवर्ड सहेजें",
    resetDone: "पासवर्ड बदल गया। अब साइन इन करें।", backToSignin: "साइन इन पर वापस",
  },
};

const bn: Dictionary = {
  nav: {
    services: "পরিষেবা", offers: "অফার", gallery: "গ্যালারি", guides: "গাইড", contact: "যোগাযোগ", about: "আমাদের কথা",
    areas: "পরিষেবা এলাকা", faq: "প্রশ্নোত্তর", team: "আমাদের টিম", social: "আপডেট", pan: "প্যান সহায়তা",
    track: "অনুরোধ ট্র্যাক করুন", signIn: "সাইন ইন", myProfile: "আমার অ্যাকাউন্ট", signOut: "সাইন আউট", signingOut: "সাইন আউট হচ্ছে…",
    menu: "মেনু", close: "বন্ধ করুন", language: "ভাষা", changeLanguage: "ভাষা বদলান",
    startRequest: "অনুরোধ শুরু করুন", call: "কল", whatsapp: "হোয়াটসঅ্যাপ", home: "হোম", account: "অ্যাকাউন্ট", request: "অনুরোধ",
    skip: "মূল অংশে যান",
  },
  ticker: { live: "লাইভ", viewAll: "সব অফার" },
  footer: {
    tagline: "আপনার পাড়ার CSC ও প্রজ্ঞা কেন্দ্র। সরকারি ও ডিজিটাল কাজ, আন্তরিক সাহায্যের সঙ্গে।",
    explore: "দেখুন", help: "সাহায্য", visit: "আমাদের কাছে আসুন", hours: "খোলার সময়", hoursFallback: "সোম–শনি · আসার আগে ফোন করুন",
    directions: "পথ দেখুন", languages: "ভাষা",
    disclaimer: "NISE COMPORT একটি স্বাধীন CSC / প্রজ্ঞা কেন্দ্র পরিষেবা কেন্দ্র, সরকারি অফিস, ব্যাংক বা বিমা কোম্পানি নয়। সরকারি ও অন্যান্য ফি আমাদের সার্ভিস চার্জ থেকে আলাদা।",
    rights: "সর্বস্বত্ব সংরক্ষিত।", privacy: "গোপনীয়তা", terms: "শর্তাবলি",
  },
  chat: {
    open: "আমাদের সঙ্গে চ্যাট করুন", close: "চ্যাট বন্ধ করুন", title: "NISE COMPORT Help", status: "সঙ্গে সঙ্গে সাহায্য · টিম হোয়াটসঅ্যাপে উত্তর দেয়",
    greeting: "নমস্কার! 👋 NISE COMPORT Help-এ স্বাগত। জিজ্ঞেস করুন কী কী কাগজ লাগবে, বা আজ কোন কাজে সাহায্য চাই।",
    docsLabel: "কী কী কাগজ লাগবে?", docsPick: "কোন পরিষেবা? একটিতে ট্যাপ করুন বা লিখুন (যেমন “ভোটার আইডি ঠিকানা বদল”)।",
    docsFor: "প্রয়োজনীয় কাগজপত্র:", otherCases: "অন্যান্য কাজ:", bringNote: "আসল কাগজ নিয়ে আসুন; আমরা স্ক্যান করে ফেরত দিই। কোনো সন্দেহ থাকলে কল বা হোয়াটসঅ্যাপ করুন, আমরা দেখে জানাব।",
    callbackLabel: "আমাকে কল করুন", callbackAsk: "আপনার নাম ও মোবাইল নম্বর দিন। দোকানের সময়ে আমাদের টিম আপনাকে কল করবে।",
    namePlaceholder: "আপনার নাম", phonePlaceholder: "১০ সংখ্যার মোবাইল নম্বর", callbackSend: "কলের অনুরোধ পাঠান",
    callbackThanks: "ধন্যবাদ{name}! শিগগিরই {phone} নম্বরে কল করব। চাইলে এখনই হোয়াটসঅ্যাপ করতে পারেন।",
    callbackError: "নম্বরটি ঠিক মনে হচ্ছে না। ১০ সংখ্যার মোবাইল নম্বর দিন।",
    pick: "একটি বিষয় বাছুন বা প্রশ্ন লিখুন।",
    placeholder: "আপনার প্রশ্ন লিখুন…", send: "পাঠান",
    viewDetails: "বিস্তারিত দেখুন", startRequest: "অনুরোধ শুরু করুন", continueWa: "হোয়াটসঅ্যাপে চালিয়ে যান", callUs: "কল করুন", directions: "পথ",
    noMatch: "ঠিক মিল পাওয়া গেল না। আমাদের টিম হোয়াটসঅ্যাপে উত্তর দিতে পারে।",
    matches: "হয়তো এগুলো আপনার দরকার:",
    waPrefix: "নমস্কার NISE COMPORT, আমার এই বিষয়ে সাহায্য দরকার:",
    restart: "আবার শুরু করুন",
    topics: {
      pan: { label: "প্যান কার্ড", answer: "নতুন প্যান, সংশোধন ও রিপ্রিন্ট। পরিচয়, ঠিকানা ও জন্মতারিখের প্রমাণ তৈরি রাখুন। আসার আগে আমরা পুরো তালিকা জানিয়ে দেব।" },
      aadhaar: { label: "আধার সাহায্য", answer: "আধার আপডেটের সঠিক পথ, অ্যাপয়েন্টমেন্ট ও কাগজপত্র আমরা বুঝিয়ে দিই। বায়োমেট্রিক আপডেট অনুমোদিত আধার কেন্দ্রে হয়।" },
      certificates: { label: "সার্টিফিকেট", answer: "আয়, জাতি, বাসস্থান, EWS, জন্ম ও মৃত্যু সার্টিফিকেট – ঝাড়খণ্ডের সরকারি প্রক্রিয়ায়। অনুমোদন দেয় দপ্তর।" },
      banking: { label: "ব্যাংকিং ও AEPS", answer: "AEPS নগদ তোলা, টাকা পাঠানো, ব্যালান্স জানা ও অ্যাকাউন্ট খোলায় সাহায্য।" },
      offers: { label: "অফার ও কোড", answer: "প্রতিটি উৎসব ও টিম ইন্ডিয়ার প্রতিটি বড় ম্যাচে ₹50-এর কোড, আর নতুন অ্যাকাউন্টে ₹50-এর ওয়েলকাম কুপন। আজকের লাইভ কোড:" },
      insurance: { label: "বিমা", answer: "বাইক, গাড়ি, হেলথ ও লাইফ বিমা – অংশীদার বিমা কোম্পানির মাধ্যমে। তুলনা, রিনিউ বা নতুন পলিসিতে সাহায্য।" },
      print: { label: "প্রিন্ট ও স্ক্যান", answer: "ফোন থেকে আপলোড করুন, পাতা, রং ও কপি বাছুন, তারপর কাউন্টার থেকে নিন বা ডেলিভারি চান।" },
      bills: { label: "বিল ও রিচার্জ", answer: "বিদ্যুৎ, মোবাইল, DTH, ফি ও অন্যান্য পেমেন্ট – রসিদ সহ।" },
      forms: { label: "পরীক্ষা ও চাকরির ফর্ম", answer: "পরীক্ষা, নিয়োগ, স্কলারশিপ ও ভর্তির ফর্ম – ডকুমেন্ট আপলোড সহ, যত্ন করে।" },
      track: { label: "অনুরোধ ট্র্যাক", answer: "সাইন ইন করে “আমার অনুরোধ” খুলুন – লাইভ স্ট্যাটাস ও রেফারেন্স নম্বর সেখানেই।" },
      visit: { label: "সময় ও ঠিকানা", answer: "হনুমান মন্দির রোড, খরংগাঝাড়, টেলকো, জামশেদপুর। পথের জন্য ‘পথ’ চাপুন।" },
      human: { label: "মানুষের সঙ্গে কথা", answer: "নিশ্চয়ই! নিচে চাপুন, আপনার বার্তা হোয়াটসঅ্যাপে খুলবে। দোকান খোলার সময় টিম উত্তর দেয়।" },
    },
  },
  wizard: {
    stepOf: "ধাপ {n} / {total}",
    steps: ["পরিষেবা", "তথ্য", "সময়", "যাচাই"],
    next: "এগিয়ে যান", back: "পিছনে", submit: "অনুরোধ পাঠান", sending: "পাঠানো হচ্ছে…", edit: "বদলান",
    s1Title: "কোন কাজে সাহায্য দরকার?", s1Sub: "আগে বিভাগ বাছুন, তারপর সঠিক পরিষেবা।",
    search: "খুঁজুন, যেমন প্যান সংশোধন, আয় সার্টিফিকেট", allCategories: "সব",
    somethingElse: "অন্য কিছু / নিশ্চিত নই", somethingElseSub: "পরের ধাপে জানান",
    s2Title: "আর একটু জানান", s2Sub: "কয়েকটা কথা লিখলে আসার আগেই কাগজপত্র আর খরচ জানিয়ে দিতে পারব।",
    name: "আপনার নাম", phone: "মোবাইল / হোয়াটসঅ্যাপ নম্বর", phoneHint: "10 সংখ্যার ভারতীয় মোবাইল নম্বর",
    contactVia: "আপনাকে কীভাবে আপডেট দেব?", viaWhatsapp: "হোয়াটসঅ্যাপ", viaPhone: "ফোন কল", viaEmail: "ইমেল",
    describe: "ঠিক কী দরকার?", describeHint: "OTP, PIN, পাসওয়ার্ড বা পুরো আধার/প্যান নম্বর কখনও লিখবেন না।",
    quickPicks: "ঝটপট বাছুন",
    attach: "সহায়ক ডকুমেন্ট যোগ করুন", attachHint: "ঐচ্ছিক · PDF, Word বা ছবি, 20 MB পর্যন্ত", attachLater: "ডকুমেন্ট যোগ করতে আগে সাইন ইন করুন। আপনার উত্তর সংরক্ষিত আছে।",
    remove: "সরান",
    s3Title: "কাজটা কীভাবে করাতে চান?", s3Sub: "যেটা সুবিধা হয় বাছুন। চূড়ান্ত সময় আমরা জানাব।",
    walkin: "কেন্দ্রে আসুন", walkinSub: "দিন ও সময় বাছুন",
    callback: "আগে আমাকে ফোন করুন", callbackSub: "ফোনে কাগজপত্র ও খরচ জানিয়ে দেব",
    doorstep: "বাড়িতে সাহায্য", doorstepSub: "টেলকো ও খরংগাঝাড়ের কাছে, অনুরোধে",
    online: "মূলত অনলাইনে", onlineSub: "চাইলে ডকুমেন্ট হোয়াটসঅ্যাপে পাঠান",
    day: "পছন্দের দিন", slot: "পছন্দের সময়", morning: "সকাল", afternoon: "দুপুর", evening: "সন্ধ্যা",
    today: "আজ", tomorrow: "কাল",
    address: "বাড়িতে সাহায্যের ঠিকানা", savedAddress: "সংরক্ষিত ঠিকানা",
    s4Title: "যাচাই করে পাঠান", s4Sub: "সব ঠিক আছে কি না দেখে নিন।",
    summaryService: "পরিষেবা", summaryContact: "যোগাযোগ", summaryVisit: "সময়", summaryNote: "আপনার নোট", summaryFile: "ডকুমেন্ট",
    offerApplied: "এই অফার অনুরোধে যোগ হয়েছে", offerCheck: "পাঠানোর সময় যোগ্যতা যাচাই হবে।",
    consent: "আমি রাজি: আমার দেওয়া তথ্য ও কাগজপত্র সঠিক এবং আমার (বা শেয়ার করার অনুমতি আছে)। NISE COMPORT আবেদনে সাহায্যকারী পরিষেবা প্রদানকারী; অনুমোদন ও সিদ্ধান্ত সরকারি অফিস, ব্যাংক বা বিমা কোম্পানির। আমার তথ্য নিরাপদে রাখা হবে এবং শুধু এই অনুরোধে ব্যবহার হবে। আমার ভুল তথ্যের জন্য সমস্যা হলে NISE COMPORT দায়ী নয়। চাইলে আসল কাগজপত্র দেখাব, আর OTP বা PIN কারও সঙ্গে শেয়ার করব না।",
    signInNote: "পাঠাতে সাইন ইন করুন বা ফ্রি অ্যাকাউন্ট খুলুন। আপনার উত্তর সংরক্ষিত থাকবে।",
    signInToSend: "সাইন ইন করে পাঠান",
    successTitle: "অনুরোধ পাঠানো হয়েছে! 🎉", successSub: "আপনার রেফারেন্স নম্বর", successNext: "শিগগিরই কাগজপত্রের তালিকা আর খরচ জানিয়ে যোগাযোগ করব।",
    track: "আমার অ্যাকাউন্টে ট্র্যাক করুন", shareWa: "বিবরণ হোয়াটসঅ্যাপে পাঠান", another: "নতুন অনুরোধ শুরু করুন",
    offerNotApplied: "অফার যোগ হয়নি:",
    errChooseService: "এগোতে একটি পরিষেবা বাছুন।", errDescribe: "কী দরকার লিখুন (অন্তত 8 অক্ষর)।",
    errPhone: "সঠিক 10 সংখ্যার মোবাইল নম্বর দিন।", errName: "আপনার নাম লিখুন।", errMode: "কাজ করানোর উপায় বাছুন।",
    errDay: "পছন্দের দিন বাছুন।", errAddress: "বাড়িতে সাহায্যের জন্য ঠিকানা দিন।", errConsent: "এগোতে নিশ্চিতকরণে টিক দিন।",
    errFile: "ফাইল 20 MB-এর বেশি। ছোট ফাইল দিন বা কেন্দ্রে নিয়ে আসুন।",
    demo: "লোকাল ডেমো অ্যাকাউন্ট থেকে অনুরোধ পাঠানো যায় না। এগোতে আসল অ্যাকাউন্ট খুলুন।",
  },
  rail: {
    live: "লাইভ অফার", validTill: "বৈধ", claim: "নিন", applies: "এখানে প্রযোজ্য", firstOnly: "শুধু প্রথমবার",
    helpTitle: "কোথাও আটকে গেছেন?", helpSub: "হোয়াটসঅ্যাপে চ্যাট করুন, সত্যিকারের মানুষ উত্তর দেবেন।", helpCta: "হোয়াটসঅ্যাপে জিজ্ঞেস করুন",
    trust: ["কাজের আগে পরিষ্কার খরচ", "লাইভ অনুরোধ ট্র্যাকিং", "English, हिन्दी ও বাংলায় সাহায্য"],
  },
  auth: {
    language: "ভাষা",
    signinTitle: "আবার স্বাগতম 👋", signinSub: "অনুরোধ ট্র্যাক করতে আর তথ্য সামলাতে সাইন ইন করুন।",
    signupTitle: "আপনার ফ্রি অ্যাকাউন্ট খুলুন", signupSub: "এক মিনিটের কাজ। সব অনুরোধ এক জায়গায় ট্র্যাক করুন।",
    otpTitle: "ইনবক্স দেখুন", otpSub: "এখানে পাঠানো 6 সংখ্যার কোড দিন:", otpSpam: "পাচ্ছেন না? স্প্যাম বা প্রোমোশন ফোল্ডার দেখুন।",
    name: "আপনার নাম", namePh: "যেমন প্রিয়া কুমারী", firstName: "প্রথম নাম", firstNamePh: "যেমন প্রিয়া", lastName: "শেষ নাম", lastNamePh: "যেমন কুমারী", whatsapp: "হোয়াটসঅ্যাপ নম্বর", email: "ইমেল ঠিকানা", phone: "মোবাইল নম্বর", optional: "ঐচ্ছিক",
    password: "পাসওয়ার্ড", passwordPh: "আপনার পাসওয়ার্ড", newPasswordPh: "অন্তত {n} অক্ষর",
    passwordHint: "{n}+ অক্ষর রাখুন। ছোট একটা বাক্য মনে রাখা সহজ, আন্দাজ করা কঠিন।",
    show: "পাসওয়ার্ড দেখান", hide: "পাসওয়ার্ড লুকান",
    signin: "সাইন ইন", signup: "এগিয়ে যান", verify: "যাচাই করুন", wait: "একটু অপেক্ষা করুন…", verifying: "যাচাই হচ্ছে…",
    codeSignin: "ইমেল কোড দিয়ে সাইন ইন", forgot: "পাসওয়ার্ড ভুলে গেছেন?",
    resend: "কোড আবার পাঠান", resendIn: "{s} সেকেন্ডে আবার পাঠান", differentEmail: "অন্য ইমেল ব্যবহার করুন",
    codeLabel: "6 সংখ্যার কোড", codeRules: "কোড 10 মিনিটে মেয়াদ শেষ হয়, 5 বার চেষ্টা করা যায়। আমাদের কর্মীরা কখনও এই কোড চাইবেন না।",
    haveAccount: "আগে থেকেই অ্যাকাউন্ট আছে?", newHere: "NISE COMPORT-এ নতুন?", createAccount: "অ্যাকাউন্ট খুলুন", signinLink: "সাইন ইন",
    agree: "এগিয়ে গেলে আপনি আমাদের এগুলিতে সম্মত হচ্ছেন:", terms: "শর্তাবলি", privacy: "গোপনীয়তা নীতি", and: "ও",
    panelKicker: "এক অ্যাকাউন্ট · সব কাজ", panelTitle: "আপনার কাগজপত্র আর অনুরোধ, সব এক জায়গায়।",
    benefits: ["প্রতিটি অনুরোধ লাইভ ট্র্যাক করুন", "ডেলিভারির ঠিকানা সংরক্ষণ করুন", "অফার সবার আগে পান"],
    safe: "এনক্রিপ্টেড সংযোগে সুরক্ষিত। আমরা কখনও OTP বা PIN চাই না।",
    devHint: "ডেভেলপার মোড: SMTP সেট না থাকলে কোড সহ ইমেল “npm run dev” চলা টার্মিনালে দেখা যাবে।",
    failSignin: "সাইন ইন করা গেল না। আবার চেষ্টা করুন।", failSend: "কোড পাঠানো গেল না। আবার চেষ্টা করুন।",
    failVerify: "কোড যাচাই করা গেল না।", failResend: "কোড আবার পাঠানো গেল না।",
    sentVerify: "ইমেল যাচাই করুন। ইনবক্সে কোড না থাকলে আমরা এইমাত্র পাঠিয়েছি।",
    newCodeSent: "নতুন কোড আসছে। শুধু নতুন কোডটিই কাজ করবে।",
    enterEmailFirst: "আগে আপনার ইমেল ঠিকানা দিন।",
    back: "হোমে ফিরুন",
    resetTitle: "পাসওয়ার্ড রিসেট করুন", resetSub: "আমরা 6 সংখ্যার কোড ইমেল করব।", resetSend: "রিসেট কোড পাঠান",
    resetCodeTitle: "নতুন পাসওয়ার্ড বাছুন", newPassword: "নতুন পাসওয়ার্ড", resetSave: "নতুন পাসওয়ার্ড সংরক্ষণ করুন",
    resetDone: "পাসওয়ার্ড বদলানো হয়েছে। এখন সাইন ইন করুন।", backToSignin: "সাইন ইনে ফিরুন",
  },
};

export const dictionaries: Record<Locale, Dictionary> = { en, hi, bn };

export function dict(locale: Locale): Dictionary {
  return dictionaries[locale] ?? en;
}

/** Fills {name} placeholders. */
export function fill(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
}
