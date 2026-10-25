import test from "node:test";
import assert from "node:assert/strict";
import { detailedIntakeSchema, intakeFields, intakeSections, validateDetailedIntake, type DetailedIntake } from "../src/lib/detailed-intake.ts";

function complete(kind: DetailedIntake["kind"]): DetailedIntake {
  const answers: Record<string,string> = kind==="passport" ? {applicationType:"Fresh"} :
    kind==="voter" ? {requestType:"Correction", correctionTarget:"Name",aadhaarStatus:"No"} :
    {previousName:"No",singleMother:"No",officeAddress:"No"};
  for (let i=0;i<3;i++) for(const f of intakeFields(kind,answers)){
    if(answers[f.id] || !f.required) continue;
    answers[f.id] = f.options?.[0] ?? (f.type==="date" ? "19/08/1995" :
      f.type==="email" ? "valid@example.com" :
      f.type==="tel" ? "9876543210" :
      /Pin$/.test(f.id) ? "831004" :
      f.id==="aadhaarNumber" ? "123456789012" : "Example value");
  }
  return {kind,answers,documents:[]};
}

test("all three questionnaire types have required fields and accept valid samples",()=>{
  for(const kind of ["passport","voter","pan"] as const){
    const model=complete(kind);
    assert.ok(intakeSections(kind).length>=3);
    assert.deepEqual(validateDetailedIntake(model),{},kind);
    assert.equal(detailedIntakeSchema.safeParse(model).success,true);
  }
});

test("invalid dates and Indian PIN codes fail without javascript Date rollover",()=>{
  const pass=complete("passport");
  pass.answers.dob="31/02/1995";
  assert.match(validateDetailedIntake(pass).dob,/real past date/);
  pass.answers.dob="19/08/1995";
  pass.answers.currentPin="123";
  assert.match(validateDetailedIntake(pass).currentPin,/6-digit/);
});

test("passport reissue needs old passport and details; fresh passport does not",()=>{
  const pass=complete("passport");
  assert.equal(validateDetailedIntake(pass).passportNumber,undefined);
  pass.answers.applicationType="Reissue";
  assert.ok(validateDetailedIntake(pass).passportNumber);
  Object.assign(pass.answers,{reissueReason:"Expired / due to expire",passportNumber:"N1234567",passportIssueDate:"16/12/2015",passportExpiryDate:"31/12/2030",passportPlace:"Ranchi"});
  assert.deepEqual(validateDetailedIntake(pass),{});
});

test("voter Form 8 correction photograph requires a photo file reference",()=>{
  const v=complete("voter");
  v.answers.correctionTarget="Photograph";
  assert.ok(validateDetailedIntake(v).photoFileId);
  delete v.answers.correctValue;
  v.photoFileId="1684c41e-6c04-4000-a7f7-fbb64ff48d07";
  assert.deepEqual(validateDetailedIntake(v),{});
});

test("voter disability fields only appear for disability marking",()=>{
  const v=complete("voter");
  assert.equal(intakeFields("voter",v.answers).some(f=>f.id==="disabilityPercent"),false);
  v.answers.requestType="Disability marking";
  assert.ok(validateDetailedIntake(v).disabilityType);
});

test("PAN printed name and conditional previous/parent names validated",()=>{
  const p=complete("pan");
  p.answers.previousName="Yes";
  assert.ok(validateDetailedIntake(p).formerSurname);
  p.answers.previousName="No";
  p.answers.singleMother="Yes";
  assert.ok(validateDetailedIntake(p).motherSurname);
  assert.equal(validateDetailedIntake(p).fatherSurname,undefined);
});

test("malformed Aadhaar, unknown selections and unrecognized fields fail",()=>{
  const v=complete("voter");
  v.answers.aadhaarStatus="Yes";
  v.answers.aadhaarNumber="1234";
  assert.match(validateDetailedIntake(v).aadhaarNumber,/12 digits/);
  v.answers.aadhaarNumber="123456789012";
  v.answers.requestType="wrong";
  assert.ok(validateDetailedIntake(v).requestType);
  v.answers.hack="injected";
  assert.ok(validateDetailedIntake(v).hack);
});
