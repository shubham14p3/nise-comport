import { z } from "zod";

export const panServices = ["new", "correction", "reprint", "minor", "minor-to-major", "marriage", "business", "surrender"] as const;
export const panServiceLabels: Record<typeof panServices[number], string> = {
  new: "New PAN", correction: "Correction or update", reprint: "Lost / damaged card reprint", minor: "PAN for a minor",
  "minor-to-major": "Minor to adult update", marriage: "Name change after marriage", business: "Business / entity PAN", surrender: "Duplicate PAN surrender guidance",
};
export function validPastDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value && value <= new Date().toISOString().slice(0, 10) && value >= "1900-01-01";
}
export function ageOnDate(value: string, today = new Date().toISOString().slice(0, 10)) {
  const [year, month, day] = value.split("-").map(Number);
  const [y, m, d] = today.split("-").map(Number);
  return y - year - (m < month || (m === month && d < day) ? 1 : 0);
}
export const panFormat = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
export const panIntakeSchema = z.object({
  service: z.enum(panServices), citizenship: z.enum(["indian", "foreign"]), applicant: z.enum(["individual", "entity"]),
  residency: z.enum(["india", "overseas"]), existingPan: z.enum(["yes", "no", "unsure"]),
  fullName: z.string().trim().min(2, "Enter the applicant's full name.").max(120),
  birthDate: z.string().refine(validPastDate, "Enter a real date that is not in the future."),
  contactName: z.string().trim().min(2, "Enter the contact person's name.").max(100),
  email: z.email("Enter a valid contact email."),
  phone: z.string().trim().regex(/^\+?[1-9][0-9]{7,14}$/, "Use 8–15 digits with an optional leading +; no spaces."),
  address: z.string().trim().min(5, "Enter a complete communication address.").max(250),
  city: z.string().trim().min(2).max(100), state: z.string().trim().min(2).max(100),
  country: z.string().trim().min(2).max(80), postalCode: z.string().trim().min(2).max(15),
  representative: z.string().trim().max(120).default(""),
  entityType: z.enum(["", "huf", "firm", "llp", "company", "trust", "society", "association", "other"]).default(""),
  corrections: z.array(z.enum(["name", "birth-date", "parent-name", "photo", "signature", "address", "contact"])).max(7).default([]),
  documentPlan: z.array(z.enum(["identity", "address", "birth", "existing-pan", "change-proof", "entity-proof", "representative"])).max(7).default([]),
  notes: z.string().trim().max(1500).default(""),
  consent: z.boolean().refine(Boolean, "Confirm the information and consent before submitting."),
  fileId: z.uuid().optional(),
}).superRefine((input, ctx) => {
  const fail = (path: string, message: string) => ctx.addIssue({ code: "custom", path: [path], message });
  if (["new", "minor", "business"].includes(input.service) && input.existingPan !== "no") fail("existingPan", "Confirm no PAN is already allotted. If unsure, check your records before requesting a new PAN.");
  if (!["new", "minor", "business"].includes(input.service) && input.existingPan !== "yes") fail("existingPan", "This route is for an existing PAN. Choose a new-PAN route only when none is allotted.");
  if (input.residency === "india" && !/^[1-9][0-9]{5}$/.test(input.postalCode)) fail("postalCode", "Enter a valid 6-digit Indian PIN code.");
  if (input.residency === "india" && input.country.toLowerCase() !== "india") fail("country", "For an Indian address, use India as the country.");
  if (input.service === "business" && input.applicant !== "entity") fail("applicant", "Choose a non-individual entity for a business PAN.");
  if (["minor", "minor-to-major", "marriage"].includes(input.service) && input.applicant !== "individual") fail("applicant", "This route is for individuals.");
  if (input.applicant === "entity" && !input.entityType) fail("entityType", "Select the entity type.");
  if (input.applicant === "entity" && !input.representative) fail("representative", "Enter the authorised representative's name.");
  if (validPastDate(input.birthDate) && input.applicant === "individual") {
    const age = ageOnDate(input.birthDate);
    if (input.service === "minor" && age >= 18) fail("birthDate", "The minor route is for applicants below 18.");
    if (input.service === "new" && age < 18) fail("service", "Choose PAN for a minor for an applicant below 18.");
    if (input.service === "minor-to-major" && age < 18) fail("birthDate", "The minor-to-adult route requires age 18 or above.");
    if (age < 18 && !input.representative) fail("representative", "Enter the parent or guardian's name for a minor.");
  }
  if (["correction", "marriage", "minor-to-major"].includes(input.service) && !input.corrections.length) fail("corrections", "Choose at least one detail to update.");
});
export type PanIntake = z.infer<typeof panIntakeSchema>;
export function panFormFor(input: Pick<PanIntake, "applicant" | "citizenship">) {
  return input.citizenship === "indian" ? input.applicant === "individual" ? "Form 93" : "Form 94" : input.applicant === "individual" ? "Form 95" : "Form 96";
}
export function validateTracking(provider: string, reference: string) {
  if (provider === "protean") return /^\d{15}$/.test(reference.trim()) ? "" : "Enter the 15 numeric digits from the Protean acknowledgement, without N-.";
  if (provider === "uti") return /^[A-Za-z0-9/-]{5,30}$/.test(reference.trim()) ? "" : "Enter the coupon reference exactly as printed (5–30 letters, digits, / or -). The official portal confirms acceptance.";
  return "Choose UTIITSL or Protean.";
}
