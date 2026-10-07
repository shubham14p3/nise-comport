/**
 * What a gallery photo can be about: a service (it also shows on that service's page), a festival
 * or day, or something about the shop. Used by the website, the admin gallery and `npm run photos`
 * (photo-inbox/<tag>/). No imports so the photo script can use it.
 */
export type GalleryGroup = "service" | "festival" | "shop";

export const SERVICE_TAGS: Record<string, string> = {
  "pan-card": "PAN card", aadhaar: "Aadhaar", "income-caste-residence-certificate": "Income, caste & residence certificate",
  "voter-id": "Voter ID", "passport-driving-licence": "Passport & driving licence", "aeps-money-transfer": "AEPS & money transfer",
  "bike-insurance": "Bike insurance", "car-insurance": "Car insurance", "health-life-insurance": "Health & life insurance",
  "scholarship-forms": "Scholarship forms", "exam-forms": "Exam & job forms", "bill-payment-recharge": "Bill payment & recharge",
  "itr-gst": "ITR & GST", "printing-scanning": "Printing, lamination & gifts", "computer-repair": "Computer & laptop repair",
  "website-design": "Website & WhatsApp marketing", "ticket-booking": "Ticket booking", "lic-policy": "LIC policy service",
  "mutual-fund-sip": "SIP & mutual fund", "rent-agreement": "Rent agreement & e-stamp", "fssai-license": "FSSAI licence",
  "udyam-registration": "Udyam registration", "jeevan-pramaan": "Jeevan Pramaan", "birth-death-certificate": "Birth & death certificate",
  "land-mutation": "Land mutation", "aadhaar-pvc-card": "Aadhaar PVC card", "bank-account-opening": "Bank account opening",
  "ayushman-card": "Ayushman card", "ration-card": "Ration card", "abua-awas-yojana": "Abua Awas Yojana",
};

/** Festivals and national days (photo-inbox/<slug>/). */
export const FESTIVAL_TAGS: Record<string, string> = {
  "independence-day": "Independence Day", "republic-day": "Republic Day", "gandhi-jayanti": "Gandhi Jayanti",
  diwali: "Diwali", dhanteras: "Dhanteras", "chhath-puja": "Chhath Puja", holi: "Holi", "durga-puja": "Durga Puja",
  navratri: "Navratri", dussehra: "Dussehra", "ganesh-puja": "Ganesh Puja", "saraswati-puja": "Saraswati Puja",
  "lakshmi-puja": "Lakshmi Puja", "kali-puja": "Kali Puja", "raksha-bandhan": "Raksha Bandhan", janmashtami: "Janmashtami",
  "ram-navami": "Ram Navami", "makar-sankranti": "Makar Sankranti", "karma-puja": "Karma Puja", sarhul: "Sarhul",
  "jharkhand-foundation-day": "Jharkhand Foundation Day", eid: "Eid", christmas: "Christmas", "new-year": "New Year",
  "bhai-dooj": "Bhai Dooj", "teej": "Teej", "karwa-chauth": "Karwa Chauth", "guru-nanak-jayanti": "Guru Nanak Jayanti",
};

/** About the shop itself. "shop" is also where unsorted photos go. */
export const SHOP_TAGS: Record<string, string> = {
  shop: "Our centre", team: "Our team", camps: "Camps & events", training: "Computer training",
};

export function tagGroup(tag: string): GalleryGroup {
  if (SERVICE_TAGS[tag]) return "service";
  if (FESTIVAL_TAGS[tag]) return "festival";
  return "shop";
}

export function tagLabel(tag: string) {
  return SERVICE_TAGS[tag] ?? FESTIVAL_TAGS[tag] ?? SHOP_TAGS[tag] ?? SHOP_TAGS.shop;
}

export function isGalleryTag(tag: string) {
  return Boolean(SERVICE_TAGS[tag] || FESTIVAL_TAGS[tag] || SHOP_TAGS[tag]);
}

/** Title and alt text written from the tag (both can be edited afterwards). */
export function describePhoto(tag: string, number: number) {
  const label = tagLabel(tag);
  const place = "NISE COMPORT Pragya Kendra, Kharangajhar, Telco, Jamshedpur";
  if (FESTIVAL_TAGS[tag]) return { title: `${label} wishes from NISE COMPORT`, alt: `${label} greetings from ${place} (${number})` };
  if (SERVICE_TAGS[tag]) return { title: `${label} at NISE COMPORT`, alt: `${label} help at ${place} (photo ${number})` };
  if (tag === "team") return { title: "The NISE COMPORT team", alt: `Our team at ${place} (photo ${number})` };
  if (tag === "camps") return { title: "Service camp by NISE COMPORT", alt: `Government service camp run by ${place} (photo ${number})` };
  if (tag === "training") return { title: "Computer training at NISE COMPORT", alt: `Computer training class at ${place} (photo ${number})` };
  return { title: "NISE COMPORT, Kharangajhar, Telco", alt: `${place} (photo ${number})` };
}

/** Name used in the photo's web address, e.g. "diwali-nise-comport-telco-jamshedpur-3.webp". */
export function photoFileBase(tag: string) {
  return tag === "shop" ? "nise-comport-pragya-kendra-telco-jamshedpur" : FESTIVAL_TAGS[tag] ? `${tag}-nise-comport-telco-jamshedpur` : `${tag}-telco-jamshedpur`;
}
