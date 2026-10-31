/**
 * Programmes and portals NiSE COMPORT helps customers use. We are a local facilitator (a CSC /
 * Pragya Kendra outlet), not these organisations. Names belong to their owners.
 *
 * To show an official logo, drop the file into public/images/partners/ named after the `slug`
 * (for example csc.png, digital-india.svg, pragya-kendra.png). It is picked up automatically;
 * until then a neutral lettered badge is shown.
 */
import { FEATURES } from "./features.ts";

export type Partner = {
  slug: string; name: string; what: string; initials: string; tone: "blue" | "violet" | "pink" | "saffron" | "green" | "cyan" | "teal" | "rose";
  href?: string;
};

export const partners: Partner[] = [
  { slug: "csc", name: "CSC", what: "Common Service Centres", initials: "CSC", tone: "blue", href: "https://csc.gov.in/" },
  { slug: "pragya-kendra", name: "Pragya Kendra", what: "Jharkhand citizen service points", initials: "PK", tone: "saffron" },
  { slug: "digital-seva", name: "Digital Seva", what: "Digital government services", initials: "DS", tone: "violet", href: "https://digitalseva.csc.gov.in/" },
  { slug: "digital-india", name: "Digital India", what: "National digital services programme", initials: "DI", tone: "cyan", href: "https://www.digitalindia.gov.in/" },
  { slug: "pan", name: "PAN card", what: "Protean (NSDL) and UTIITSL", initials: "PAN", tone: "green", href: "https://www.incometax.gov.in/" },
  { slug: "voter-id", name: "Voter ID", what: "Election Commission of India", initials: "EPIC", tone: "rose", href: "https://voters.eci.gov.in/" },
  { slug: "aadhaar", name: "Aadhaar", what: "UIDAI updates and services", initials: "UID", tone: "pink", href: "https://uidai.gov.in/" },
  { slug: "passport-seva", name: "Passport", what: "Passport Seva applications", initials: "PSP", tone: "blue", href: "https://www.passportindia.gov.in/" },
  { slug: "parivahan", name: "Driving licence", what: "Parivahan: learner, licence, RC", initials: "DL", tone: "saffron", href: "https://parivahan.gov.in/" },
  { slug: "service-plus", name: "Jharkhand certificates", what: "Income, caste and residence via ServicePlus", initials: "JH", tone: "teal", href: "https://serviceonline.gov.in/" },
  { slug: "income-tax", name: "Income Tax", what: "ITR filing and e-filing help", initials: "ITR", tone: "blue", href: "https://www.incometax.gov.in/" },
  { slug: "digilocker", name: "DigiLocker", what: "Digital documents and certificates", initials: "DGL", tone: "cyan", href: "https://www.digilocker.gov.in/" },
  { slug: "aeps", name: "AEPS and banking", what: "Aadhaar-enabled cash and transfers", initials: "AEPS", tone: "green" },
  { slug: "ayushman-ration", name: "Ayushman and ration card", what: "Health cover and food security schemes", initials: "AY", tone: "pink" },
  { slug: "udyam-fssai", name: "Udyam and FSSAI", what: "Business registration and food licence", initials: "UD", tone: "violet", href: "https://udyamregistration.gov.in/" },
  ...(FEATURES.travel ? [{ slug: "irctc", name: "Railway tickets", what: "IRCTC and travel bookings", initials: "IR", tone: "saffron" as const, href: "https://www.irctc.co.in/" }] : []),
];
