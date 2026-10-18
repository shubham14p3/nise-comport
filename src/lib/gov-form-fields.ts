/**
 * Real field lists for the Jharkhand / ECI government forms we help customers fill.
 * Kept as plain data (not tied to any UI) so staff — or a future "fill this application"
 * screen — can read exactly what to ask the customer, in the same order as the official form.
 *
 * Source: the actual forms on serviceonline.gov.in (Jharkhand ServicePlus) and
 * voters.eci.gov.in (ECI Form 6 / 6A / 8), scoped to Jamshedpur, Jharkhand.
 */

export type GovFormFieldType = "text" | "date" | "select" | "radio" | "file" | "textarea" | "number";

export type GovFormField = {
  /** Short machine key, e.g. "applicantName". */
  id: string;
  /** Label exactly as it appears on the official form. */
  label: string;
  type: GovFormFieldType;
  required?: boolean;
  /** For select/radio fields. */
  options?: string[];
  /** Helper text for staff collecting this from the customer. */
  hint?: string;
  /** Simple validation, checked by validateField()/validateForm() below. */
  validate?: {
    /** Regex the value must match (as a string, e.g. "^[0-9]{10}$"). */
    pattern?: string;
    /** Shown to staff when the pattern fails. */
    message?: string;
    minLength?: number;
    maxLength?: number;
    /** For type: "number". */
    min?: number;
    max?: number;
    /** For type: "date" — disallow a date after today (e.g. Date of Birth). */
    notFuture?: boolean;
  };
};

/** A few common Indian-ID patterns, reused across fields below. */
const PATTERNS = {
  aadhaar: { pattern: "^[0-9]{12}$", message: "Aadhaar number must be exactly 12 digits." },
  mobile: { pattern: "^[6-9][0-9]{9}$", message: "Mobile number must be 10 digits, starting 6-9." },
  pin: { pattern: "^[0-9]{6}$", message: "PIN code must be 6 digits." },
  epic: { pattern: "^[A-Z]{3}[0-9]{7}$", message: "EPIC number is usually 3 letters followed by 7 digits (e.g. ABC1234567)." },
  email: { pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$", message: "Enter a valid email address." },
};

export type GovForm = {
  /** Matches a slug in src/lib/services.ts where this form applies. */
  serviceSlug: string;
  /** Official form name/number, e.g. "Form 6" or "Income Certificate Application". */
  formName: string;
  portal: "serviceonline.gov.in" | "voters.eci.gov.in";
  fields: GovFormField[];
};

const commonJharkhandCertificateTail: GovFormField[] = [
  { id: "mobile", label: "Mobile Number", type: "text", required: true },
  { id: "email", label: "Email Id", type: "text" },
  { id: "photo", label: "Applicant's Photograph", type: "file", required: true },
];

const rawGovForms: GovForm[] = [
  {
    serviceSlug: "income-caste-residence-certificate",
    formName: "Income Certificate Application",
    portal: "serviceonline.gov.in",
    fields: [
      { id: "applicantName", label: "Applicant's Name", type: "text", required: true },
      { id: "fatherHusbandName", label: "Father's / Husband's Name", type: "text", required: true },
      { id: "dob", label: "Date of Birth", type: "date", required: true },
      { id: "gender", label: "Gender", type: "radio", options: ["Male", "Female", "Third Gender"], required: true },
      { id: "aadhaar", label: "Aadhaar Number", type: "text", required: true },
      { id: "address", label: "Present Address (House No., Street, Village/Town, Post Office, PIN)", type: "textarea", required: true },
      { id: "district", label: "District", type: "select", options: ["East Singhbhum", "Other Jharkhand district"], required: true },
      { id: "block", label: "Block / Circle", type: "text", required: true },
      { id: "incomeSource", label: "Source of Income", type: "select", options: ["Salary", "Business", "Agriculture", "Daily wage / labour", "Other"], required: true },
      { id: "annualIncome", label: "Annual Family Income (₹)", type: "number", required: true },
      { id: "purpose", label: "Purpose of Certificate", type: "select", options: ["Scholarship", "EWS/reservation", "Ration card", "Caste certificate support", "Other"] },
      ...commonJharkhandCertificateTail,
    ],
  },
  {
    serviceSlug: "local-resident-certificate",
    formName: "Local Resident (Residential) Certificate Application",
    portal: "serviceonline.gov.in",
    fields: [
      { id: "applicantName", label: "Applicant's Name", type: "text", required: true },
      { id: "fatherHusbandName", label: "Father's / Husband's Name", type: "text", required: true },
      { id: "dob", label: "Date of Birth", type: "date", required: true },
      { id: "gender", label: "Gender", type: "radio", options: ["Male", "Female", "Third Gender"], required: true },
      { id: "aadhaar", label: "Aadhaar Number", type: "text", required: true },
      { id: "address", label: "Present Address (House No., Street, Village/Town, Post Office, PIN)", type: "textarea", required: true },
      { id: "district", label: "District", type: "select", options: ["East Singhbhum", "Other Jharkhand district"], required: true },
      { id: "block", label: "Block / Circle", type: "text", required: true },
      { id: "residingSince", label: "Residing at this Address Since (month/year)", type: "text", required: true },
      { id: "purpose", label: "Purpose of Certificate", type: "select", options: ["School/college admission", "Ration card", "Housing scheme", "Other"] },
      { id: "witness1", label: "Local Witness 1 — Name & Address", type: "text" },
      { id: "witness2", label: "Local Witness 2 — Name & Address", type: "text" },
      ...commonJharkhandCertificateTail,
    ],
  },
  {
    serviceSlug: "caste-certificate-ebc1-bc2",
    formName: "EBC-I / BC-II (OBC Non-Creamy Layer) Caste Certificate Application",
    portal: "serviceonline.gov.in",
    fields: [
      { id: "applicantName", label: "Applicant's Name", type: "text", required: true },
      { id: "fatherHusbandName", label: "Father's / Husband's Name", type: "text", required: true },
      { id: "dob", label: "Date of Birth", type: "date", required: true },
      { id: "gender", label: "Gender", type: "radio", options: ["Male", "Female", "Third Gender"], required: true },
      { id: "aadhaar", label: "Aadhaar Number", type: "text", required: true },
      { id: "caste", label: "Caste / Community Name", type: "text", required: true },
      { id: "category", label: "Category", type: "radio", options: ["EBC-I", "BC-II"], required: true },
      { id: "address", label: "Present Address (House No., Street, Village/Town, Post Office, PIN)", type: "textarea", required: true },
      { id: "district", label: "District", type: "select", options: ["East Singhbhum", "Other Jharkhand district"], required: true },
      { id: "fatherCasteCertNo", label: "Father's Existing Caste Certificate No. (if any)", type: "text" },
      { id: "annualIncome", label: "Annual Family Income (₹) — for non-creamy-layer check", type: "number", required: true },
      { id: "purpose", label: "Purpose of Certificate", type: "select", options: ["School/college admission", "Job application", "Reservation benefit", "Other"] },
      ...commonJharkhandCertificateTail,
    ],
  },
  {
    serviceSlug: "caste-certificate-sc",
    formName: "SC (Scheduled Caste) Certificate Application",
    portal: "serviceonline.gov.in",
    fields: [
      { id: "applicantName", label: "Applicant's Name", type: "text", required: true },
      { id: "fatherHusbandName", label: "Father's / Husband's Name", type: "text", required: true },
      { id: "dob", label: "Date of Birth", type: "date", required: true },
      { id: "gender", label: "Gender", type: "radio", options: ["Male", "Female", "Third Gender"], required: true },
      { id: "aadhaar", label: "Aadhaar Number", type: "text", required: true },
      { id: "caste", label: "Caste Name", type: "text", required: true },
      { id: "address", label: "Present Address (House No., Street, Village/Town, Post Office, PIN)", type: "textarea", required: true },
      { id: "district", label: "District", type: "select", options: ["East Singhbhum", "Other Jharkhand district"], required: true },
      { id: "fatherCasteCertNo", label: "Father's Existing SC Certificate No. (if any)", type: "text" },
      { id: "witness1", label: "Local Witness 1 — Name & Address", type: "text" },
      { id: "witness2", label: "Local Witness 2 — Name & Address", type: "text" },
      { id: "purpose", label: "Purpose of Certificate", type: "select", options: ["School/college admission", "Job application", "Scholarship", "Other"] },
      ...commonJharkhandCertificateTail,
    ],
  },
  {
    serviceSlug: "caste-certificate-st",
    formName: "ST (Scheduled Tribe) Certificate Application",
    portal: "serviceonline.gov.in",
    fields: [
      { id: "applicantName", label: "Applicant's Name", type: "text", required: true },
      { id: "fatherHusbandName", label: "Father's / Husband's Name", type: "text", required: true },
      { id: "dob", label: "Date of Birth", type: "date", required: true },
      { id: "gender", label: "Gender", type: "radio", options: ["Male", "Female", "Third Gender"], required: true },
      { id: "aadhaar", label: "Aadhaar Number", type: "text", required: true },
      { id: "tribe", label: "Tribe Name", type: "text", required: true },
      { id: "address", label: "Present Address (House No., Street, Village/Town, Post Office, PIN)", type: "textarea", required: true },
      { id: "ancestralVillage", label: "Ancestral Village / Area in Jharkhand", type: "text", required: true },
      { id: "district", label: "District", type: "select", options: ["East Singhbhum", "Other Jharkhand district"], required: true },
      { id: "fatherCasteCertNo", label: "Father's Existing ST Certificate No. (if any)", type: "text" },
      { id: "villageHeadSupport", label: "Gram Pradhan / Munda / Manki Support Letter (if obtained)", type: "file" },
      { id: "purpose", label: "Purpose of Certificate", type: "select", options: ["School/college admission", "Job application", "Scholarship", "Other"] },
      ...commonJharkhandCertificateTail,
    ],
  },
  {
    serviceSlug: "marriage-registration-certificate",
    formName: "Marriage Registration Application",
    portal: "serviceonline.gov.in",
    fields: [
      { id: "husbandName", label: "Husband's Name", type: "text", required: true },
      { id: "husbandDob", label: "Husband's Date of Birth", type: "date", required: true },
      { id: "husbandAadhaar", label: "Husband's Aadhaar Number", type: "text", required: true },
      { id: "wifeName", label: "Wife's Name", type: "text", required: true },
      { id: "wifeDob", label: "Wife's Date of Birth", type: "date", required: true },
      { id: "wifeAadhaar", label: "Wife's Aadhaar Number", type: "text", required: true },
      { id: "marriageDate", label: "Date of Marriage", type: "date", required: true },
      { id: "marriagePlace", label: "Place of Marriage", type: "text", required: true },
      { id: "address", label: "Present Address (joint, House No., Street, Village/Town, Post Office, PIN)", type: "textarea", required: true },
      { id: "maritalStatusHusband", label: "Husband's Marital Status Before this Marriage", type: "select", options: ["Unmarried", "Divorced", "Widower"], required: true },
      { id: "maritalStatusWife", label: "Wife's Marital Status Before this Marriage", type: "select", options: ["Unmarried", "Divorced", "Widow"], required: true },
      { id: "witness1", label: "Witness 1 — Name, Address & ID Proof", type: "text", required: true },
      { id: "witness2", label: "Witness 2 — Name, Address & ID Proof", type: "text", required: true },
      { id: "jointPhoto", label: "Joint Passport-size Photograph", type: "file", required: true },
      { id: "invitationOrPhotos", label: "Marriage Invitation Card / Ceremony Photographs", type: "file" },
      ...commonJharkhandCertificateTail,
    ],
  },
  {
    serviceSlug: "voter-id",
    formName: "Form 6 — Application for New Voter Registration",
    portal: "voters.eci.gov.in",
    fields: [
      { id: "state", label: "State", type: "text", required: true, hint: "Jharkhand" },
      { id: "district", label: "District", type: "text", required: true, hint: "East Singhbhum" },
      { id: "constituency", label: "Assembly / Parliamentary Constituency", type: "text", required: true },
      { id: "firstMiddleName", label: "First Name followed by Middle Name", type: "text", required: true },
      { id: "surname", label: "Surname (if any)", type: "text" },
      { id: "photo", label: "Photograph (passport size, 4.5cm x 3.5cm, white background)", type: "file", required: true },
      { id: "relativeType", label: "Name/Surname of Relative — relation", type: "select", options: ["Father", "Mother", "Husband", "Wife", "Legal Guardian"], required: true },
      { id: "relativeName", label: "Relative's Name & Surname", type: "text", required: true },
      { id: "mobileOwner", label: "Mobile Number Belongs To", type: "radio", options: ["Self", "Relative mentioned above"], required: true },
      { id: "mobile", label: "Mobile Number", type: "text", required: true },
      { id: "email", label: "Email Id", type: "text" },
      { id: "aadhaar", label: "Aadhaar Number", type: "text", hint: "Or declare \"I don't have Aadhaar Number\"" },
      { id: "gender", label: "Gender", type: "radio", options: ["Male", "Female", "Third Gender"], required: true },
      { id: "dob", label: "Date of Birth", type: "date", required: true },
      { id: "dobProof", label: "Proof of Date of Birth (document)", type: "file", required: true },
      { id: "address", label: "Present Ordinary Residence — House/Building No., Street/Locality, Village/Town, Post Office, PIN, Tehsil, District, State", type: "textarea", required: true },
      { id: "addressProof", label: "Proof of Residence (document)", type: "file", required: true },
      { id: "disabilityCategory", label: "Category of Disability (optional)", type: "select", options: ["None", "Locomotive", "Visual", "Deaf & Dumb", "Other"] },
      { id: "familyMemberName", label: "Family Member Already on Roll at this Address — Name", type: "text" },
      { id: "familyMemberEpic", label: "That Family Member's EPIC Number", type: "text" },
      { id: "birthPlace", label: "Place of Birth — Village/Town, State, District", type: "text", required: true },
      { id: "residentSince", label: "Ordinarily Resident at this Address Since (mm/yyyy)", type: "text", required: true },
    ],
  },
  {
    serviceSlug: "voter-id",
    formName: "Form 8 — Correction / Shifting / Replacement EPIC / Disability Marking",
    portal: "voters.eci.gov.in",
    fields: [
      { id: "epicNumber", label: "Existing EPIC Number", type: "text", required: true },
      { id: "state", label: "State", type: "text", required: true, hint: "Jharkhand" },
      { id: "district", label: "District", type: "text", required: true },
      { id: "constituency", label: "Assembly / Parliamentary Constituency", type: "text", required: true },
      { id: "requestType", label: "What do you need?", type: "select", options: ["Correction of entries", "Shifting of residence (same AC)", "Issue of replacement EPIC", "Marking person with disability"], required: true },
      { id: "aadhaar", label: "Aadhaar Number", type: "text", required: true },
      { id: "mobile", label: "Mobile Number", type: "text", required: true },
      { id: "fieldToCorrect", label: "Field to be Corrected (name/age/address/photo/gender/relation, etc.)", type: "text" },
      { id: "correctedValue", label: "Corrected Value", type: "text" },
      { id: "supportingProof", label: "Proof Supporting the Correction/Shift (document)", type: "file", required: true },
      { id: "photo", label: "Recent Photograph", type: "file", required: true },
      { id: "disabilityCertificate", label: "Disability Certificate (only if marking a disability)", type: "file" },
    ],
  },
  {
    serviceSlug: "voter-id",
    formName: "Form 6A — Overseas Elector Registration",
    portal: "voters.eci.gov.in",
    fields: [
      { id: "state", label: "State", type: "text", required: true, hint: "Jharkhand" },
      { id: "district", label: "District", type: "text", required: true },
      { id: "constituency", label: "Assembly / Parliamentary Constituency", type: "text", required: true },
      { id: "name", label: "Name", type: "text", required: true },
      { id: "lastName", label: "Last Name", type: "text" },
      { id: "relativeName", label: "Name of Relative", type: "text", required: true },
      { id: "relation", label: "Relation", type: "select", options: ["Father", "Mother", "Husband", "Wife"], required: true },
      { id: "dob", label: "Date of Birth", type: "date", required: true },
      { id: "birthPlace", label: "Place of Birth — State, District, Village/Town", type: "text" },
      { id: "gender", label: "Gender", type: "radio", options: ["Male", "Female", "Third Gender"], required: true },
      { id: "mobile", label: "Mobile No.", type: "text" },
      { id: "email", label: "Email Id", type: "text" },
      { id: "indiaAddress", label: "Address in India as per Passport — House No., Street, Town/Village, Post Office, PIN", type: "textarea", required: true },
      { id: "passportNo", label: "Passport Number", type: "text", required: true },
      { id: "passportIssueDate", label: "Passport Date of Issue", type: "date", required: true },
      { id: "passportExpiryDate", label: "Passport Date of Expiry", type: "date", required: true },
      { id: "passportIssuePlace", label: "Passport Place of Issue", type: "text" },
      { id: "visaNumber", label: "Visa Number", type: "text" },
      { id: "visaIssueDate", label: "Visa Date of Issue", type: "date" },
      { id: "visaExpiryDate", label: "Visa Date of Expiry", type: "date" },
      { id: "visaType", label: "Type of Visa", type: "text" },
      { id: "reasonAbsent", label: "Reason for Being Absent from India", type: "select", options: ["Education", "Employment", "Other"], required: true },
      { id: "absentSince", label: "Date from Which Absent from Ordinary Residence in India", type: "date", required: true },
      { id: "currentAddress", label: "Current Address Outside India — House No., Street, Town, State, Country, Zip", type: "textarea", required: true },
      { id: "photo", label: "Passport-size Photograph (3.5cm x 3.5cm)", type: "file", required: true },
      { id: "passportPages", label: "Valid Pages of Passport", type: "file", required: true },
    ],
  },
];

/**
 * Simple, id-based auto-validation: most fields across every form are the same kind of
 * value (an Aadhaar number, a mobile number, a PIN code, an EPIC number, a date of birth),
 * so we attach the right rule by field id/type instead of repeating it on every field above.
 * A field's own `validate` (set above) always wins over this default.
 */
const AUTO_VALIDATE: Record<string, GovFormField["validate"]> = {
  aadhaar: PATTERNS.aadhaar, husbandAadhaar: PATTERNS.aadhaar, wifeAadhaar: PATTERNS.aadhaar,
  mobile: PATTERNS.mobile, mobileOwner: undefined,
  email: PATTERNS.email,
  epicNumber: PATTERNS.epic, familyMemberEpic: PATTERNS.epic,
  dob: { notFuture: true, message: "Date of birth cannot be in the future." },
  husbandDob: { notFuture: true, message: "Date of birth cannot be in the future." },
  wifeDob: { notFuture: true, message: "Date of birth cannot be in the future." },
  marriageDate: { notFuture: true, message: "Date of marriage cannot be in the future." },
  annualIncome: { min: 0, max: 100000000, message: "Enter annual income in rupees as a positive number." },
};

function withAutoValidation(form: GovForm): GovForm {
  return { ...form, fields: form.fields.map((field) => ({ ...field, validate: field.validate ?? AUTO_VALIDATE[field.id] })) };
}

export const govForms: GovForm[] = rawGovForms.map(withAutoValidation);

export function govFormsFor(serviceSlug: string) {
  return govForms.filter((form) => form.serviceSlug === serviceSlug);
}

/** Validate one field's value. Returns an error message, or null if it's fine. */
export function validateField(field: GovFormField, value: string | number | null | undefined): string | null {
  const isEmpty = value === null || value === undefined || value === "";
  if (field.required && isEmpty) return `${field.label} is required.`;
  if (isEmpty) return null; // optional field left blank: nothing more to check

  const v = field.validate;
  if (field.type === "number") {
    const num = typeof value === "number" ? value : Number(value);
    if (Number.isNaN(num)) return `${field.label} must be a number.`;
    if (v?.min !== undefined && num < v.min) return v.message ?? `${field.label} is too small.`;
    if (v?.max !== undefined && num > v.max) return v.message ?? `${field.label} is too large.`;
    return null;
  }
  if (field.type === "date") {
    const date = new Date(String(value));
    if (Number.isNaN(date.getTime())) return `${field.label} must be a valid date.`;
    if (v?.notFuture && date.getTime() > Date.now()) return v.message ?? `${field.label} cannot be in the future.`;
    return null;
  }
  const str = String(value).trim();
  if (v?.minLength !== undefined && str.length < v.minLength) return v.message ?? `${field.label} is too short.`;
  if (v?.maxLength !== undefined && str.length > v.maxLength) return v.message ?? `${field.label} is too long.`;
  if (v?.pattern && !new RegExp(v.pattern).test(str)) return v.message ?? `${field.label} looks incorrect.`;
  if (field.type === "select" || field.type === "radio") {
    if (field.options && !field.options.includes(str)) return `${field.label} must be one of: ${field.options.join(", ")}.`;
  }
  return null;
}

/** Validate a whole form's collected values ({ fieldId: value }). Returns { fieldId: errorMessage } for only the fields with problems. */
export function validateForm(form: GovForm, values: Record<string, string | number | null | undefined>): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of form.fields) {
    const error = validateField(field, values[field.id]);
    if (error) errors[field.id] = error;
  }
  return errors;
}
