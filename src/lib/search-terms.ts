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
  [["सीसीटीवी", "सीसी टीवी", "সিসিটিভি", "cctv", "camera", "कैमरा", "ক্যামেরা"], ["cctv", "camera"]],
  [["प्रिंटर", "প্রিন্টার", "printar"], ["printer"]],
  [["वेबसाइट", "ওয়েবসাইট", "website", "web site"], ["website"]],
  [["डेटा रिकवरी", "ডেটা রিকভারি", "data recovery"], ["data", "recovery"]],
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

function editDistance(a: string, b: string, max: number) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  let before: number[] | null = null;
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      let value = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (before && i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) value = Math.min(value, before[j - 2] + 1);
      row.push(value); if (value < best) best = value;
    }
    if (best > max) return max + 1;
    before = prev; prev = row;
  }
  return prev[b.length];
}

/** "insurnce", "inshurance", "insurence" and "nsurance" all reduce to the same consonant skeleton. */
function skeleton(word: string) {
  return word.replace(/[aeiouy]/g, "").replace(/(.)\1+/g, "$1").replace(/ph/g, "f").replace(/(?<=.)h/g, "");
}

/** Does a possibly misspelt word look like one of the words in the text? Handles wrong letters, missing letters, swapped letters and short forms. */
export function fuzzyWordMatch(word: string, tokens: string[]): boolean {
  if (word.length < 3 || !/^[a-z]+$/.test(word)) return false;
  // Four-letter words only match by sound ("paan" → "pan"), so "card" does not match "car".
  if (word.length === 4) return tokens.some((token) => token.length >= 3 && skeleton(token) === skeleton(word));
  const limit = word.length <= 4 ? 1 : word.length <= 8 ? 2 : 3;
  const skel = skeleton(word);
  for (const token of tokens) {
    if (!/^[a-z]+$/.test(token)) continue;
    if (token.startsWith(word)) return true;
    if (editDistance(word, token, limit) <= limit) return true;
    // Typing a word that is cut short and misspelt, e.g. "insuran", "insurnc".
    if (word.length >= 5 && editDistance(word, token.slice(0, word.length + 1), 1) <= 1) return true;
    if (skel.length >= 3 && word.length >= 4 && (skeleton(token) === skel || (skel.length >= 4 && skeleton(token).startsWith(skel)))) return true;
  }
  return false;
}

/** Does `haystack` (already normalised) satisfy every typed word, in English or another language, allowing for spelling mistakes? */
/** Common short forms and the full names people type for them (and the other way round). */
const FULL_FORMS: [string, string[]][] = [
  ["pan", ["permanent account number", "pan card"]],
  ["aadhaar", ["aadhar", "uidai", "unique identification"]],
  ["itr", ["income tax return", "income tax"]],
  ["dl", ["driving licence", "driving license"]],
  ["gst", ["goods and services tax"]],
  ["epic", ["voter id", "election photo identity"]],
  ["cctv", ["closed circuit camera", "camera"]],
  ["kyc", ["know your customer"]],
  ["abha", ["ayushman bharat health account"]],
  ["lpg", ["gas cylinder", "gas"]],
  ["msme", ["udyam"]],
  ["dmt", ["money transfer"]],
  ["aeps", ["cash withdrawal", "banking"]],
];

/** Adds the full names for any short form found in `text`, so "PAN" also matches "permanent account number". */
export function expandFullForms(text: string): string {
  let out = text;
  for (const [short, longs] of FULL_FORMS) if (new RegExp(`(^| )${short}( |$)`).test(text)) out += ` ${longs.join(" ")}`;
  return out;
}

const ALIAS_STOP = new Set(["and", "of", "in", "the", "a", "for", "to", "near", "with", "on"]);

/**
 * Short forms worked out from a service title, for any service: the first letters of its words
 * ("Driving Licence" → "dl") and the consonant shape of each word ("PAN" → "pn").
 */
export function searchAliases(title: string): string {
  const words = normaliseSearch(title).split(" ").filter((word) => word && !ALIAS_STOP.has(word));
  const out = new Set<string>();
  if (words.length >= 2) out.add(words.map((word) => word[0]).join(""));
  for (const word of words) if (word.length >= 3 && /^[a-z]+$/.test(word)) { const shape = skeleton(word); if (shape.length >= 2 && shape.length <= 3) out.add(shape); }
  return [...out].join(" ");
}

/** Joins typed letters with spaces ("P A N" → "pan"). */
function joinSpacedLetters(query: string): string {
  const out: string[] = [];
  let run = "";
  for (const token of query.split(" ").filter(Boolean)) {
    if (token.length === 1) { run += token; continue; }
    if (run) { out.push(run); run = ""; }
    out.push(token);
  }
  if (run) out.push(run);
  return out.join(" ");
}

/** Turns a typed full name into its short form, so "permanent account number" also searches for "pan". */
function withShortForms(query: string): string {
  const q = normaliseSearch(query);
  let out = q;
  for (const [short, longs] of FULL_FORMS) if (longs.some((long) => q.includes(long))) out += ` ${short}`;
  return out;
}

/** Filler words people put into sentences ("I need help with ..."). They are ignored when matching. */
const FILLER = new Set(("i im me my mine want wanna need needs like how what where when which who to for the a an is are am do does can could would should please plz pls help with on in at of and or get got make some any from near about give tell know apply kaise kya kaha kahan kab chahiye chahie mujhe mera meri mere hai hain ka ki ke ko se karna karein karo kar lagega lagta aur ya bhai sir banaye banao banwao banvao karwao karvao bnao bataiye batao bata dijiye kijiye kariye hoga hogi milega milegi").split(" "));

export function matchesSearch(haystack: string, query: string): boolean {
  query = withShortForms(joinSpacedLetters(normaliseSearch(query)));
  const typed = normaliseSearch(query).split(" ").filter(Boolean);
  if (!typed.length) return true;
  const words = typed.filter((word) => !FILLER.has(word));
  if (!words.length) return false;
  // Two-word local phrases ("प्रमाण पत्र", "जीवन प्रमाण") are handled by also trying the whole query.
  const whole = normaliseSearch(query);
  const phrase = expandWord(whole);
  if (phrase.length && phrase.some((term) => haystack.includes(term))) return true;
  let tokens: string[] | null = null;
  return words.every((word) => {
    const exact = word.length <= 3 ? haystack.split(" ").includes(word) : haystack.includes(word);
    if (exact || expandWord(word).some((term) => haystack.includes(term))) return true;
    tokens ??= haystack.split(" ");
    return fuzzyWordMatch(word, tokens);
  });
}

const SMALL_WORDS = new Set(["of", "in", "to", "is", "my", "me", "on", "at", "an", "by", "or", "do", "we", "up", "it", "be", "as", "if", "no", "so", "ok", "hi", "hu", "ho", "ka", "ki", "ke", "ko", "se", "me", "ek", "hai", "kya"]);

/** How many of the typed words (ignoring very short ones) match this text, allowing for typos, spaced letters and short forms. */
export function searchScore(haystack: string, query: string): number {
  // Two-letter short forms ("pn") count, but common small words ("of", "is") do not.
  const words = withShortForms(joinSpacedLetters(normaliseSearch(query))).split(" ").filter((word) => word.length >= 3 || (word.length === 2 && !SMALL_WORDS.has(word)));
  return words.reduce((total, word) => total + (matchesSearch(haystack, word) ? 1 : 0), 0);
}
