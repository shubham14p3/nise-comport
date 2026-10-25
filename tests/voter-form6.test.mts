import test from "node:test";
import assert from "node:assert/strict";
import {
  detailedIntakeSchema, intakeFields, intakeSections, validateDetailedIntake,
  type DetailedIntake,
} from "../src/lib/detailed-intake.ts";

const photo="cdf1008c-c521-4697-aafd-9faf97d231c0";
function validForm6():DetailedIntake{
  return {kind:"voter-form6",documents:[],photoFileId:photo,answers:{
    constituencyType:"Assembly",constituencyNumber:"47",constituencyName:"Sample constituency",
    nameLocal:"उदाहरण",firstNameEnglish:"EXAMPLE",surnameEnglish:"APPLICANT",
    relativeType:"Father",relativeNameEnglish:"SAMPLE PARENT",
    mobile:"9000000000",aadhaarStatus:"Do not have Aadhaar",gender:"Female",
    dob:"14/11/1995",birthProof:"PAN Card",
    addressHouse:"12",addressStreet:"Sample Road",addressTehsil:"Jamshedpur",
    addressTown:"Jamshedpur",addressPostOffice:"Telco Works",addressState:"Jharkhand",
    addressDistrict:"East Singhbhum",addressPin:"831004",addressProof:"Aadhaar Card",
    hasDisability:"No",birthVillage:"Jamshedpur",birthDistrict:"East Singhbhum",
    birthState:"Jharkhand",residenceSince:"2026-01",declarationDate:"25/10/2026",
    declarationPlace:"Jamshedpur",citizenDeclaration:"Yes",truthDeclaration:"Yes",sirApplicable:"No",
  }};
}
test("Form 6 new-voter intake has five sections and validates completed data",()=>{
  const value=validForm6();
  assert.equal(intakeSections("voter-form6").length,5);
  assert.deepEqual(validateDetailedIntake(value),{});
  assert.ok(detailedIntakeSchema.safeParse(value).success);
  assert.equal(intakeFields("voter-form6",value.answers).some(f=>f.id==="epicNumber"),false);
});
test("Form 6 requires photograph and self-or-relative contact",()=>{
  const value=validForm6();
  delete value.photoFileId;
  value.answers.mobile="";
  const found=validateDetailedIntake(value);
  assert.match(found.photoFileId,/photograph/);
  assert.match(found.mobile,/contact mobile/);
});
test("Form 6 verifies age, PIN, Aadhaar length and residence since",()=>{
  const value=validForm6();
  Object.assign(value.answers,{dob:"31/02/1995",addressPin:"831",aadhaarStatus:"Have Aadhaar",aadhaarNumber:"123",residenceSince:"2026-19"});
  const found=validateDetailedIntake(value);
  for(const key of ["dob","addressPin","aadhaarNumber","residenceSince"])assert.ok(found[key],key);
});
test("Form 6 SIR declaration fields conditionally appear",()=>{
  const value=validForm6();
  assert.equal(intakeFields("voter-form6",value.answers).some(f=>f.id==="sirElectorName"),false);
  value.answers.sirApplicable="Yes";
  assert.ok(intakeFields("voter-form6",value.answers).some(f=>f.id==="sirElectorName"));
  assert.ok(validateDetailedIntake(value).otherCitizenship);
  value.answers.otherCitizenship="Yes";
  assert.deepEqual(validateDetailedIntake(value),{});
});
test("Form 6 document selection and disability require their specific fields",()=>{
  const value=validForm6();
  value.answers.birthProof="Other";
  assert.ok(validateDetailedIntake(value).birthProofOther);
  value.answers.birthProofOther="School certificate";
  value.answers.hasDisability="Yes";
  assert.ok(validateDetailedIntake(value).disabilityPercent);
  Object.assign(value.answers,{disabilityType:"Visual",disabilityPercent:"40",hasDisabilityCertificate:"Yes"});
  assert.deepEqual(validateDetailedIntake(value),{});
});
