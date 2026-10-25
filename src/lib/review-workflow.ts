/** Review and payment stages, with explicit forward/backward correction cycles. */
export const REVIEW_STATES = ["submitted", "reviewing", "waiting_for_customer"] as const;
export type WorkflowMeta = {
  approvedAt?: string;
  waitingFor?: string;
  waitingSince?: string;
  lastCustomerReplyAt?: string;
  paymentCoupon?: { code: string; discountPaise: number };
};
export function workflowOf(details:unknown):WorkflowMeta {
  if (!details || typeof details!=="object") return {};
  const row=(details as Record<string,unknown>).workflow;
  return row && typeof row==="object" ? row as WorkflowMeta : {};
}
export function isReviewable(status:string) { return REVIEW_STATES.some(s=>s===status); }
export function canQuote(status:string,details:unknown) {
  return status==="reviewing" && Boolean(workflowOf(details).approvedAt);
}
export function nextReviewStatus(action:"start"|"changes"|"approve",current:string) {
  if (action==="start") return ["submitted","waiting_for_customer"].includes(current) ? "reviewing" : null;
  if (action==="changes") return ["submitted","reviewing","waiting_for_customer"].includes(current) ? "waiting_for_customer" : null;
  if (action==="approve") return ["submitted","reviewing","waiting_for_customer"].includes(current) ? "reviewing" : null;
  return null;
}
export function reviewPrompt(action:"start"|"changes"|"approve") {
  return action==="start" ? "Application is being reviewed" : action==="changes" ? "Additional information requested" : "Application details verified, awaiting payment quotation";
}
export function isPostPaymentStage(status:string) {
  return ["payment_received","ready_for_pickup","out_for_delivery","completed"].includes(status);
}
