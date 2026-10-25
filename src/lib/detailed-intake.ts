import { z } from "zod";

/** Customer intake questionnaire based on the sample Passport Seva, ECI Form 8 and PAN Form 49A.
 * These are assistance questionnaires, not government submissions.
 * Requirements/document lists should be checked against the current authority before filing. */
export type IntakeKind = "passport" | "voter" | "pan" | "voter-form8";
export type IntakeValue = Record<string, string>;
export type IntakeField = {
  id: string; label: string; required?: boolean; type?: "text" | "date" | "email" | "tel" | "textarea" | "select";
  options?: readonly string[]; hint?: string;
  show?: (values: IntakeValue) => boolean;
};
export type IntakeSection = { title: string; description?: string; fields: IntakeField[] };
export type DetailedIntake = { kind: IntakeKind; answers: IntakeValue; documents: string[]; photoFileId?: string };

const yesNo = ["Yes", "No"] as const;
const field = (id: string, label: string, required = false, type: IntakeField["type"] = "text", extra: Partial<IntakeField> = {}): IntakeField =>
  ({ id, label, required, type, ...extra });
const select = (id: string, label: string, choices: readonly string[], required = true, extra: Partial<IntakeField> = {}) =>
  field(id, label, required, "select", { options: choices, ...extra });
const showIf = (id: string, value: string) => (answers: IntakeValue) => answers[id] === value;

const address = (prefix: string, title: string): IntakeSection => ({
  title,
  fields: [
    field(prefix+"House", "Flat / room / door / house / block number", true),
    field(prefix+"Building", "Name of premises / building / village"),
    field(prefix+"Street", "Road / street / lane / post office", true),
    field(prefix+"Locality", "Area / locality / tehsil / subdivision", true),
    field(prefix+"City", "Town / city / district", true),
    field(prefix+"State", "State / union territory", true),
    field(prefix+"Pin", "PIN code", true),
    field(prefix+"Country", "Country", true),
  ],
});
const basicName = (prefix: string): IntakeField[] => [
  field(prefix+"Surname", "Last name / Surname", true),
  field(prefix+"First", "First name", true),
  field(prefix+"Middle", "Middle name"),
];

const passport: IntakeSection[] = [
  { title: "Application category", fields: [
    select("applicationType", "Applying for", ["Fresh", "Reissue"]),
    select("reissueReason", "Reason for reissue", ["Expired / due to expire", "Change of personal details", "Lost passport", "Damaged passport", "Other"], true, { show: showIf("applicationType","Reissue") }),
    field("changeDescription", "Personal particulars to change", false, "textarea", { show: showIf("reissueReason","Change of personal details") }),
    select("priority", "Application category", ["Normal", "Tatkaal"]),
    select("booklet", "Passport booklet", ["Normal", "Jumbo"]),
  ] },
  { title: "Applicant", fields: [
    field("applicantName", "Applicant full name", true),
    field("dob", "Date of birth (DD/MM/YYYY)", true, "date"),
    field("birthPlace", "Place of birth (village / town / city)", true),
    field("birthDistrict", "Birth district", true),
    field("birthState", "Birth state / UT", true),
    field("birthCountry", "Birth country / region", true),
    select("gender", "Gender", ["Male", "Female", "Transgender", "Other"]),
    select("maritalStatus", "Marital status", ["Single", "Married", "Divorced", "Widowed", "Separated"]),
    select("citizenshipBy", "Citizenship of India by", ["Birth", "Descent", "Registration", "Naturalisation"]),
    field("panNumber", "PAN number (if any)"),
    select("employmentType", "Employment type", ["Private", "Government", "Public sector", "Self-employed", "Student", "Homemaker", "Retired", "Not employed", "Other"]),
    select("familyGovtEmployee", "Is a parent (if minor) or spouse a government servant?", yesNo),
    select("education", "Educational qualification", ["Below matriculation", "Matriculation", "Higher secondary", "Graduate and above", "Other"]),
    select("nonEcr", "Eligible for Non-ECR category?", yesNo),
    field("aadhaarNumber", "Aadhaar number (where provided)"),
  ] },
  { title: "Family", fields: [
    field("fatherName", "Father's full name", true),
    field("motherName", "Mother's full name", true),
    field("spouseName", "Spouse's name", false, "text", { show: showIf("maritalStatus","Married") }),
  ]},
  { title: "Present residential address", fields: [
    field("currentAddress", "Full address", true, "textarea"),
    field("currentPin", "PIN code", true),
    field("currentPolice", "Police station", true),
    field("currentPhone", "Mobile / telephone", true, "tel"),
    field("currentEmail", "Email", true, "email"),
    select("samePermanent", "Permanent address same as present?", yesNo),
  ]},
  { title: "Permanent residential address", fields: [
    ...["Address","Pin","Police","Phone"].map((suffix) => field("permanent"+suffix, suffix==="Pin" ? "PIN code" : suffix==="Police" ? "Police station" : suffix==="Phone" ? "Mobile / telephone" : "Full permanent address", true, suffix==="Address"?"textarea":suffix==="Phone"?"tel":"text", { show: showIf("samePermanent","No") })),
  ]},
  { title: "Emergency contact", fields: [
    field("emergencyName", "Emergency contact name", true),
    field("emergencyAddress", "Emergency contact address", true, "textarea"),
    field("emergencyPhone", "Emergency mobile / telephone", true, "tel"),
    field("emergencyEmail", "Emergency email", false, "email"),
  ]},
  { title: "Previous or lost passport", fields: [
    select("previousPassport", "Have you held a passport before?", yesNo, true, { show: showIf("applicationType","Fresh") }),
    field("passportNumber", "Previous / lost passport number", true, "text", { show: (v) => v.applicationType==="Reissue"||v.previousPassport==="Yes" }),
    field("passportIssueDate", "Previous passport issue date (DD/MM/YYYY)", true, "date", { show: (v) => v.applicationType==="Reissue"||v.previousPassport==="Yes" }),
    field("passportExpiryDate", "Previous passport expiry date (DD/MM/YYYY)", true, "date", { show: (v) => v.applicationType==="Reissue"||v.previousPassport==="Yes" }),
    field("passportPlace", "Place of issue", true, "text", { show: (v) => v.applicationType==="Reissue"||v.previousPassport==="Yes" }),
    field("passportFile", "Previous file number (if available)", false, "text", { show: (v) => v.applicationType==="Reissue"||v.previousPassport==="Yes" }),
  ]},
  { title: "Declaration", fields: [
    select("declaration", "I confirm the details provided are accurate", ["Yes"]),
  ]},
];

const voter: IntakeSection[] = [
  { title: "Application and existing voter card", fields: [
    select("requestType", "Form 8 request", ["Correction", "Shift residence", "Replacement EPIC", "Disability marking"]),
    field("epicNumber", "Existing EPIC / Voter ID number", true),
    field("applicantName", "Applicant full name", true),
    field("fatherName", "Father / relevant relative's name", true),
    field("mobile", "Mobile number", true, "tel"),
    field("email", "Email ID", false, "email"),
    select("aadhaarStatus", "Aadhaar available for this application?", yesNo),
    field("aadhaarNumber", "Aadhaar number", true, "text", { show: showIf("aadhaarStatus","Yes") }),
    field("constituency", "Assembly constituency name / number", false),
  ]},
  { ...address("address","Applicant residential address"), fields: address("address","Applicant residential address").fields.map((f) => ({ ...f, show: (v: IntakeValue) => v.requestType==="Shift residence" || v.requestType==="Correction" })) },
  { title: "Correction details", fields: [
    select("correctionTarget", "Which detail needs correction?", ["Name","Gender","Date of birth","Relation type","Relation name","Address","Mobile number","Photograph"], true, { show: showIf("requestType","Correction") }),
    field("oldValue", "Currently recorded value (except photo)", false, "text", { show: (v)=>v.requestType==="Correction"&&v.correctionTarget!=="Photograph" }),
    field("correctValue", "Correct value (except photo)", true, "text", { show: (v)=>v.requestType==="Correction"&&v.correctionTarget!=="Photograph" }),
    select("relationType", "Relation type", ["Father","Mother","Husband","Wife","Other"], true, { show: (v)=>v.requestType==="Correction"&&v.correctionTarget==="Relation type" }),
  ] },
  { title: "Replacement EPIC", fields: [
    select("replacementReason", "Reason for replacement", ["Lost","Mutilated","Destroyed"], true, { show: showIf("requestType","Replacement EPIC") }),
  ] },
  { title: "Disability", fields: [
    select("disabilityType", "Disability category", ["Locomotor","Visual","Deaf / dumb","Other"], true, { show: showIf("requestType","Disability marking") }),
    field("disabilityOther", "Describe disability", true, "textarea", { show: (v)=>v.requestType==="Disability marking"&&v.disabilityType==="Other" }),
    field("disabilityPercent", "Disability percentage", true, "text", { show: showIf("requestType","Disability marking") }),
    select("hasDisabilityCertificate", "Disability certificate available?", yesNo, true, { show: showIf("requestType","Disability marking") }),
  ] },
  { title: "Declaration", fields: [select("declaration", "I confirm the information is correct", ["Yes"])] },
];


/**
 * The ECI Form 8 preparatory questionnaire. Kept separate from the older, shorter
 * voter intake so existing applications and other services are not changed.
 * The applicant must verify the current form and file through the ECI portal.
 */
export const FORM8_CORRECTIONS = [
  ["Name", "correctName", "proofName"],
  ["Gender", "correctGender", "proofGender"],
  ["DoB/Age", "correctDob", "proofDob"],
  ["Relation Type", "correctRelationType", "proofRelationType"],
  ["Relation Name", "correctRelationName", "proofRelationName"],
  ["Address", "correctAddress", "proofAddress"],
  ["Mobile Number", "correctMobile", "proofMobile"],
  ["Photo", "correctPhoto", "proofPhoto"],
] as const;
export type Form8Correction = (typeof FORM8_CORRECTIONS)[number][0];
export function form8CorrectionNames(answers: IntakeValue): Form8Correction[] {
  const raw = (answers.corrections ?? "").split("|").filter(Boolean);
  return FORM8_CORRECTIONS.map(row => row[0]).filter(name => raw.includes(name));
}
const form8Show = (requestType: string) => (v: IntakeValue) => v.requestType === requestType;
const fixShown = (name: Form8Correction) => (v: IntakeValue) =>
  v.requestType === "Correction" && form8CorrectionNames(v).includes(name);
const voterForm8: IntakeSection[] = [
  { title: "Electoral roll and applicant details", fields: [
    field("applicantName", "Name of the applicant", true),
    field("epicNumber", "EPIC No.", true),
    select("constituencyType", "Constituency", ["Assembly", "Parliamentary (UT without assembly)"]),
    field("constituencyNumber", "Constituency number", true),
    field("constituencyName", "Name of constituency", true),
    select("aadhaarStatus", "Aadhaar details", ["Have Aadhaar", "Do not have Aadhaar"]),
    field("aadhaarNumber", "Aadhaar number", true, "text", { show: showIf("aadhaarStatus", "Have Aadhaar") }),
    field("mobile", "Mobile no. of self", false, "tel"),
    field("relativeMobile", "Mobile no. of father/mother/relative", false, "tel"),
    field("email", "Email ID of self", false, "email"),
    field("relativeEmail", "Email ID of father/mother/relative", false, "email"),
    select("requestType", "I submit application for", ["Shift residence", "Correction", "Replacement EPIC", "Disability marking"]),
  ] },
  { title: "1. Shifting of residence", fields: [
    field("addressHouse", "House / Building / Apartment No.", true, "text", { show: form8Show("Shift residence") }),
    field("addressStreet", "Street / Area / Locality / Mohalla / Road", true, "text", { show: form8Show("Shift residence") }),
    field("addressTown", "Town / Village", true, "text", { show: form8Show("Shift residence") }),
    field("addressPostOffice", "Post Office", true, "text", { show: form8Show("Shift residence") }),
    field("addressPin", "PIN code", true, "text", { show: form8Show("Shift residence") }),
    field("addressDistrict", "District", true, "text", { show: form8Show("Shift residence") }),
    field("addressTehsil", "Tehsil / Taluka / Mandal", true, "text", { show: form8Show("Shift residence") }),
    field("addressState", "State / UT", true, "text", { show: form8Show("Shift residence") }),
    select("addressProofType", "Self-attested address proof", [
      "Water/Electricity/Gas Bill (at least 1 year)",
      "Aadhaar Card",
      "Bank/Post Office current passbook",
      "Indian Passport",
      "Revenue Department land records / Kisan Bahi",
      "Registered Rent Lease Deed",
      "Registered Sale Deed",
      "Other",
    ], true, { show: form8Show("Shift residence") }),
    field("addressProofOther", "Specify other address proof", true, "text", {
      show: (v) => v.requestType === "Shift residence" && v.addressProofType === "Other",
    }),
  ] },
  { title: "2. Correction of entries (maximum four)", fields: [
    field("corrections", "Particulars selected for correction", true, "text", { show: form8Show("Correction") }),
    field("correctName", "Correct name", true, "text", { show: fixShown("Name") }),
    select("correctGender", "Correct gender", ["Male", "Female", "Transgender"], true, { show: fixShown("Gender") }),
    field("correctDob", "Correct date of birth (DD/MM/YYYY)", true, "date", { show: fixShown("DoB/Age") }),
    select("correctRelationType", "Correct relation type", ["Father", "Mother", "Husband", "Wife", "Guardian", "Other"], true, { show: fixShown("Relation Type") }),
    field("correctRelationName", "Correct relation name", true, "text", { show: fixShown("Relation Name") }),
    field("correctAddress", "Correct address", true, "textarea", { show: fixShown("Address") }),
    field("correctMobile", "Correct mobile number", true, "tel", { show: fixShown("Mobile Number") }),
    field("correctPhoto", "New photo requested", true, "text", { show: fixShown("Photo") }),
    ...FORM8_CORRECTIONS.map(([name, , proof]) => field(proof, "Proof document for " + name, true, "text", { show: fixShown(name) })),
  ] },
  { title: "3. Replacement EPIC (without correction)", fields: [
    select("replacementReason", "Original EPIC is", ["Lost", "Destroyed due to flood, fire or natural disaster", "Mutilated"], true, { show: form8Show("Replacement EPIC") }),
    select("lostPoliceReport", "Police report / FIR available", ["Yes", "No"], false, {
      show: (v) => v.requestType === "Replacement EPIC" && v.replacementReason === "Lost",
    }),
    select("oldEpicReturned", "I will return the old/mutilated EPIC if applicable", ["Yes", "No"], false, {
      show: (v) => v.requestType === "Replacement EPIC" && v.replacementReason === "Mutilated",
    }),
  ] },
  { title: "4. Person with disability", fields: [
    select("disabilityType", "Category of disability", ["Locomotor", "Visual", "Deaf & Dumb", "Other"], true, { show: form8Show("Disability marking") }),
    field("disabilityOther", "Other disability description", true, "text", { show: (v) => v.requestType === "Disability marking" && v.disabilityType === "Other" }),
    field("disabilityPercent", "Percentage of disability", true, "text", { show: form8Show("Disability marking") }),
    select("hasDisabilityCertificate", "Disability certificate attached", ["Yes", "No"], true, { show: form8Show("Disability marking") }),
  ] },
  { title: "Declaration", fields: [
    field("declarationDate", "Declaration date (DD/MM/YYYY)", true, "date"),
    field("declarationPlace", "Place", true),
    select("declaration", "I confirm the details are true and understand the declaration", ["Yes"]),
  ] },
];

const pan: IntakeSection[] = [
  { title: "Applicant name as on supporting proof", fields: [
    ...basicName("person"),
    field("printedName", "Name to print on PAN card", true),
    select("previousName", "Have you been known by another name?", yesNo),
    ...basicName("former").map(f => ({ ...f, show: showIf("previousName","Yes") })),
    select("gender", "Gender", ["Male", "Female", "Transgender"]),
    select("singleMother", "Is the mother a single parent and PAN is applied with her name only?", yesNo),
    ...basicName("father").map(f => ({ ...f, required: true, show: (v: IntakeValue) => v.singleMother!=="Yes" })),
    ...basicName("mother").map(f => ({ ...f, required: true, show: showIf("singleMother","Yes") })),
    select("printedParent", "Parent's name to print", ["Father", "Mother"], true, { show: (v) => v.singleMother!=="Yes" }),
  ]},
  address("residence", "Residential address (Form 49A layout)"),
  { title: "Office and supporting documents", fields: [
    select("officeAddress", "Do you need to provide an office address?", yesNo),
    ...address("office","Office").fields.map(f => ({...f,show:showIf("officeAddress","Yes")})),
    select("identityProof", "Identity proof you can provide", ["Aadhaar","Passport","Voter ID","Driving licence","Other"]),
    select("addressProof", "Address proof you can provide", ["Aadhaar","Passport","Voter ID","Driving licence","Other"]),
    select("birthProof", "Date-of-birth proof you can provide", ["Birth certificate","Passport","Matric certificate","Aadhaar","Other"]),
  ]},
];

const formSections: Record<IntakeKind, IntakeSection[]> = { passport, voter, pan, "voter-form8": voterForm8 };
export function intakeSections(kind: IntakeKind): IntakeSection[] { return formSections[kind]; }
export function intakeFields(kind: IntakeKind, answers: IntakeValue): IntakeField[] {
  return formSections[kind].flatMap(s=>s.fields).filter(f=>!f.show||f.show(answers));
}
const protectedKeys = new Set(["aadhaarNumber","panNumber","epicNumber","passportNumber"]);
export function protectedIntakeField(key: string) { return protectedKeys.has(key); }
export const detailedIntakeSchema = z.object({
  kind: z.enum(["passport","voter","pan","voter-form8"]),
  answers: z.record(z.string().min(1).max(45),z.string().max(400)).refine(v=>Object.keys(v).length<=110),
  documents: z.array(z.string().max(100)).max(18),
  photoFileId: z.uuid().optional(),
});
function validDate(raw: string, allowFuture = false) {
  if(!/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) return false;
  const [d,m,y]=raw.split("/").map(Number);
  const iso=`${y.toString().padStart(4,"0")}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  const parsed=new Date(iso+"T00:00:00Z");
  return y>=1900&&!Number.isNaN(parsed.getTime())&&parsed.toISOString().slice(0,10)===iso&&(allowFuture||parsed<=new Date());
}
export function validateDetailedIntake(intake: DetailedIntake): Record<string,string> {
  const errors: Record<string,string>={};
  const fields=intakeFields(intake.kind,intake.answers);
  const allowed = new Set(formSections[intake.kind].flatMap(s=>s.fields.map(f=>f.id)));
  for(const key of Object.keys(intake.answers))if(!allowed.has(key))errors[key]="Unknown field.";
  for(const f of fields){
    const value=(intake.answers[f.id]??"").trim();
    if(f.required&&!value){errors[f.id]=`${f.label} is required.`;continue}
    if(!value)continue;
    if(f.type==="select"&&!f.options?.includes(value))errors[f.id]="Choose one of the provided options.";
    else if(f.type==="date"&&!validDate(value, f.id==="passportExpiryDate"))errors[f.id]="Enter a real past date as DD/MM/YYYY (for example 19/08/1995).";
    else if(f.type==="email"&&!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value))errors[f.id]="Enter a valid email address.";
    else if(f.type==="tel"&&!/^\+?[0-9\s()-]{8,18}$/.test(value))errors[f.id]="Enter a valid phone number.";
    else if(/Pin$/.test(f.id)&&!/^\d{6}$/.test(value))errors[f.id]="Enter a 6-digit PIN code.";
    else if(f.id==="aadhaarNumber"&&!/^\d{12}$/.test(value))errors[f.id]="Aadhaar must contain 12 digits.";
    else if(f.id==="panNumber"&&!/^[A-Z]{5}\d{4}[A-Z]$/.test(value.toUpperCase()))errors[f.id]="Enter a valid PAN.";
    else if(f.id==="disabilityPercent"&&(!/^\d{1,3}(\.\d{1,2})?$/.test(value)||Number(value)>100))errors[f.id]="Enter a percentage between 0 and 100.";
    else if(f.id==="applicantName"&&value.length<2)errors[f.id]="Enter the applicant name.";
  }
  if (intake.kind === "voter-form8") {
    const v = intake.answers;
    if (v.epicNumber && !/^[A-Z]{3}[0-9]{7}$/.test(v.epicNumber.toUpperCase().trim())) errors.epicNumber = "Enter an EPIC number with 3 letters and 7 digits.";
    if (v.constituencyNumber && !/^[0-9]{1,4}$/.test(v.constituencyNumber)) errors.constituencyNumber = "Enter a constituency number.";
    if (!v.mobile?.trim() && !v.relativeMobile?.trim()) errors.mobile = "Provide a contact number for self or a relative.";
    for (const k of ["mobile","relativeMobile","correctMobile"] as const) {
      if (v[k]?.trim() && !/^[6-9][0-9]{9}$/.test(v[k].replace(/[\s()-]/g,""))) errors[k] = "Enter a 10-digit Indian mobile number.";
    }
    if (v.requestType === "Correction") {
      const selected = form8CorrectionNames(v);
      if (!selected.length || selected.length > 4 || v.corrections.split("|").filter(Boolean).length !== selected.length) {
        errors.corrections = "Choose between one and four different correction particulars.";
      }
      if (selected.includes("Photo") && !intake.photoFileId) errors.photoFileId = "Upload a recent photograph for photo correction.";
    }
    if (v.requestType === "Disability marking" && v.disabilityPercent &&
      (!/^[0-9]{1,3}(?:\.[0-9]{1,2})?$/.test(v.disabilityPercent) || Number(v.disabilityPercent) > 100)) {
      errors.disabilityPercent = "Enter a percentage between 0 and 100.";
    }
  }
  if(intake.kind==="voter"&&intake.answers.requestType==="Correction"&&intake.answers.correctionTarget==="Photograph"&&!intake.photoFileId)errors.photoFileId="Upload a photograph for photo correction.";
  return errors;
}

export const intakeDocumentGuide: Record<IntakeKind, string[]> = {
  "voter-form8": ["Self-attested supporting proof for the selected change", "Address proof for shifting residence", "Recent photo if correcting the photograph", "Police report/FIR for lost EPIC where applicable", "Disability certificate where applicable"],
  passport: [
    "Present-address proof where required (for example an accepted Aadhaar, utility bill or bank document)",
    "Date-of-birth proof accepted for the applicant's category",
    "Existing passport and self-attested copies for reissue",
    "Additional evidence for name, appearance, address, date-of-birth or other requested changes",
    "Bring originals to Passport Seva Kendra; final requirements follow the current Passport Seva checklist",
  ],
  voter: [
    "Supporting proof for each selected Form 8 correction",
    "Address proof for a residence change",
    "Photograph if changing the photo",
    "Disability certificate if applicable",
    "Replacement declaration / supporting evidence if needed",
  ],
  pan: [
    "Proof of identity",
    "Proof of address",
    "Proof of date of birth / incorporation",
    "Existing PAN or change proof for corrections / reprint",
    "Additional evidence or authorised-representative documents for special cases",
  ],
};
