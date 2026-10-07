import { after } from "next/server";
import { desc, eq, inArray } from "drizzle-orm";
import { contacts, leads } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { db } from "@/lib/db";
import { sendStaffAlertEmail, smtpConfigured } from "@/lib/email";
import { PublicError } from "@/lib/errors";
import { staffAlertEmail } from "@/lib/notifications";
import { site } from "@/lib/site";
import { formatPhone, normalizePhone } from "@/lib/validation";

export type LeadInput = { name?: string; phone: string; topic?: string; message?: string; page?: string; locale?: string; source?: string; details?: Record<string, unknown> };
export const LEAD_STATUSES = ["new", "called", "done", "spam"] as const;

/** A customer asked to be contacted. Saved, shown in the admin inbox and emailed to the shop. */
export async function createLead(input: LeadInput) {
  const phone = normalizePhone(input.phone ?? "");
  if (!phone) throw new PublicError("Please enter a valid 10-digit mobile number.", 400, { fields: { phone: "Check the number." } });
  const name = (input.name ?? "").replace(/[^\p{L}\p{M}\s.'-]/gu, " ").replace(/\s+/g, " ").trim().slice(0, 80) || "Customer";
  const topic = (input.topic ?? "").replace(/\s+/g, " ").trim().slice(0, 80) || "General enquiry";
  const message = (input.message ?? "").replace(/[ \t]+/g, " ").trim().slice(0, 1500) || null;
  const locale = ["en", "hi", "bn"].includes(input.locale ?? "") ? input.locale! : "en";
  const [row] = await db.insert(leads).values({ name, phone, topic, message, page: input.page?.slice(0, 200) || null, locale, source: input.source === "form" ? "form" : "chat", details: input.details ?? null }).returning();
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

export async function updateLead(id: string, status: (typeof LEAD_STATUSES)[number], actor: { id: string; name: string }) {
  const [row] = await db.update(leads).set({ status, handledBy: actor.id, handledAt: new Date() }).where(eq(leads.id, id)).returning();
  if (!row) throw new PublicError("That enquiry no longer exists.", 404);
  const verb = { new: "reopened", called: "called", done: "closed", spam: "marked as spam" }[status];
  await logActivity({ kind: "lead", permission: "requests", category: "leads", title: `${actor.name} ${verb} the enquiry from ${row.name}`, detail: row.topic, refType: "lead", refId: row.id, actorId: actor.id });
  return row;
}

export async function listLeads(statuses: string[] = ["new", "called"]) {
  return db.select().from(leads).where(inArray(leads.status, statuses)).orderBy(desc(leads.createdAt)).limit(100);
}
