import assert from "node:assert/strict";
import test from "node:test";
import { intakeFields, intakeSections, validateDetailedIntake } from "../src/lib/detailed-intake.ts";

test("legacy PAN 49A preserves all sixteen numbered areas", () => {
  const headers=intakeSections("pan49a").map(x=>x.title).join("|");
  for(const group of ["1–5.","6.","7.","8–9.","10–11.","12.","13.","14.","15.","16."])assert.ok(headers.includes(group),group);
  const ids=new Set(intakeSections("pan49a").flatMap(s=>s.fields.map(f=>f.id)));
  for(const key of ["aoArea","aoType","aoRange","aoNumber","printedName","previousName","dob","singleMother","fatherSurname","motherSurname","residencePin","officePin","communicationAddress","mobile","email","status","registrationNumber","aadhaarNumber","aadhaarEnrolmentId","incomeSalary","incomeNone","raApplicable","identityProof","addressProof","birthProof","declarationDate"])
    assert.ok(ids.has(key), "Missing "+key);
});
test("49A validation catches invalid Aadhaar, conflicting income and impossible office preference",()=>{
  const errors=validateDetailedIntake({kind:"pan49a",answers:{aadhaarAllotted:"Yes",aadhaarNumber:"123",incomeSalary:"Yes",incomeNone:"Yes",officeAddress:"No",communicationAddress:"Office",aoArea:"42"},documents:[]});
  assert.ok(errors.aadhaarNumber);
  assert.ok(errors.incomeNone);
  assert.ok(errors.communicationAddress);
  assert.ok(errors.aoArea);
});
test("49A conditional fields hide former name and representative address",()=>{
  const answers={previousName:"No",raApplicable:"No",officeAddress:"No"};
  const visible=new Set(intakeFields("pan49a",answers).map(f=>f.id));
  assert.equal(visible.has("formerFirst"),false);
  assert.equal(visible.has("raHouse"),false);
  assert.equal(visible.has("officeStreet"),false);
});
test("original PAN and voter questionnaires are not replaced",()=>{
  assert.ok(intakeSections("pan").length>0);
  assert.ok(intakeSections("voter").length>0);
  assert.ok(intakeSections("passport").length>0);
});

test("Form 49A requires matching generated name, rejects future birth dates and text PIN codes",()=>{
  const errors=validateDetailedIntake({kind:"pan49a",answers:{
    personTitle:"Shri",personFirst:"Demo",personSurname:"Applicant",printedName:"Wrong Name",
    dob:"31/12/2099",residencePin:"83ABCD",status:"Individual",communicationSameAsResidence:"Yes",
  },documents:[]});
  assert.ok(errors.printedName);
  assert.ok(errors.dob);
  assert.ok(errors.residencePin);
});
test("Individual status is fixed and company registration questions are not shown",()=>{
  const fields=intakeFields("pan49a",{status:"Individual",communicationSameAsResidence:"Yes",previousName:"No"}).map(f=>f.id);
  assert.ok(fields.includes("status"));
  assert.ok(!fields.includes("registrationNumber"));
  assert.ok(!fields.includes("communicationAddress"));
});
test("AO codes are optional on a fresh worksheet",()=>{
  const errors=validateDetailedIntake({kind:"pan49a",answers:{},documents:[]});
  for(const id of ["aoArea","aoType","aoRange","aoNumber"])assert.equal(errors[id],undefined,id+" unexpectedly required");
});

test("Form 93 uses the current two-page individual form structure",()=>{
  const sections=intakeSections("pan93").map(s=>s.title).join("|");
  for(const name of ["Part A","Part B","Part C","Part D","Part E","Part F","Part G","Verification"])assert.ok(sections.includes(name));
  const fields=new Set(intakeSections("pan93").flatMap(section=>section.fields.map(f=>f.id)));
  for(const key of ["personFirst","personSurname","printedName","gender","dob","aadhaarNumber",
    "residenceHouse","residencePin","residenceStatus","mobile","email","incomeNone",
    "fatherFirst","motherFirst","printedParent","aoArea","raApplicable","communicationSameAsResidence",
    "identityProof","addressProof","birthProof","declarationName"])assert.ok(fields.has(key),"Missing Form 93 field "+key);
  for(const privateStageField of ["couponToken","paymentReference","officialReference","qrCode","signatureImage","photoImage"])
    assert.ok(!fields.has(privateStageField),"Staff-only field leaked into customer questionnaire");
});
test("Form 93 cannot accept fabricated post-payment identifiers in applicant answers",()=>{
  const errors=validateDetailedIntake({kind:"pan93",answers:{
    couponToken:"INVALID-CUSTOMER-TOKEN",officialReference:"FAKE",applicationBarcode:"12345",
  },documents:[]});
  assert.ok(errors.couponToken&&errors.officialReference&&errors.applicationBarcode);
});
