import test from "node:test";
import assert from "node:assert/strict";
import {profileChanges,formatAuditChange} from "../src/lib/customer-audit.ts";

test("customer profile history records exact old/new fields, including corrections",()=>{
  const changes=profileChanges(
    {name:"Rahul Kumar",email:"old@example.com",phone:"+919876543210",postalCode:"831001"},
    {name:"Rahul Raj",email:"new@example.com",phone:"+919876543210",postalCode:"831004"}
  );
  assert.deepEqual(changes.map(change=>change.field),["name","email","postalCode"]);
  assert.match(formatAuditChange(changes[0]),/Rahul Kumar.*Rahul Raj/);
  assert.match(formatAuditChange(changes[1]),/old@example.com.*new@example.com/);
});

test("profile audit does not log passwords, login PINs, OTPs, secret tokens or unchanged fields",()=>{
  const changes=profileChanges(
    {name:"Test",passwordHash:"secret",otp:"123456",loginPinHash:"abcdef",phone:"+919123456789"},
    {name:"Test",passwordHash:"changed",otp:"222222",loginPinHash:"xyz",phone:"+919123456789"}
  );
  assert.equal(changes.length,0);
});

test("profile history distinguishes old blank field from new phone and limits details",()=>{
  const changes=profileChanges({phone:null,profileSummary:""},
    {phone:"+919123456789",profileSummary:"A".repeat(700)});
  assert.equal(changes.length,2);
  assert.equal(changes[0].before,null);
  assert.equal(changes[0].after,"+919123456789");
  assert.ok(formatAuditChange(changes[1]).length<=500);
});
