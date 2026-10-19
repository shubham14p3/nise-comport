/**
 * Multilingual search helper: lets people search the (English) service list in Hindi, Bengali
 * or romanised Hindi/Bengali ("bima", "bijli bill"). Each entry maps local words to the English
 * words used in service titles and keywords.
 */
export function normaliseSearch(value: string) {
  return value.toLowerCase().normalize("NFC").replace(/[^\p{L}\p{M}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
}

const GROUPS: [string[], string[]][] = [
  [["पैन", "पान", "প্যান", "pan"], ["pan"]],
  [["आधार", "আধার", "aadhar", "adhar", "aadhaar", "aadhaar"], ["aadhaar", "aadhar"]],
  [["मतदाता", "वोटर", "ভোটার", "voter", "matdata", "epic"], ["voter"]],
  [["आय", "आमदनी", "আয়", "aay", "aamdani"], ["income"]],
  [["जाति", "জাতি", "jati", "jaati"], ["caste"]],
  [["निवास", "आवासीय", "আবাসিক", "nivas", "awasiya", "awasiy"], ["residence", "residential"]],
  [["प्रमाण", "प्रमाणपत्र", "प्रमाण पत्र", "सर्टिफिकेट", "সনদ", "শংসাপত্র", "প্রমাণপত্র", "সার্টিফিকেট", "praman", "pramaan", "patra", "pramanpatra"], ["certificate"]],
  [["जीवन प्रमाण", "জীবন প্রমাণ", "jeevan", "jivan", "জীবন"], ["life", "jeevan"]],
  [["बीमा", "बीमे", "বিমার", "বিমা", "bima", "beema", "bimaa"], ["insurance"]],
  [["बाइक", "बाईक", "मोटरसाइकिल", "বাইক", "motorcycle"], ["bike", "two wheeler"]],
  [["गाड़ी", "गाडी", "वाहन", "গাড়ি", "gaadi", "gadi", "vahan"], ["vehicle", "car", "bike"]],
  [["कार", "কার"], ["car"]],
  [["बिजली", "বিদ্যুৎ", "বিদ্যুত", "bijli", "bizli", "bijali"], ["electricity", "power"]],
  [["बिल", "বিল", "bil"], ["bill"]],
  [["पानी", "জল", "pani", "jal"], ["water"]],
  [["गैस", "গ্যাস"], ["gas", "lpg"]],
  [["रिचार्ज", "রিচার্জ"], ["recharge"]],
  [["प्रिंट", "छपाई", "প্রিন্ট", "ছাপা", "chhapai", "printout"], ["print"]],
  [["फोटो", "फ़ोटो", "ছবি", "ফটো", "tasveer"], ["photo", "passport size"]],
  [["स्कैन", "স্ক্যান"], ["scan"]],
  [["फोटोकॉपी", "ज़ेरॉक्स", "ज़ेरोक्स", "जेरॉक्स", "জেরক্স", "xerox", "zerox"], ["copy", "xerox", "print"]],
  [["लैमिनेशन", "ল্যামিনেশন"], ["lamination", "laminate"]],
  [["पासपोर्ट", "পাসপোর্ট"], ["passport"]],
  [["राशन", "রেশন", "rashan", "reshan"], ["ration"]],
  [["बैंक", "ব্যাংক", "ব্যাঙ্ক", "baink"], ["bank", "banking"]],
  [["निकासी", "नकद", "कैश", "টাকা তোলা", "ক্যাশ", "nikasi", "nakad", "paise nikalna", "paisa"], ["aeps", "cash", "withdrawal"]],
  [["ट्रांसफर", "भेजना", "ট্রান্সফার", "টাকা পাঠানো", "bhejna", "dmt"], ["transfer", "money"]],
  [["खाता", "অ্যাকাউন্ট", "একাউন্ট", "khata"], ["account"]],
  [["पेंशन", "পেনশন", "pension"], ["pension"]],
  [["छात्रवृत्ति", "स्कॉलरशिप", "বৃত্তি", "স্কলারশিপ", "chhatravritti"], ["scholarship"]],
  [["परीक्षा", "পরীক্ষা", "pariksha"], ["exam"]],
  [["फॉर्म", "फार्म", "ফর্ম", "form"], ["form"]],
  [["आवेदन", "আবেদন", "avedan", "abedan"], ["application", "apply"]],
  [["नौकरी", "रोजगार", "চাকরি", "naukri", "rozgar"], ["job", "recruitment", "employment"]],
  [["जन्म", "জন্ম", "janm"], ["birth"]],
  [["मृत्यु", "মৃত্যু", "mrityu"], ["death"]],
  [["विवाह", "शादी", "বিবাহ", "বিয়ে", "shaadi", "vivah", "biye"], ["marriage"]],
  [["लाइसेंस", "लाइसेन्स", "लाईसेंस", "লাইসেন্স", "license", "licence"], ["licence", "license", "driving"]],
  [["ड्राइविंग", "ড্রাইভিং", "dl"], ["driving", "licence", "license"]],
  [["ट्रेन", "रेल", "रेलवे", "টিকিট", "রেল", "ট্রেন", "irctc"], ["train", "railway", "irctc", "ticket"]],
  [["टिकट", "टिकिट", "টিকেট"], ["ticket"]],
  [["बस", "বাস"], ["bus"]],
  [["फ्लाइट", "हवाई", "ফ্লাইট", "বিমান"], ["flight"]],
  [["कंप्यूटर", "कम्प्यूटर", "কম্পিউটার"], ["computer"]],
  [["लैपटॉप", "ল্যাপটপ"], ["laptop"]],
  [["मरम्मत", "रिपेयर", "মেরামত", "রিপেয়ার", "marammat"], ["repair"]],
  [["ईमेल", "ইমেইল"], ["email"]],
  [["सुधार", "संशोधन", "करेक्शन", "সংশোধন", "sudhar", "sanshodhan"], ["correction", "update", "change"]],
  [["नया", "नई", "नए", "নতুন", "naya", "nayi", "notun"], ["new", "apply"]],
  [["नवीनीकरण", "रिन्यू", "रिन्यूअल", "নবায়ন", "রিনিউ", "renew"], ["renewal", "renew"]],
  [["डिजिटल", "ডিজিটাল"], ["digital"]],
  [["कर", "टैक्स", "आयकर", "ট্যাক্স", "আয়কর", "itr"], ["tax", "itr", "income tax"]],
  [["जीएसटी", "জিএসটি"], ["gst"]],
  [["उद्यम", "উদ্যম", "msme"], ["udyam", "msme"]],
  [["पंजीकरण", "रजिस्ट्रेशन", "নিবন্ধন", "রেজিস্ট্রেশন", "panjikaran"], ["registration", "register"]],
  [["लोन", "ऋण", "ঋণ", "লোন", "karj"], ["loan"]],
  [["स्वास्थ्य", "সাস্থ্য", "স্বাস্থ্য", "swasthya"], ["health"]],
  [["आयुष्मान", "আয়ুষ্মান"], ["ayushman"]],
  [["श्रम", "শ্রম", "shramik"], ["shram", "labour"]],
  [["किसान", "কৃষক", "kisan"], ["kisan", "farmer"]],
  [["डाउनलोड", "ডাউনলোড"], ["download"]],
  [["ऑनलाइन", "অনলাইন"], ["online"]],
  [["सरकारी", "সরকারি", "sarkari"], ["government", "govt"]],
  [["छात्र", "विद्यार्थी", "ছাত্র", "student"], ["student"]],
  [["मोबाइल", "মোবাইল"], ["mobile"]],
  [["खोया", "गुम", "হারানো", "duplicate", "khoya"], ["duplicate", "lost"]],
];

const INDEX = GROUPS.flatMap(([locals, english]) => locals.map((key) => [normaliseSearch(key), english] as const)).filter(([key]) => key.length >= 2);

/** English words that a typed word might stand for (empty if it is already English). */
export function expandWord(word: string): string[] {
  const out = new Set<string>();
  for (const [key, english] of INDEX) {
    // Exact word, or an inflected form that starts with the known word (e.g. बीमे / বিমার).
    if (word === key || (word.length > key.length && word.startsWith(key) && !/^[a-z]+$/.test(key)) || (key.length > 3 && word.length >= 3 && key.startsWith(word) && !/^[a-z]+$/.test(word))) english.forEach((term) => out.add(term));
  }
  return [...out];
}

/** Does `haystack` (already normalised) satisfy every typed word, in English or another language? */
export function matchesSearch(haystack: string, query: string): boolean {
  const words = normaliseSearch(query).split(" ").filter(Boolean);
  if (!words.length) return true;
  // Two-word local phrases ("प्रमाण पत्र", "जीवन प्रमाण") are handled by also trying the whole query.
  const whole = normaliseSearch(query);
  const phrase = expandWord(whole);
  if (phrase.length && phrase.some((term) => haystack.includes(term))) return true;
  return words.every((word) => haystack.includes(word) || expandWord(word).some((term) => haystack.includes(term)));
}
