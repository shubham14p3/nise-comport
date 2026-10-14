/**
 * Visual and short-label metadata for the service categories in src/lib/services.ts.
 * Used by the home page tiles, the services browser, the request flow and the chat assistant.
 * No imports so it can be unit-tested with plain Node.
 */
export type Tone = "blue" | "violet" | "pink" | "saffron" | "green" | "cyan" | "teal" | "rose";

export type CategoryMeta = {
  slug: string;
  icon: "landmark" | "banknote" | "shield" | "graduation" | "receipt" | "file" | "printer" | "plane" | "cpu" | "camera";
  tone: Tone;
  short: { en: string; hi: string; bn: string };
  /** One catchy line for tiles. */
  line: { en: string; hi: string; bn: string };
  /** Popular searches shown as chips. */
  popular: string[];
};

export const categoryMeta: CategoryMeta[] = [
  { slug: "government-services", icon: "landmark", tone: "blue", short: { en: "Govt. services", hi: "सरकारी सेवाएँ", bn: "সরকারি পরিষেবা" }, line: { en: "PAN, Aadhaar help, certificates, voter ID", hi: "पैन, आधार मदद, प्रमाण पत्र, वोटर आईडी", bn: "প্যান, আধার সাহায্য, সার্টিফিকেট, ভোটার আইডি" }, popular: ["PAN card", "Income certificate", "Voter ID"] },
  { slug: "banking", icon: "banknote", tone: "green", short: { en: "Banking & AEPS", hi: "बैंकिंग व AEPS", bn: "ব্যাংকিং ও AEPS" }, line: { en: "Cash withdrawal, transfers, new account", hi: "नकद निकासी, ट्रांसफ़र, नया खाता", bn: "নগদ তোলা, টাকা পাঠানো, নতুন অ্যাকাউন্ট" }, popular: ["AEPS", "Money transfer", "Account opening"] },
  { slug: "insurance", icon: "shield", tone: "pink", short: { en: "Insurance", hi: "बीमा", bn: "বিমা" }, line: { en: "Bike, car, health & life cover", hi: "बाइक, कार, हेल्थ और लाइफ़", bn: "বাইক, গাড়ি, হেলথ ও লাইফ" }, popular: ["Bike insurance", "Car renewal", "Health cover"] },
  { slug: "education", icon: "graduation", tone: "violet", short: { en: "Students & exams", hi: "छात्र व परीक्षा", bn: "ছাত্র ও পরীক্ষা" }, line: { en: "Exam, job, scholarship & admission forms", hi: "परीक्षा, नौकरी, स्कॉलरशिप, एडमिशन फ़ॉर्म", bn: "পরীক্ষা, চাকরি, স্কলারশিপ ও ভর্তির ফর্ম" }, popular: ["Exam form", "Scholarship", "Admission"] },
  { slug: "fee-payments", icon: "receipt", tone: "saffron", short: { en: "Bills & recharge", hi: "बिल व रिचार्ज", bn: "বিল ও রিচার্জ" }, line: { en: "Electricity, mobile, DTH & fees", hi: "बिजली, मोबाइल, DTH और फ़ीस", bn: "বিদ্যুৎ, মোবাইল, DTH ও ফি" }, popular: ["Electricity bill", "Recharge", "School fee"] },
  { slug: "form-filing", icon: "file", tone: "teal", short: { en: "Forms & business", hi: "फ़ॉर्म व व्यवसाय", bn: "ফর্ম ও ব্যবসা" }, line: { en: "ITR, GST, Udyam, FSSAI, rent agreement", hi: "ITR, GST, उद्यम, FSSAI, किराया अनुबंध", bn: "ITR, GST, উদ্যম, FSSAI, ভাড়া চুক্তি" }, popular: ["ITR help", "Udyam", "FSSAI"] },
  { slug: "it-services", icon: "printer", tone: "cyan", short: { en: "Print & digital", hi: "प्रिंट व डिजिटल", bn: "প্রিন্ট ও ডিজিটাল" }, line: { en: "Print, scan, computer & CCTV help", hi: "प्रिंट, स्कैन, कंप्यूटर व CCTV", bn: "প্রিন্ট, স্ক্যান, কম্পিউটার ও CCTV" }, popular: ["Print from phone", "Scan", "Computer repair"] },
  { slug: "travel", icon: "plane", tone: "rose", short: { en: "Travel tickets", hi: "यात्रा टिकट", bn: "যাত্রার টিকিট" }, line: { en: "Train, bus, flight & hotel booking help", hi: "ट्रेन, बस, फ़्लाइट और होटल बुकिंग", bn: "ট্রেন, বাস, ফ্লাইট ও হোটেল বুকিং" }, popular: ["Train ticket", "Flight", "Bus"] },
  { slug: "hardware", icon: "cpu", tone: "blue", short: { en: "Hardware & PC", hi: "हार्डवेयर व PC", bn: "হার্ডওয়্যার ও PC" }, line: { en: "Laptop & PC repair, PC builds, parts at latest price", hi: "लैपटॉप व PC मरम्मत, PC बिल्ड, ताज़ा कीमत पर पार्ट्स", bn: "ল্যাপটপ ও PC মেরামত, PC বিল্ড, সর্বশেষ দামে পার্টস" }, popular: ["Laptop repair", "PC build quote", "RAM price", "Printer repair"] },
  { slug: "extra-services", icon: "camera", tone: "pink", short: { en: "Print, design & more", hi: "प्रिंट, डिज़ाइन व अन्य", bn: "প্রিন্ট, ডিজাইন ও অন্য" }, line: { en: "Printing, CorelDRAW design, websites, photo studio", hi: "प्रिंटिंग, CorelDRAW डिज़ाइन, वेबसाइट, फोटो स्टूडियो", bn: "প্রিন্টিং, CorelDRAW ডিজাইন, ওয়েবসাইট, ফটো স্টুডিও" }, popular: ["Banner design", "Poster design", "Website creation", "A4 print"] },
];

export function categoryMetaFor(slug: string | null | undefined) {
  return categoryMeta.find((item) => item.slug === slug);
}
