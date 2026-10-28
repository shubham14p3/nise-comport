import { after } from "next/server";
import { and, count, desc, eq, inArray, sql } from "drizzle-orm";
import { contacts, leads, users } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { db } from "@/lib/db";
import { sendServiceFormInvitationEmail, sendStaffAlertEmail, smtpConfigured } from "@/lib/email";
import { PublicError } from "@/lib/errors";
import { staffAlertEmail } from "@/lib/notifications";
import { site } from "@/lib/site";
import { resolveService } from "@/lib/site-content";
import { requestHrefFor } from "@/lib/services";
import { canTakeCallbackAction } from "@/lib/service-callback-flow";
import { isMainOwner } from "@/lib/permissions";
import { formatPhone, normalizePhone } from "@/lib/validation";

export type LeadInput = { name?: string; phone: string; email?: string; serviceSlug?: string; topic?: string; message?: string; page?: string; locale?: string; source?: string; details?: Record<string, unknown> };
export const LEAD_STATUSES = ["new", "called", "online_invited", "offline_closed", "done", "spam"] as const;

/** A customer asked to be contacted. Saved, shown in the admin inbox and emailed to the shop. */
export async function createLead(input: LeadInput) {
  const phone = normalizePhone(input.phone ?? "");
  if (!phone) throw new PublicError("Please enter a valid 10-digit mobile number.", 400, { fields: { phone: "Check the number." } });
  const name = (input.name ?? "").replace(/[^\p{L}\p{M}\s.'-]/gu, " ").replace(/\s+/g, " ").trim().slice(0, 80) || "Customer";
  let topic = (input.topic ?? "").replace(/\s+/g, " ").trim().slice(0, 80) || "General enquiry";
  const message = (input.message ?? "").replace(/[ \t]+/g, " ").trim().slice(0, 1500) || null;
  const locale = ["en", "hi", "bn"].includes(input.locale ?? "") ? input.locale! : "en";
  // Service-specific callbacks collect only these three contact fields.
  // Store the email inside structured details so the existing PostgreSQL schema remains unchanged.
  const email = (input.email ?? "").trim().toLowerCase();
  const serviceSlug = input.serviceSlug ?? "";
  if(input.source==="service-callback"){
    if(name==="Customer" || name.length<2)throw new PublicError("Please enter your full name.",400);
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length>200)throw new PublicError("Enter a valid email address.",400,{fields:{email:"Enter a valid email address."}});
    if(!/^[a-z0-9-]{2,80}$/.test(serviceSlug))throw new PublicError("Choose an available service.",400);
    const service=await resolveService(serviceSlug);
    if(!service)throw new PublicError("Choose an available service.",400);
    topic=service.title.slice(0,80);
  }
  const details = input.source==="service-callback"
    ? {serviceSlug,email,origin:"service-callback",consentedToCallback:true}
    : input.details ?? null;
  const [row] = await db.insert(leads).values({ name, phone, topic, message, page: input.page?.slice(0, 200) || null, locale, source: input.source === "form" || input.source === "wizard" || input.source==="service-callback" ? input.source : "chat", details }).returning();
  // Keep the number for WhatsApp follow-up without changing an existing YES/STOP.
  // Callback consent is service-specific, not permission to add this person to a marketing contact list.
  if(input.source!=="service-callback") await db.insert(contacts).values({ name, phone, locale, source: "enquiry", services: [] }).onConflictDoNothing();
  await logActivity({ kind: "lead", permission: "requests", category: "leads", title: `Call back ${name} · ${formatPhone(phone)}`, detail: `${topic}${message ? ` — ${message}` : ""}`, refType: "lead", refId: row.id });
  after(async () => {
    if (!smtpConfigured()) return;
    try { await sendStaffAlertEmail(staffAlertEmail(), `New enquiry: ${topic}`, [`Name: ${name}`, `Mobile: ${formatPhone(phone)}`, `About: ${topic}`, ...(email ? [`Email: ${email}`] : []), ...(message ? [`Message: ${message}`] : []), `From: ${input.page || "chat"}`], `${site.url}/admin#inbox`); }
    catch (error) { console.error("[leads] alert email failed", error); }
  });
  return row;
}

/** Mark an invited callback as converted only when the same customer signed in
 * with the invited email, matching mobile and service. Other callbacks remain untouched. */
export async function completeInvitedServiceCallback(phone: string, email: string, serviceSlug: string) {
  const normal=normalizePhone(phone);
  const verifiedEmail=email.trim().toLowerCase();
  if(!normal||!verifiedEmail||!serviceSlug)return;
  await db.update(leads).set({status:"done",handledAt:new Date()})
    .where(and(
      eq(leads.phone,normal),eq(leads.source,"service-callback"),eq(leads.status,"online_invited"),
      sql`${leads.details}->>'serviceSlug' = ${serviceSlug}`,
      sql`lower(${leads.details}->>'email') = ${verifiedEmail}`,
    ));
}

/** Closes "started a request" call-backs once that number has sent the full request. */
export async function closeWizardLeads(phone: string) {
  const normal = normalizePhone(phone);
  if (!normal) return;
  await db.update(leads).set({ status: "done", handledAt: new Date() }).where(and(eq(leads.phone, normal), eq(leads.source, "wizard"), eq(leads.status, "new")));
}

/** True when the callback is held by the main owner. Only the main owner may take it over or change it. */
async function heldByMainOwner(handledBy: string | null) {
  if (!handledBy) return false;
  const [holder] = await db.select({ role: users.role, email: users.email }).from(users).where(eq(users.id, handledBy)).limit(1);
  return isMainOwner(holder);
}

/** Claim the callback; admin can take over an existing assignment.
 * handledBy is durable owner, actorId in logActivity tracks each action. */
export async function claimLead(id:string,actor:{id:string;name:string;role:string;email?:string|null}) {
  const [old]=await db.select().from(leads).where(eq(leads.id,id)).limit(1);
  if(!old || old.source!=="service-callback")throw new PublicError("Callback not found.",404);
  if(!["new","called","online_invited"].includes(old.status))throw new PublicError("This callback is already closed.",409);
  if(old.handledBy===actor.id)return old;
  if(!isMainOwner(actor) && await heldByMainOwner(old.handledBy))throw new PublicError("The main owner holds this callback. Only the main owner can change it.",403);
  if(old.handledBy && actor.role!=="admin")throw new PublicError("This callback belongs to another teammate. Ask an admin to reassign it.",409);
  const [row]=await db.update(leads).set({handledBy:actor.id}).where(and(
    eq(leads.id,id),old.handledBy?eq(leads.handledBy,old.handledBy):sql`${leads.handledBy} is null`
  )).returning();
  if(!row)throw new PublicError("Another staff member just claimed this callback. Refresh to see who.",409);
  await logActivity({kind:"lead",permission:"requests",category:"leads",title:`${actor.name} ${old.handledBy?"reassigned":"took"} the callback for ${row.name}`,refType:"lead",refId:row.id,actorId:actor.id});
  return row;
}

export async function updateLead(id: string, status: (typeof LEAD_STATUSES)[number], actor: { id: string; name: string; role?: string; email?: string | null }) {
  const [existing]=await db.select().from(leads).where(eq(leads.id,id)).limit(1);
  if(!existing)throw new PublicError("That enquiry no longer exists.",404);
  if(existing.source==="service-callback"){
    if(!existing.handledBy)throw new PublicError("Tap Take case before changing a callback.",409);
    if(existing.handledBy!==actor.id && actor.role!=="admin")
      throw new PublicError("This callback is assigned to another staff member.",403);
    if(existing.handledBy!==actor.id && !isMainOwner(actor) && await heldByMainOwner(existing.handledBy))
      throw new PublicError("The main owner holds this callback. Only the main owner can change it.",403);
  }
  if(existing.source==="service-callback" && existing.status===status)return existing;
  if(existing.source==="service-callback" && !canTakeCallbackAction(existing.status,status))
    throw new PublicError("This callback action is not available at its current stage.",409);
  if(["online_invited","offline_closed"].includes(status) && existing.source!=="service-callback")
    throw new PublicError("This action is only available for service callback requests.",400);
  if(status==="online_invited"){
    if(existing.status==="online_invited")return existing;
    if(!["new","called"].includes(existing.status))throw new PublicError("This callback is already closed.",409);
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
  const [row] = await db.update(leads).set({ status, handledBy: existing.handledBy??actor.id, handledAt: new Date() }).where(and(eq(leads.id, id),eq(leads.status,existing.status))).returning();
  if (!row) throw new PublicError("This callback was changed by someone else. Refresh the inbox.", 409);
  const verb = { new: "reopened", called: "called", online_invited: "sent the online form to", offline_closed: "closed the offline callback for", done: "closed", spam: "marked as spam" }[status];
  await logActivity({ kind: "lead", permission: "requests", category: "leads", title: `${actor.name} ${verb} the enquiry from ${row.name}`, detail: row.topic, refType: "lead", refId: row.id, actorId: actor.id });
  return row;
}

export async function listLeads(statuses: string[] = ["new", "called", "online_invited"]) {
  return db.select().from(leads).where(inArray(leads.status, statuses)).orderBy(desc(leads.createdAt)).limit(100);
}

/** Callback tabs: Open is new; Called includes online-form-sent; Closed is done or offline; Spam is kept apart. */
export const CALLBACK_TABS = {
  open: ["new"],
  called: ["called", "online_invited"],
  closed: ["done", "offline_closed"],
  spam: ["spam"],
} as const;
export type CallbackTab = keyof typeof CALLBACK_TABS;
export const CALLBACK_PAGE_SIZE = 15;

/** One page of callbacks for a tab, with counts for every tab. `mine` limits it to the viewer's own callbacks. */
export async function listCallbackPage(input: { tab: CallbackTab; mine: boolean; viewerId: string; page: number }) {
  const scope = input.mine ? eq(leads.handledBy, input.viewerId) : undefined;
  const page = Math.max(0, Math.floor(input.page));
  const statuses = [...CALLBACK_TABS[input.tab]];
  const rows = await db.select({ lead: leads, ownerName: users.name }).from(leads)
    .leftJoin(users, eq(leads.handledBy, users.id))
    .where(and(inArray(leads.status, statuses), scope))
    .orderBy(desc(leads.createdAt))
    .limit(CALLBACK_PAGE_SIZE).offset(page * CALLBACK_PAGE_SIZE);
  const [totals] = await db.select({ total: count() }).from(leads).where(and(inArray(leads.status, statuses), scope));
  const byStatus = await db.select({ status: leads.status, total: count() }).from(leads).where(scope).groupBy(leads.status);
  const tabCounts = Object.fromEntries(
    (Object.keys(CALLBACK_TABS) as CallbackTab[]).map((tab) => [tab, byStatus.filter((row) => (CALLBACK_TABS[tab] as readonly string[]).includes(row.status)).reduce((sum, row) => sum + row.total, 0)]),
  ) as Record<CallbackTab, number>;
  return { rows: rows.map((item) => ({ ...item.lead, ownerName: item.ownerName })), total: totals?.total ?? 0, tabCounts, tab: input.tab, mine: input.mine, page, pageSize: CALLBACK_PAGE_SIZE };
}
