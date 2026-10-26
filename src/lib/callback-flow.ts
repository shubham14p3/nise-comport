/**
 * Callback lifecycle does not create a government application or payment.
 * The service link is a public entry point, never a token or personal-data URL.
 */
export const CALLBACK_STATUSES = ["new","called","online_invited","offline_closed","done","spam"] as const;
export type CallbackStatus = (typeof CALLBACK_STATUSES)[number];
export function isServiceCallback(details: unknown): details is {kind:"service_callback"; email:string; serviceSlug:string} {
  if (!details || typeof details !== "object") return false;
  const item=details as Record<string,unknown>;
  return item.kind==="service_callback" && typeof item.email==="string" &&
    typeof item.serviceSlug==="string" && /^[a-z0-9-]{2,80}$/.test(item.serviceSlug);
}
export function callbackOnlinePath(serviceSlug: string): string {
  if (!/^[a-z0-9-]{2,80}$/.test(serviceSlug)) throw new Error("Invalid service.");
  if (serviceSlug === "voter-id") return "/voter";
  if (serviceSlug === "pan-card") return "/pan/request";
  if (serviceSlug === "bike-insurance") return "/insurance?vehicle=bike#quote";
  if (serviceSlug === "car-insurance") return "/insurance?vehicle=car#quote";
  if (serviceSlug === "insurance") return "/insurance#quote";
  return serviceSlug === "other" ? "/request" : "/request?service="+encodeURIComponent(serviceSlug);
}
export function callbackStatusLabel(status:string){
  return ({
    new:"New callback",called:"Contacted",online_invited:"Online form invited",
    offline_closed:"Closed offline",done:"Closed",spam:"Spam"
  } as Record<string,string>)[status]||status;
}
