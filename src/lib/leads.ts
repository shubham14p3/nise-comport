import { after } from "next/server";
import { and, desc, eq, inArray } from "drizzle-orm";
import { contacts, leads } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { db } from "@/lib/db";
import { sendMail, sendStaffAlertEmail, smtpConfigured } from "@/lib/email";
import { PublicError } from "@/lib/errors";
import { staffAlertEmail } from "@/lib/notifications";
import { site } from "@/lib/site";
import { formatPhone, normalizePhone } from "@/lib/validation";
import { CALLBACK_STATUSES, callbackOnlinePath, isServiceCallback, type CallbackStatus } from "@/lib/callback-flow";

export type LeadInput = { name?: string; phone: string; topic?: string; message?: string; page?: string; locale?: string; source?: string; details?: Record<string, unknown> };
export const LEAD_STATUSES = CALLBACK_STATUSES;

/** A customer asked to be contacted. Saved, shown in the admin inbox and emailed to the shop. */
export async function createLead(input: LeadInput) {
  const phone = normalizePhone(input.phone ?? "");
  if (!phone) throw new PublicError("Please enter a valid 10-digit mobile number.", 400, { fields: { phone: "Check the number." } });
  const name = (input.name ?? "").replace(/[^\p{L}\p{M}\s.'-]/gu, " ").replace(/\s+/g, " ").trim().slice(0, 80) || "Customer";
  const topic = (input.topic ?? "").replace(/\s+/g, " ").trim().slice(0, 80) || "General enquiry";
  const message = (input.message ?? "").replace(/[ \t]+/g, " ").trim().slice(0, 1500) || null;
  const locale = ["en", "hi", "bn"].includes(input.locale ?? "") ? input.locale! : "en";
  const [row] = await db.insert(leads).values({ name, phone, topic, message, page: input.page?.slice(0, 200) || null, locale, source: input.source === "form" || input.source === "wizard" ? input.source : "chat", details: input.details ?? null }).returning();
  // Keep the number for WhatsApp follow-up without changing an existing YES/STOP.
  await db.insert(contacts).values({ name, phone, locale, source: "enquiry", services: [] }).onConflictDoNothing();
  await logActivity({ kind: "lead", permission: "requests", category: "leads", title: `Call back ${name} · ${formatPhone(phone)}`, detail: `${topic}${message ? ` — ${message}` : ""}`, refType: "lead", refId: row.id });
  after(async () => {
    if (!smtpConfigured()) return;
    try { await sendStaffAlertEmail(staffAlertEmail(), `New enquiry: ${topic}`, [`Name: ${name}`, `Mobile: ${formatPhone(phone)}`, `About: ${topic}`, ...(message ? [`Message: ${message}`] : []), `From: ${input.page || "chat"}`], `${site.url}/admin#inbox`); }
    catch (error) { console.error("[leads] alert email failed", error); }
  });
  return row;
}

/** Close automatic wizard leads and only the matching invited callback when an application is sent. */
export async function closeWizardLeads(phone: string, serviceSlug?: string, reference?: string) {
  const normal = normalizePhone(phone);
  if (!normal) return;
  await db.update(leads).set({ status:"done",handledAt:new Date() })
    .where(and(eq(leads.phone,normal),eq(leads.source,"wizard"),eq(leads.status,"new")));
  if (!serviceSlug) return;
  const invited=await db.select().from(leads)
    .where(and(eq(leads.phone,normal),eq(leads.status,"online_invited"))).limit(100);
  for(const row of invited){
    if(!isServiceCallback(row.details)||row.details.serviceSlug!==serviceSlug)continue;
    const details=row.details && typeof row.details==="object" ? row.details as Record<string,unknown> : {};
    await db.update(leads).set({status:"done",handledAt:new Date(),
      details:{...details,outcome:"online",completedAt:new Date().toISOString(),
        ...(reference?{requestReference:reference}:{})},
    }).where(and(eq(leads.id,row.id),eq(leads.status,"online_invited")));
  }
}

export async function updateLead(id: string, status: CallbackStatus, actor: { id: string; name: string }) {
  const [existing] = await db.select().from(leads).where(eq(leads.id,id)).limit(1);
  if (!existing) throw new PublicError("That enquiry no longer exists.",404);
  if(status==="online_invited" && !isServiceCallback(existing.details)){
    throw new PublicError("Only an enquiry with a valid service and email can receive an online form invitation.",400);
  }
  if(status==="online_invited" && existing.status==="online_invited"){
    throw new PublicError("An online form invitation was already sent. Reopen the enquiry before sending again.",409);
  }
  const details = existing.details && typeof existing.details === "object" ? existing.details as Record<string,unknown> : {};
  const nextDetails:Record<string,unknown> = {
    ...details,
    ...(status==="online_invited" ? {outcome:"online", invitedAt:new Date().toISOString()} : {}),
    ...(status==="offline_closed" ? {outcome:"offline",closedAt:new Date().toISOString()} : {}),
  };
  // Only report an invitation as sent if outbound mail succeeded. Never put customer PII in the URL.
  if (status==="online_invited" && isServiceCallback(existing.details)) {
    const url = site.url + callbackOnlinePath(existing.details.serviceSlug);
    await sendMail({
      to: existing.details.email, subject: "Complete your NISE COMPORT online service request",
      heading: "Your online application link",
      paragraphs: [
        `Hello ${existing.name},`,
        `Following our conversation about ${existing.topic}, please complete the online form using the link below.`,
        "Sign in when asked to preview your completed application. Do not reply with Aadhaar, PAN, passwords or OTPs.",
        "This is an Nise Comport assistance request; it does not submit an application to a government portal."
      ],
      action: {label:"Open my service form",href:url},
    });
  }
  const [row] = await db.update(leads).set({
    status,details:nextDetails,handledBy:actor.id,handledAt:new Date()
  }).where(and(eq(leads.id,id),eq(leads.status,existing.status))).returning();
  if(!row)throw new PublicError("This enquiry changed while you were updating it. Reload the inbox.",409);
  const verb:Record<CallbackStatus,string>={new:"reopened",called:"called",online_invited:"sent the online form to",offline_closed:"closed offline",done:"closed",spam:"marked as spam"};
  await logActivity({kind:"lead",permission:"requests",category:"leads",title:`${actor.name} ${verb[status]} the enquiry from ${row.name}`,detail:row.topic,refType:"lead",refId:row.id,actorId:actor.id});
  return row;
}

export async function listLeads(statuses: string[] = ["new", "called", "online_invited"]) {
  return db.select().from(leads).where(inArray(leads.status, statuses)).orderBy(desc(leads.createdAt)).limit(100);
}
