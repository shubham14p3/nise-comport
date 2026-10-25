import assert from "node:assert/strict";
import test from "node:test";
import { intakeFields, intakeSections, validateDetailedIntake } from "../src/lib/detailed-intake.ts";

test("legacy PAN 49A preserves all sixteen numbered areas", () => {
  const headers=intakeSections("pan49a").map(x=>x.title).join("|");
  for(const group of ["1.","6.","7.","8–9.","10–11.","12.","13.","14.","15.","16."])assert.ok(headers.includes(group),group);
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
