import { after } from "next/server";
import { and, desc, eq, inArray } from "drizzle-orm";
import { contacts, leads } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { db } from "@/lib/db";
import { sendServiceFormInvitationEmail, sendStaffAlertEmail, smtpConfigured } from "@/lib/email";
import { PublicError } from "@/lib/errors";
import { staffAlertEmail } from "@/lib/notifications";
import { site } from "@/lib/site";
import { resolveService } from "@/lib/site-content";
import { requestHrefFor } from "@/lib/services";
import { formatPhone, normalizePhone } from "@/lib/validation";

export type LeadInput = { name?: string; phone: string; email?: string; serviceSlug?: string; topic?: string; message?: string; page?: string; locale?: string; source?: string; details?: Record<string, unknown> };
export const LEAD_STATUSES = ["new", "called", "online_invited", "offline_closed", "done", "spam"] as const;

/** A customer asked to be contacted. Saved, shown in the admin inbox and emailed to the shop. */
export async function createLead(input: LeadInput) {
  const phone = normalizePhone(input.phone ?? "");
  if (!phone) throw new PublicError("Please enter a valid 10-digit mobile number.", 400, { fields: { phone: "Check the number." } });
  const name = (input.name ?? "").replace(/[^\p{L}\p{M}\s.'-]/gu, " ").replace(/\s+/g, " ").trim().slice(0, 80) || "Customer";
  const topic = (input.topic ?? "").replace(/\s+/g, " ").trim().slice(0, 80) || "General enquiry";
  const message = (input.message ?? "").replace(/[ \t]+/g, " ").trim().slice(0, 1500) || null;
  const locale = ["en", "hi", "bn"].includes(input.locale ?? "") ? input.locale! : "en";
  // Service-specific callbacks collect only these three contact fields.
  // Store the email inside structured details so the existing PostgreSQL schema remains unchanged.
  const email = (input.email ?? "").trim().toLowerCase();
  const serviceSlug = input.serviceSlug ?? "";
  if(input.source==="service-callback"){
    if(name==="Customer" || name.length<2)throw new PublicError("Please enter your full name.",400);
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length>200)throw new PublicError("Enter a valid email address.",400,{fields:{email:"Enter a valid email address."}});
    if(!/^[a-z0-9-]{2,80}$/.test(serviceSlug) || !(await resolveService(serviceSlug)))throw new PublicError("Choose an available service.",400);
  }
  const details = input.source==="service-callback"
    ? {serviceSlug,email,origin:"service-callback",consentedToCallback:true}
    : input.details ?? null;
  const [row] = await db.insert(leads).values({ name, phone, topic, message, page: input.page?.slice(0, 200) || null, locale, source: input.source === "form" || input.source === "wizard" || input.source==="service-callback" ? input.source : "chat", details }).returning();
  // Keep the number for WhatsApp follow-up without changing an existing YES/STOP.
  await db.insert(contacts).values({ name, phone, locale, source: "enquiry", services: [] }).onConflictDoNothing();
  await logActivity({ kind: "lead", permission: "requests", category: "leads", title: `Call back ${name} · ${formatPhone(phone)}`, detail: `${topic}${message ? ` — ${message}` : ""}`, refType: "lead", refId: row.id });
  after(async () => {
    if (!smtpConfigured()) return;
    try { await sendStaffAlertEmail(staffAlertEmail(), `New enquiry: ${topic}`, [`Name: ${name}`, `Mobile: ${formatPhone(phone)}`, `About: ${topic}`, ...(email ? [`Email: ${email}`] : []), ...(message ? [`Message: ${message}`] : []), `From: ${input.page || "chat"}`], `${site.url}/admin#inbox`); }
    catch (error) { console.error("[leads] alert email failed", error); }
  });
  return row;
}

/** Closes "started a request" call-backs once that number has sent the full request. */
export async function closeWizardLeads(phone: string) {
  const normal = normalizePhone(phone);
  if (!normal) return;
  await db.update(leads).set({ status: "done", handledAt: new Date() }).where(and(eq(leads.phone, normal), eq(leads.source, "wizard"), eq(leads.status, "new")));
}

export async function updateLead(id: string, status: (typeof LEAD_STATUSES)[number], actor: { id: string; name: string }) {
  const [existing]=await db.select().from(leads).where(eq(leads.id,id)).limit(1);
  if(!existing)throw new PublicError("That enquiry no longer exists.",404);
  if(["online_invited","offline_closed"].includes(status) && existing.source!=="service-callback")
    throw new PublicError("This action is only available for service callback requests.",400);
  if(status==="online_invited"){
    if(!["new","called","online_invited"].includes(existing.status))throw new PublicError("This callback is already closed.",409);
    const details=existing.details && typeof existing.details==="object"&&!Array.isArray(existing.details) ? existing.details as Record<string,unknown> : {};
    const email=typeof details.email==="string" ? details.email : "";
    const slug=typeof details.serviceSlug==="string" ? details.serviceSlug : "";
    if(!email || !slug)throw new PublicError("The customer's email or chosen service is missing.",400);
    const service=await resolveService(slug);
    if(!service)throw new PublicError("This service is currently unavailable.",409);
    if(!smtpConfigured())throw new PublicError("SMTP email must be configured before sending an online form link.",503);
    const href=requestHrefFor(slug);
    await sendServiceFormInvitationEmail(email,existing.name,service.title,`${site.url}${href}`);
  }
  if(status==="offline_closed" && !["new","called","online_invited"].includes(existing.status))
    throw new PublicError("This callback has already been closed.",409);
  const [row] = await db.update(leads).set({ status, handledBy: actor.id, handledAt: new Date() }).where(eq(leads.id, id)).returning();
  if (!row) throw new PublicError("That enquiry no longer exists.", 404);
  const verb = { new: "reopened", called: "called", online_invited: "sent the online form to", offline_closed: "closed the offline callback for", done: "closed", spam: "marked as spam" }[status];
  await logActivity({ kind: "lead", permission: "requests", category: "leads", title: `${actor.name} ${verb} the enquiry from ${row.name}`, detail: row.topic, refType: "lead", refId: row.id, actorId: actor.id });
  return row;
}

export async function listLeads(statuses: string[] = ["new", "called", "online_invited"]) {
  return db.select().from(leads).where(inArray(leads.status, statuses)).orderBy(desc(leads.createdAt)).limit(100);
}
