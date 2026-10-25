import test from "node:test";
import assert from "node:assert/strict";
import { canQuote, isReviewable, nextReviewStatus, workflowOf, isPostPaymentStage } from "../src/lib/review-workflow.ts";

test("admins and request-authorized staff can move between review and corrections",()=>{
  assert.equal(nextReviewStatus("start","submitted"),"reviewing");
  assert.equal(nextReviewStatus("changes","reviewing"),"waiting_for_customer");
  assert.equal(nextReviewStatus("start","waiting_for_customer"),"reviewing");
  assert.equal(nextReviewStatus("approve","reviewing"),"reviewing");
  assert.equal(nextReviewStatus("approve","payment_received"),null);
  assert.equal(nextReviewStatus("changes","completed"),null);
  assert.equal(isReviewable("waiting_for_customer"),true);
  assert.equal(isReviewable("completed"),false);
});
test("quote cannot be created without review approval",()=>{
  assert.equal(canQuote("submitted",{}),false);
  assert.equal(canQuote("reviewing",{}),false);
  assert.equal(canQuote("waiting_for_customer",{workflow:{approvedAt:"2026-10-25T00:00:00Z"}}),false);
  assert.equal(canQuote("reviewing",{workflow:{approvedAt:"2026-10-25T00:00:00Z"}}),true);
  assert.equal(workflowOf({workflow:{waitingFor:"Missing photo"}}).waitingFor,"Missing photo");
  assert.equal(isPostPaymentStage("payment_received"),true);
  assert.equal(isPostPaymentStage("awaiting_payment"),false);
});
