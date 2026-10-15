/**
 * Car & bike insurance knowledge used on the insurance pages, the quote/renewal form and the
 * help chat. Figures follow standard Indian motor insurance rules (IRDAI third-party tariff,
 * the motor tariff depreciation and NCB slabs); insurers confirm the exact quote.
 *
 * NISE COMPORT arranges policies and helps with claims; the insurance company issues the policy
 * and decides and pays claims. Plain module (no imports).
 */

export const FACILITATOR_NOTE = "NISE COMPORT helps you compare, buy, renew and claim. The policy is issued by the insurance company you choose, and claims are decided and paid by that insurer under its policy terms. NISE COMPORT is not the insurer and is not liable for the insurer’s decisions, but we stay with you from quote to claim settlement.";
export const SOLICITATION_NOTE = "Insurance is the subject matter of solicitation. Premiums, cover and discounts depend on the insurer’s terms; read the policy wording before buying.";

/** Insurers customers commonly ask for. Which ones we can arrange depends on our partner tie-ups; we confirm when quoting. */
export const INSURERS = [
  "ICICI Lombard", "HDFC ERGO", "Bajaj Allianz", "Tata AIG", "New India Assurance", "SBI General", "IndusInd General (formerly Reliance General)",
  "IFFCO Tokio", "Cholamandalam MS", "Go Digit", "Acko", "Navi General", "Zuno (formerly Edelweiss)", "Liberty General", "Universal Sompo",
  "Royal Sundaram", "Magma HDI", "Future Generali", "United India", "Oriental Insurance", "National Insurance", "Kotak Mahindra General",
] as const;

export const POLICY_TYPES = [
  { id: "comprehensive", name: "Comprehensive (package)", text: "Third-party liability plus damage to your own vehicle: accidents, theft, fire, floods, riots. Add-ons can be added. Best for most vehicles, and needed for vehicles on loan." },
  { id: "tp", name: "Third-party only", text: "The legal minimum under the Motor Vehicles Act, 1988. Pays for injury, death or property damage you cause to others. Does not cover your own vehicle." },
  { id: "saod", name: "Own damage only (standalone OD)", text: "Covers only your own vehicle. Useful when you already have a long-term third-party policy (common for vehicles bought after 2018/2019)." },
  { id: "long", name: "Long-term", text: "New cars come with 3-year third-party cover and new bikes with 5-year; own-damage can be 1 to 3 years with some insurers. Fewer renewals, steady premium." },
] as const;

export const COVERED = ["Accidents and collisions", "Theft of the vehicle (paid up to the IDV)", "Fire, explosion, self-ignition, lightning", "Floods, cyclones, earthquakes, landslides", "Riots, strikes, vandalism, terrorism", "Damage in transit by road, rail, water or air", "Third-party injury, death and property damage", "Owner-driver personal accident cover (up to ₹15 lakh)"];
export const NOT_COVERED = ["Normal wear and tear, mechanical or electrical breakdown", "Depreciation on parts (unless you take Zero Depreciation)", "Driving without a valid licence or under alcohol/drugs", "Using the vehicle against the policy terms (e.g. private vehicle for hire)", "Accessories fitted later that weren't declared", "Damage when the policy had expired", "Consequential loss, e.g. engine damage from driving in water (unless Engine Protect)"];

export const ADD_ONS = [
  { id: "zero-dep", name: "Zero depreciation", text: "Full value of replaced parts without depreciation cut. Best for new vehicles (up to 5 years)." },
  { id: "rsa", name: "Roadside assistance", text: "Towing, battery jump-start, flat tyre, fuel delivery, key help, 24×7." },
  { id: "engine", name: "Engine protect", text: "Engine and gearbox damage from water entry or oil leakage, which the base policy excludes." },
  { id: "consumables", name: "Consumables", text: "Engine oil, coolant, nuts, bolts, washers and similar items used in repairs." },
  { id: "ncb-protect", name: "NCB protection", text: "Keep your No Claim Bonus even after a claim (usually one claim a year)." },
  { id: "rti", name: "Return to invoice", text: "On theft or total loss, get the invoice value (plus road tax and registration) instead of the IDV." },
  { id: "key", name: "Key & lock replacement", text: "New keys and locks if keys are lost, stolen or damaged." },
  { id: "tyre", name: "Tyre protect", text: "Damage to tyres and tubes, normally covered only in an accident." },
  { id: "passenger", name: "Passenger cover", text: "Personal accident cover for passengers / pillion rider." },
  { id: "pa-owner", name: "Owner-driver PA cover", text: "Compulsory ₹15 lakh cover unless you already have one for another vehicle or a separate PA policy." },
] as const;

/** No Claim Bonus on the own-damage premium for consecutive claim-free years. */
export const NCB_SLABS = [
  { years: "1 claim-free year", discount: 20 }, { years: "2 years", discount: 25 }, { years: "3 years", discount: 35 },
  { years: "4 years", discount: 45 }, { years: "5 years or more", discount: 50 },
];

/** Depreciation used to set the IDV (vehicles up to 5 years; older ones are agreed with the insurer). */
export const IDV_DEPRECIATION = [
  { age: "Up to 6 months", percent: 5 }, { age: "6 months – 1 year", percent: 15 }, { age: "1 – 2 years", percent: 20 },
  { age: "2 – 3 years", percent: 30 }, { age: "3 – 4 years", percent: 40 }, { age: "4 – 5 years", percent: 50 },
];

/** IRDAI third-party premiums for two-wheelers (before GST). */
export const BIKE_TP_RATES = [
  { engine: "Up to 75 cc", oneYear: 538, fiveYear: 2901 }, { engine: "75 – 150 cc", oneYear: 714, fiveYear: 3851 },
  { engine: "150 – 350 cc", oneYear: 1366, fiveYear: 7365 }, { engine: "Above 350 cc", oneYear: 2804, fiveYear: 15117 },
];

export const RENEWAL_FACTS = [
  "You can renew up to 45 days before your policy ends. Renewing before expiry needs no inspection and keeps your No Claim Bonus.",
  "Once a policy expires there is no cover at all. Renewing an expired comprehensive policy usually needs a vehicle inspection (photos or a visit).",
  "If you don’t renew within 90 days of expiry, the No Claim Bonus is lost.",
  "Switching insurer at renewal is allowed: your NCB moves with you (we get the NCB confirmation from your old policy).",
  "Riding or driving without valid insurance can mean a fine of ₹2,000 (₹4,000 for a repeat offence) and/or up to 3 months in jail.",
  "At renewal you can change IDV, add or drop add-ons, or switch from third-party to comprehensive.",
];

export const PREMIUM_FACTORS = ["Policy type and add-ons", "IDV (current value of the vehicle)", "Make, model, variant and fuel", "Engine cc (decides the third-party premium)", "Age of the vehicle and city of registration", "No Claim Bonus and claim history", "Voluntary deductible and approved anti-theft device discounts"];

export const DOCUMENTS = {
  new: ["Sale invoice (for a brand-new vehicle) or RC", "Owner’s PAN (or Form 60) and Aadhaar for KYC", "Mobile number and email for the policy", "Engine and chassis number (from RC or invoice)"],
  renew: ["Registration certificate (RC)", "Previous policy copy (for NCB and policy number)", "PAN and Aadhaar for KYC", "Valid PUC certificate"],
  claim: ["Policy copy and RC", "Driving licence of the person driving", "Filled claim form with cancelled cheque / bank details (we fill it with you)", "Photos of the damage", "FIR for theft, third-party injury or major damage", "Repair estimate and final bills (for reimbursement)", "Loan NOC / Form 28-29-30 for theft or total loss, if asked"],
};

export const CLAIM_STEPS = [
  "Tell the insurer as soon as possible (we help you register the claim and note the claim number).",
  "Don’t move a badly damaged vehicle before photos or the surveyor’s visit; for theft, file an FIR at once.",
  "Cashless: take the vehicle to the insurer’s network garage; the insurer pays the garage and you pay only deductibles and items not covered.",
  "Reimbursement: repair at any garage, pay the bill, then submit bills for repayment.",
  "Survey / video inspection by the insurer, documents submitted, approval and settlement.",
];

export const REJECTION_REASONS = ["No valid driving licence", "Driving under alcohol or drugs", "Policy had expired", "Wrong or hidden information", "Wear and tear or mechanical failure", "Private vehicle used commercially", "Late intimation or moving the vehicle before the survey"];

// ------------------------------------------------------------------ quote / renewal form

export type InsurancePurpose = "new" | "renew" | "expired" | "claim";
export type InsuranceForm = {
  purpose: InsurancePurpose; vehicle: "bike" | "car";
  regNo?: string; make?: string; model?: string; fuel?: string; year?: string; city?: string;
  prevInsurer?: string; prevType?: string; expiry?: string; claimedLastYear?: "yes" | "no" | "unsure"; ncb?: string; policyNo?: string;
  cover?: string; term?: string; addOns?: string[]; loan?: "yes" | "no";
  incidentDate?: string; incident?: string; incidentNote?: string; fir?: "yes" | "no" | "na";
  name: string; phone: string; whatsapp?: string; email?: string; callTime?: string; note?: string;
};

export const PURPOSES: Record<InsurancePurpose, string> = { new: "New vehicle / new policy", renew: "Renew before expiry", expired: "Policy already expired", claim: "Help with a claim" };
export const COVER_CHOICES: Record<string, string> = { comprehensive: "Comprehensive", tp: "Third-party only", saod: "Own damage only", unsure: "Not sure — advise me" };
export const FUELS = ["Petrol", "Diesel", "CNG", "Electric", "Hybrid"];
export const INCIDENTS = ["Accident", "Theft", "Fire", "Flood / water", "Glass / minor damage", "Third-party injury or damage", "Other"];

const clip = (value: unknown, max: number) => typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "";
const day = (value: unknown) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";

/** Cleans the form; returns problems by field (empty object = fine). */
export function checkInsuranceForm(raw: Record<string, unknown>): { form: InsuranceForm; problems: Record<string, string> } {
  const purpose = (["new", "renew", "expired", "claim"] as const).find((item) => item === raw.purpose) ?? "renew";
  const vehicle = raw.vehicle === "car" ? "car" : "bike";
  const regNo = clip(raw.regNo, 14).toUpperCase().replace(/[^A-Z0-9]/g, "");
  const form: InsuranceForm = {
    purpose, vehicle, regNo, make: clip(raw.make, 40), model: clip(raw.model, 60), fuel: FUELS.includes(clip(raw.fuel, 12)) ? clip(raw.fuel, 12) : "",
    year: /^(19[89]\d|20\d\d)$/.test(clip(raw.year, 4)) ? clip(raw.year, 4) : "", city: clip(raw.city, 40),
    prevInsurer: clip(raw.prevInsurer, 60), prevType: clip(raw.prevType, 20), expiry: day(raw.expiry),
    claimedLastYear: raw.claimedLastYear === "yes" || raw.claimedLastYear === "no" ? raw.claimedLastYear : "unsure",
    ncb: ["0", "20", "25", "35", "45", "50"].includes(clip(raw.ncb, 3)) ? clip(raw.ncb, 3) : "", policyNo: clip(raw.policyNo, 40),
    cover: clip(raw.cover, 20) in COVER_CHOICES ? clip(raw.cover, 20) : "unsure", term: clip(raw.term, 20),
    addOns: Array.isArray(raw.addOns) ? raw.addOns.filter((item): item is string => typeof item === "string" && ADD_ONS.some((addOn) => addOn.id === item)) : [],
    loan: raw.loan === "yes" ? "yes" : "no",
    incidentDate: day(raw.incidentDate), incident: INCIDENTS.includes(clip(raw.incident, 40)) ? clip(raw.incident, 40) : "", incidentNote: clip(raw.incidentNote, 600),
    fir: raw.fir === "yes" || raw.fir === "no" ? raw.fir : "na",
    name: clip(raw.name, 80), phone: clip(raw.phone, 20), whatsapp: clip(raw.whatsapp, 20), email: clip(raw.email, 120).toLowerCase(), callTime: clip(raw.callTime, 40), note: clip(raw.note, 600),
  };
  const problems: Record<string, string> = {};
  if (form.name.length < 2) problems.name = "Enter your name.";
  if (!/^(\+?91[\s-]?|0)?[6-9]\d{4}[\s-]?\d{5}$/.test(form.phone)) problems.phone = "Enter a 10-digit mobile number.";
  if (form.whatsapp && !/^(\+?91[\s-]?|0)?[6-9]\d{4}[\s-]?\d{5}$/.test(form.whatsapp)) problems.whatsapp = "Check the WhatsApp number.";
  if (form.email && !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(form.email)) problems.email = "Check the email.";
  if (purpose !== "new" && form.regNo && !/^[A-Z]{2}\d{1,2}[A-Z]{0,3}\d{1,4}$/.test(form.regNo) && !/^\d{2}BH\d{4}[A-Z]{1,2}$/.test(form.regNo)) problems.regNo = "Use the number plate format, e.g. JH05AB1234.";
  if (purpose !== "new" && !form.regNo) problems.regNo = "Enter the vehicle number.";
  if (purpose === "new" && !form.make && !form.model) problems.model = "Tell us the vehicle make and model.";
  if (purpose === "claim" && !form.incident) problems.incident = "Choose what happened.";
  return { form, problems };
}

/** Plain-text summary for staff (request note, lead message, email alert). */
export function summariseInsurance(form: InsuranceForm) {
  const vehicle = form.vehicle === "car" ? "Car" : "Bike";
  const lines = [
    `${PURPOSES[form.purpose]} · ${vehicle}${form.regNo ? ` ${form.regNo}` : ""}${form.make || form.model ? ` · ${[form.make, form.model].filter(Boolean).join(" ")}` : ""}${form.fuel ? ` · ${form.fuel}` : ""}${form.year ? ` · ${form.year}` : ""}${form.city ? ` · ${form.city}` : ""}`,
  ];
  if (form.purpose !== "new") lines.push(`Current policy: ${form.prevInsurer || "insurer not given"}${form.prevType ? ` (${form.prevType})` : ""}${form.expiry ? ` · ends ${form.expiry}` : ""}${form.policyNo ? ` · no. ${form.policyNo}` : ""} · claimed last year: ${form.claimedLastYear}${form.ncb ? ` · NCB ${form.ncb}%` : ""}`);
  if (form.purpose !== "claim") lines.push(`Wants: ${COVER_CHOICES[form.cover ?? "unsure"]}${form.term ? ` · ${form.term}` : ""}${form.addOns?.length ? ` · add-ons: ${form.addOns.map((id) => ADD_ONS.find((addOn) => addOn.id === id)?.name ?? id).join(", ")}` : ""}${form.loan === "yes" ? " · vehicle on loan" : ""}`);
  if (form.purpose === "claim") lines.push(`Claim: ${form.incident}${form.incidentDate ? ` on ${form.incidentDate}` : ""} · FIR: ${form.fir}${form.incidentNote ? ` · ${form.incidentNote}` : ""}`);
  lines.push(`Contact: ${form.name} · ${form.phone}${form.whatsapp ? ` · WhatsApp ${form.whatsapp}` : ""}${form.email ? ` · ${form.email}` : ""}${form.callTime ? ` · call ${form.callTime}` : ""}`);
  if (form.note) lines.push(`Note: ${form.note}`);
  return lines;
}

/** The renewal date to remember for reminders: the current policy's end date. */
export function renewalDate(form: InsuranceForm) {
  return form.purpose === "renew" && form.expiry ? form.expiry : null;
}
