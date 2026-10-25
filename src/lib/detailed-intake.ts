import { z } from "zod";

/** Customer intake questionnaire based on the sample Passport Seva, ECI Form 8 and PAN Form 49A.
 * These are assistance questionnaires, not government submissions.
 * Requirements/document lists should be checked against the current authority before filing. */
export type IntakeKind = "passport" | "voter" | "pan" | "pan49a";
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


/** Legacy Form 49A (2018 user-supplied specimen), preserved as an assistance worksheet.
 * From 1 Apr 2026, official NEW PAN applicants must use Form 93/94/95/96. */
const pan49a: IntakeSection[] = [
  { title: "1. Applicant and Assessing Officer", fields: [
    field("aoArea","AO area code"), field("aoType","AO type"),field("aoRange","AO range code"),field("aoNumber","AO number"),
    select("personTitle","Title",["Shri","Smt.","Kumari","M/s"],true),
    ...basicName("person"),
    field("printedName","Name to be printed on PAN card",true),
    select("previousName","Have you ever been known by another name?",yesNo),
    select("formerTitle","Former title",["Shri","Smt.","Kumari","M/s"],true,{show:showIf("previousName","Yes")}),
    ...basicName("former").map(f=>({...f,show:showIf("previousName","Yes")})),
    select("gender","Gender",["Male","Female","Transgender"],true,{show:(a)=>!a.status||a.status==="Individual"}),
    field("dob","Date of birth / incorporation (DD/MM/YYYY)",true,"date"),
  ] },
  { title: "6. Parent details", fields: [
    select("singleMother","Is the mother a single parent and you want her name alone?",yesNo,true,{show:(a)=>!a.status||a.status==="Individual"}),
    ...basicName("father").map(f=>({...f,required:f.id!=="fatherMiddle",show:(a:IntakeValue)=>(!a.status||a.status==="Individual")&&a.singleMother!=="Yes"})),
    ...basicName("mother").map(f=>({...f,required:false,show:(a:IntakeValue)=>!a.status||a.status==="Individual"})),
    select("printedParent","Whose name should be printed on the card?",["Father","Mother"],true,{show:(a)=>(!a.status||a.status==="Individual")&&a.singleMother!=="Yes"}),
  ] },
  address("residence","7. Residential address"),
  { title: "7. Office address", fields: [
    select("officeAddress","Do you have an office address to provide?",yesNo),
    field("officeName","Name of office",false,"text",{show:showIf("officeAddress","Yes")}),
    ...address("office","Office address").fields.map(f=>({...f,show:showIf("officeAddress","Yes")})),
  ] },
  { title: "8–9. Communication and contact", fields: [
    select("communicationAddress","Address for communication",["Residence","Office"],true),
    field("phoneCountryCode","Telephone country code"),
    field("phoneAreaCode","Area / STD code"),
    field("mobile","Mobile / telephone number",true,"tel"),
    field("email","Email ID",true,"email"),
  ] },
  { title: "10–11. Applicant status", fields: [
    select("status","Status of applicant",["Individual","Hindu undivided family","Company","Partnership Firm","Association of Persons","Trusts","Body of Individuals","Local Authority","Artificial Juridical Persons","Limited Liability Partnership","Government"]),
    field("registrationNumber","Registration number for entity, company, firm or LLP",false),
  ] },
  { title: "12. Aadhaar information (confidential)", fields: [
    select("aadhaarAllotted","Has Aadhaar been allotted?",yesNo,true,{show:(a)=>!a.status||a.status==="Individual"}),
    field("aadhaarNumber","Aadhaar number (12 digits)",true,"text",{show:(a)=>(!a.status||a.status==="Individual")&&a.aadhaarAllotted==="Yes",hint:"Stored only as encrypted application data; never shown in email or WhatsApp notifications."}),
    field("aadhaarEnrolmentId","Legacy enrolment ID (reference field only; not accepted for new PAN in 2026)",false,"text",{show:(a)=>(!a.status||a.status==="Individual")&&a.aadhaarAllotted==="No"}),
    field("aadhaarName","Name as printed on Aadhaar",true,"text",{show:showIf("aadhaarAllotted","Yes")}),
  ] },
  { title: "13. Sources of income", fields: [
    select("incomeSalary","Income from salary?",yesNo),
    select("incomeBusiness","Business or professional income?",yesNo),
    field("professionCode","Business / profession code",false,"text",{show:showIf("incomeBusiness","Yes")}),
    select("incomeHouse","Income from house property?",yesNo),
    select("incomeCapital","Capital gains?",yesNo),
    select("incomeOther","Income from other sources?",yesNo),
    select("incomeNone","No income?",yesNo),
  ] },
  { title: "14. Representative Assessee", fields: [
    select("raApplicable","Is a representative assessee involved?",yesNo),
    select("raTitle","Representative title",["Shri","Smt.","Kumari","M/s"],true,{show:showIf("raApplicable","Yes")}),
    ...basicName("ra").map(f=>({...f,required:f.id!=="raMiddle",show:showIf("raApplicable","Yes")})),
    ...address("ra","Representative address").fields.map(f=>({...f,show:showIf("raApplicable","Yes")})),
  ] },
  { title: "15. Enclosed supporting documents", fields: [
    select("identityProof","Proof of identity",["Aadhaar","Passport","Voter ID","Driving licence","Other"],true),
    select("addressProof","Proof of address",["Aadhaar","Passport","Voter ID","Driving licence","Other"],true),
    select("birthProof","Proof of date of birth",["Birth certificate","Passport","Matric certificate","Aadhaar","Other"],true),
  ] },
  { title: "16. Applicant declaration", fields: [
    field("declarationName","Name of applicant / declarant",true),
    field("declarationCapacity","Capacity (self, guardian, director etc.)",true),
    field("declarationPlace","Place of declaration",true),
    field("declarationDate","Date (DD/MM/YYYY)",true,"date"),
    select("declaration","I confirm the entered information is true",["Yes"]),
  ] },
];

const formSections: Record<IntakeKind, IntakeSection[]> = { passport, voter, pan, pan49a };
export function intakeSections(kind: IntakeKind): IntakeSection[] { return formSections[kind]; }
export function intakeFields(kind: IntakeKind, answers: IntakeValue): IntakeField[] {
  return formSections[kind].flatMap(s=>s.fields).filter(f=>!f.show||f.show(answers));
}
const protectedKeys = new Set(["aadhaarNumber","panNumber","epicNumber","passportNumber"]);
export function protectedIntakeField(key: string) { return protectedKeys.has(key); }
export const detailedIntakeSchema = z.object({
  kind: z.enum(["passport","voter","pan","pan49a"]),
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
  if(intake.kind==="pan49a") {
    const a=intake.answers;
    if(a.singleMother==="Yes"&&(!a.motherSurname||!a.motherFirst))errors.motherFirst="Enter the mother’s full name for a single-parent application.";
    if(a.communicationAddress==="Office"&&a.officeAddress!=="Yes")errors.communicationAddress="Fill in the office address or select Residence.";
    if(a.incomeNone==="Yes"&&["incomeSalary","incomeBusiness","incomeHouse","incomeCapital","incomeOther"].some(k=>a[k]==="Yes"))errors.incomeNone="No income cannot be combined with income sources.";
    if(a.aadhaarNumber&&!/^\d{12}$/.test(a.aadhaarNumber))errors.aadhaarNumber="Enter 12 digits.";
    if(a.aoArea&&!/^[A-Za-z]{3,4}$/.test(a.aoArea))errors.aoArea="Enter a 3–4 letter AO area code.";
    if(a.aoType&&!/^[A-Za-z]{1,2}$/.test(a.aoType))errors.aoType="Enter a 1–2 letter AO type.";
    if(a.aoRange&&!/^\d{1,3}$/.test(a.aoRange))errors.aoRange="Enter a numeric AO range.";
    if(a.aoNumber&&!/^\d{1,3}$/.test(a.aoNumber))errors.aoNumber="Enter a numeric AO number.";
  }
  if(intake.kind==="voter"&&intake.answers.requestType==="Correction"&&intake.answers.correctionTarget==="Photograph"&&!intake.photoFileId)errors.photoFileId="Upload a photograph for photo correction.";
  return errors;
}

export const intakeDocumentGuide: Record<IntakeKind, string[]> = {
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
  pan49a: ["Proof of identity","Proof of address","Proof of birth / incorporation","Recent photographs for individuals","Signature or thumb impression arranged separately"],
  pan: [
    "Proof of identity",
    "Proof of address",
    "Proof of date of birth / incorporation",
    "Existing PAN or change proof for corrections / reprint",
    "Additional evidence or authorised-representative documents for special cases",
  ],
};
