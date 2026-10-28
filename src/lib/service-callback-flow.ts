/**
 * Callback decisions are intentionally separate from the full authenticated application.
 * No government application or payment is created by requesting a callback.
 */
export const SERVICE_CALLBACK_STATUSES=["new","called","online_invited","offline_closed","done","spam"] as const;
export type ServiceCallbackStatus=(typeof SERVICE_CALLBACK_STATUSES)[number];

export function isCallbackStatus(value:string):value is ServiceCallbackStatus{
  return SERVICE_CALLBACK_STATUSES.some(status=>status===value);
}
export function canTakeCallbackAction(current:string,next:ServiceCallbackStatus){
  if(next==="online_invited")return current==="new"||current==="called";
  if(next==="offline_closed")return ["new","called","online_invited"].includes(current);
  if(next==="called")return current==="new";
  if(next==="done")return current==="online_invited";
  if(next==="spam")return ["new","called","online_invited"].includes(current);
  if(next==="new")return ["called","offline_closed"].includes(current);
  return false;
}
