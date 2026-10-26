import test from "node:test";
import assert from "node:assert/strict";
import {
  detailedIntakeSchema, form8CorrectionNames, intakeFields, validateDetailedIntake,
  type DetailedIntake,
} from "../src/lib/detailed-intake.ts";

function form8(answers: Record<string,string> = {}): DetailedIntake {
  return { kind:"voter-form8", documents:[], answers:{
    applicantName:"Example Applicant",
    epicNumber:"SHJ1910843",
    constituencyType:"Assembly",
    constituencyNumber:"67",
    constituencyName:"Ahiwara",
    aadhaarStatus:"Do not have Aadhaar",
    mobile:"9876543210",
    requestType:"Correction",
    corrections:"Relation Type|Relation Name|Mobile Number",
    correctRelationType:"Husband",
    correctRelationName:"Example Relative",
    correctMobile:"9123456789",
    proofRelationType:"Aadhaar",
    proofRelationName:"Aadhaar",
    proofMobile:"Mobile bill",
    declarationDate:"27/07/2026",
    declarationPlace:"Jamshedpur",
    declaration:"Yes",
    ...answers,
  }};
}

test("Form 8 applicant can request three supported corrections and retain proof names",()=>{
  const value=form8();
  assert.deepEqual(validateDetailedIntake(value),{});
  assert.equal(detailedIntakeSchema.safeParse(value).success,true);
  assert.deepEqual(form8CorrectionNames(value.answers),["Relation Type","Relation Name","Mobile Number"]);
  assert.equal(intakeFields("voter-form8",value.answers).some(f=>f.id==="correctRelationName"),true);
  assert.equal(intakeFields("voter-form8",value.answers).some(f=>f.id==="addressHouse"),false);
});
test("Form 8 rejects more than four corrections or duplicate selections",()=>{
  const value=form8({corrections:"Name|Gender|DoB/Age|Relation Type|Relation Name"});
  assert.match(validateDetailedIntake(value).corrections,/between one and four/);
  value.answers.corrections="Name|Name";
  assert.match(validateDetailedIntake(value).corrections,/between one and four/);
});
test("Form 8 requires entered correction particulars and supporting proof",()=>{
  const value=form8({corrections:"Relation Name",correctRelationName:"",proofRelationName:""});
  assert.ok(validateDetailedIntake(value).correctRelationName);
  assert.ok(validateDetailedIntake(value).proofRelationName);
});
test("Form 8 photograph correction requires an uploaded photo reference",()=>{
  const value=form8({corrections:"Photo",correctPhoto:"Yes",proofPhoto:"Photograph"});
  assert.match(validateDetailedIntake(value).photoFileId,/photograph/);
  value.photoFileId="eeefab15-97e9-44ef-82b7-489d3c821ef0";
  assert.deepEqual(validateDetailedIntake(value),{});
});
test("Form 8 residence shifting requires address, PIN and address proof",()=>{
  const value=form8({requestType:"Shift residence",addressHouse:"22",addressStreet:"Main Road",addressTown:"Jamshedpur",addressPostOffice:"Telco",addressPin:"831004",addressDistrict:"East Singhbhum",addressTehsil:"Golmuri",addressState:"Jharkhand",addressProofType:"Aadhaar Card"});
  assert.deepEqual(validateDetailedIntake(value),{});
  value.answers.addressPin="831";
  assert.match(validateDetailedIntake(value).addressPin,/PIN/);
});
test("Form 8 replacement and disability have separate required inputs",()=>{
  const value=form8({requestType:"Replacement EPIC"});
  assert.ok(validateDetailedIntake(value).replacementReason);
  value.answers.replacementReason="Lost";
  assert.deepEqual(validateDetailedIntake(value),{});
  value.answers.requestType="Disability marking";
  assert.ok(validateDetailedIntake(value).disabilityType);
  Object.assign(value.answers,{disabilityType:"Visual",disabilityPercent:"55",hasDisabilityCertificate:"Yes"});
  assert.deepEqual(validateDetailedIntake(value),{});
});
test("Form 8 validates EPIC, phone, Aadhaar and declaration date",()=>{
  const value=form8({epicNumber:"INVALID",mobile:"123",aadhaarStatus:"Have Aadhaar",aadhaarNumber:"1234",declarationDate:"31/02/2026"});
  const errors=validateDetailedIntake(value);
  for (const key of ["epicNumber","mobile","aadhaarNumber","declarationDate"]) assert.ok(errors[key],key);
});

test("Form 8 date-of-birth correction permits valid DOB or age",()=>{
  const value=form8({corrections:"DoB/Age",correctDob:"33",proofDob:"Birth certificate"});
  assert.deepEqual(validateDetailedIntake(value),{});
  value.answers.correctDob="31/02/1995";
  assert.match(validateDetailedIntake(value).correctDob,/DD\/MM\/YYYY/);
  value.answers.correctDob="19/08/1994";
  assert.deepEqual(validateDetailedIntake(value),{});
});
test("mobile correction can be prepared even when the sample has no separate proof name",()=>{
  const value=form8({corrections:"Mobile Number",correctMobile:"9876543210",proofMobile:""});
  assert.deepEqual(validateDetailedIntake(value),{});
});
