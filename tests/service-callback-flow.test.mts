import test from "node:test";
import assert from "node:assert/strict";
import { canTakeCallbackAction, isCallbackStatus } from "../src/lib/service-callback-flow.ts";

test("new callback may be contacted, sent online or closed offline",()=>{
  assert.equal(canTakeCallbackAction("new","called"),true);
  assert.equal(canTakeCallbackAction("new","online_invited"),true);
  assert.equal(canTakeCallbackAction("new","offline_closed"),true);
  assert.equal(canTakeCallbackAction("called","online_invited"),true);
  assert.equal(canTakeCallbackAction("called","offline_closed"),true);
});
test("offline cases close; online cases stay open until the full form is submitted",()=>{
  assert.equal(canTakeCallbackAction("offline_closed","online_invited"),false);
  assert.equal(canTakeCallbackAction("online_invited","done"),true);
  assert.equal(canTakeCallbackAction("online_invited","offline_closed"),true);
  assert.equal(canTakeCallbackAction("new","done"),false);
  assert.equal(canTakeCallbackAction("done","online_invited"),false);
});
test("invalid callback statuses cannot be accepted",()=>{
  assert.equal(isCallbackStatus("online_invited"),true);
  assert.equal(isCallbackStatus("offline_closed"),true);
  assert.equal(isCallbackStatus("faked_payment"),false);
  assert.equal(canTakeCallbackAction("spam","online_invited"),false);
});
