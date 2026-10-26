import assert from "node:assert/strict";
import test from "node:test";
import { CALLBACK_STATUSES, callbackOnlinePath, callbackStatusLabel, isServiceCallback } from "../src/lib/callback-flow.ts";

test("callback routing sends customers to existing service forms without account details in URLs",()=>{
  assert.equal(callbackOnlinePath("voter-id"),"/voter");
  assert.equal(callbackOnlinePath("pan-card"),"/pan/request");
  assert.equal(callbackOnlinePath("bike-insurance"),"/insurance?vehicle=bike#quote");
  assert.equal(callbackOnlinePath("car-insurance"),"/insurance?vehicle=car#quote");
  assert.equal(callbackOnlinePath("local-resident-certificate"),"/request?service=local-resident-certificate");
  assert.equal(callbackOnlinePath("other"),"/request");
});
test("malformed callback service slugs cannot form open redirects",()=>{
  for(const slug of ["https://other.test","//other.test","/profile","abc?email=x@y.com","", "a".repeat(81)]){
    assert.throws(()=>callbackOnlinePath(slug));
  }
});
test("legacy enquiries cannot receive unintended online email invitations",()=>{
  assert.equal(isServiceCallback({kind:"service_callback",email:"valid@example.com",serviceSlug:"voter-id"}),true);
  assert.equal(isServiceCallback({kind:"service_callback",email:"valid@example.com",serviceSlug:"https://evil.test"}),false);
  assert.equal(isServiceCallback({email:"valid@example.com",serviceSlug:"voter-id"}),false);
  assert.equal(isServiceCallback(null),false);
});
test("online invites stay tracked and offline closures have their own status",()=>{
  assert.ok(CALLBACK_STATUSES.includes("online_invited"));
  assert.ok(CALLBACK_STATUSES.includes("offline_closed"));
  assert.equal(callbackStatusLabel("offline_closed"),"Closed offline");
  assert.equal(callbackStatusLabel("online_invited"),"Online form invited");
});
