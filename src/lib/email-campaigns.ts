import { createHmac, timingSafeEqual } from "node:crypto";
import { and, asc, count, desc, eq, gt, inArray, isNotNull, lte, ne, sql } from "drizzle-orm";
import { contacts, emailCampaigns, emailDeliveries, users } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import type { User } from "@/lib/auth";
import { db } from "@/lib/db";
import { PublicError } from "@/lib/errors";
import { sendCampaignMail } from "@/lib/email";
import { site } from "@/lib/site";

const MAX_IMAGE_CHARS = 400_000; // about 300 KB
const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
const BATCH = 25;

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char] ?? char));

/** Unsubscribe link token. Changes if the signing secret changes; never reveals the contact. */
export function unsubscribeToken(contactId: string) {
  return createHmac("sha256", process.env.OTP_SECRET ?? "unsubscribe").update(`unsubscribe:${contactId}`).digest("base64url").slice(0, 40);
}
export function unsubscribeUrl(contactId: string) {
  return `${site.url}/api/unsubscribe/email?c=${encodeURIComponent(contactId)}&t=${unsubscribeToken(contactId)}`;
}
export function tokenMatches(contactId: string, token: string) {
  const expected = Buffer.from(unsubscribeToken(contactId));
  const received = Buffer.from(token);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export async function createEmailCampaign(input: { subject: string; body: string; image?: { type: string; data: string } }, actor: User) {
  const subject = input.subject.trim();
  const body = input.body.trim();
  if (subject.length < 3 || subject.length > 150) throw new PublicError("The subject needs 3 to 150 characters.", 400, { fields: { subject: "3 to 150 characters." } });
  if (body.length < 10 || body.length > 5000) throw new PublicError("The message needs 10 to 5,000 characters.", 400, { fields: { body: "10 to 5,000 characters." } });
  let imageType: string | null = null;
  let imageData: string | null = null;
  if (input.image) {
    if (!IMAGE_TYPES.includes(input.image.type)) throw new PublicError("Use a PNG, JPG or WebP image.", 400);
    if (input.image.data.length > MAX_IMAGE_CHARS) throw new PublicError("The image is larger than 300 KB. Save it smaller and try again.", 400);
    imageType = input.image.type;
    imageData = input.image.data;
  }
  const [row] = await db.insert(emailCampaigns).values({ subject, body, imageType, imageData, createdBy: actor.id }).returning({ id: emailCampaigns.id });
  return { id: row.id };
}

/**
 * Schedules a campaign. Recipients are fixed at this moment: contacts who said YES and have an email.
 * sendAt null means "send as soon as the scheduler runs".
 */
export async function scheduleEmailCampaign(id: string, sendAt: Date | null, actor: User) {
  const [campaign] = await db.select().from(emailCampaigns).where(eq(emailCampaigns.id, id)).limit(1);
  if (!campaign) throw new PublicError("Unknown campaign.", 404);
  if (!["draft", "scheduled"].includes(campaign.status)) throw new PublicError("This campaign has already started.", 409);
  if (sendAt && sendAt.getTime() < Date.now() - 60_000) throw new PublicError("Choose a time in the future.", 400);
  const recipients = await db.select({ id: contacts.id, email: contacts.email }).from(contacts)
    .where(and(eq(contacts.consent, "opted_in"), isNotNull(contacts.email), ne(contacts.email, ""))).limit(50_000);
  const unique = new Map<string, string>();
  for (const row of recipients) if (row.email && !unique.has(row.email.toLowerCase())) unique.set(row.email.toLowerCase(), row.id);
  if (!unique.size) throw new PublicError("No one can be emailed yet. Contacts must say YES and have an email address.", 400);
  await db.delete(emailDeliveries).where(eq(emailDeliveries.campaignId, id));
  const values = [...unique.entries()].map(([email, contactId]) => ({ campaignId: id, contactId, email }));
  for (let offset = 0; offset < values.length; offset += 500) await db.insert(emailDeliveries).values(values.slice(offset, offset + 500));
  await db.update(emailCampaigns).set({ status: "scheduled", sendAt: sendAt ?? new Date(), total: values.length, updatedAt: new Date() }).where(eq(emailCampaigns.id, id));
  await logActivity({ kind: "campaign", permission: "campaigns", category: "campaigns", title: `${actor.name} scheduled an email campaign`, detail: `${campaign.subject} · ${values.length} people · ${sendAt ? sendAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "as soon as possible"}`, refType: "campaign", refId: id, actorId: actor.id });
  return { id, total: values.length };
}

export async function cancelEmailCampaign(id: string, actor: User) {
  const [campaign] = await db.select({ status: emailCampaigns.status, subject: emailCampaigns.subject }).from(emailCampaigns).where(eq(emailCampaigns.id, id)).limit(1);
  if (!campaign) throw new PublicError("Unknown campaign.", 404);
  if (!["draft", "scheduled"].includes(campaign.status)) throw new PublicError("Only drafts or scheduled campaigns can be cancelled.", 409);
  await db.update(emailCampaigns).set({ status: "cancelled", updatedAt: new Date() }).where(eq(emailCampaigns.id, id));
  await logActivity({ kind: "campaign", permission: "campaigns", category: "campaigns", title: `${actor.name} cancelled an email campaign`, detail: campaign.subject, refType: "campaign", refId: id, actorId: actor.id });
  return { id, status: "cancelled" };
}

export async function listEmailCampaigns() {
  const rows = await db.select({
    id: emailCampaigns.id, subject: emailCampaigns.subject, status: emailCampaigns.status, sendAt: emailCampaigns.sendAt, total: emailCampaigns.total,
    sentCount: emailCampaigns.sentCount, failedCount: emailCampaigns.failedCount, hasImage: sql<boolean>`${emailCampaigns.imageData} is not null`,
    createdAt: emailCampaigns.createdAt, createdBy: users.name,
  }).from(emailCampaigns).leftJoin(users, eq(emailCampaigns.createdBy, users.id)).orderBy(desc(emailCampaigns.createdAt)).limit(50);
  const [eligible] = await db.select({ total: count() }).from(contacts).where(and(eq(contacts.consent, "opted_in"), isNotNull(contacts.email), ne(contacts.email, "")));
  return {
    campaigns: rows.map((row) => ({ ...row, sendAt: row.sendAt?.toISOString() ?? null, createdAt: row.createdAt.toISOString() })),
    eligible: Number(eligible?.total ?? 0), dailyLimit: dailyLimit(),
  };
}

function dailyLimit() {
  const value = Number(process.env.EMAIL_DAILY_LIMIT ?? 200);
  return Number.isFinite(value) && value > 0 ? Math.min(Math.floor(value), 5000) : 200;
}

/**
 * Sends what is due, respecting the daily limit. Called by the scheduler (cron) every few minutes.
 * Each email: the message, the poster (if any), and a one-click unsubscribe link.
 */
export async function runDueEmailCampaigns(now = new Date()) {
  const since = new Date(now.getTime() - 24 * 60 * 60_000);
  const [{ sent24 }] = await db.select({ sent24: count() }).from(emailDeliveries).where(and(eq(emailDeliveries.status, "sent"), gt(emailDeliveries.sentAt, since)));
  let remaining = Math.max(0, dailyLimit() - Number(sent24));
  if (remaining === 0) return { sent: 0, failed: 0, skippedForLimit: true };
  const due = await db.select().from(emailCampaigns).where(and(inArray(emailCampaigns.status, ["scheduled", "sending"]), lte(emailCampaigns.sendAt, now))).orderBy(asc(emailCampaigns.sendAt)).limit(5);
  let sent = 0;
  let failed = 0;
  for (const campaign of due) {
    if (remaining <= 0) break;
    if (campaign.status === "scheduled") await db.update(emailCampaigns).set({ status: "sending", updatedAt: now }).where(eq(emailCampaigns.id, campaign.id));
    const pending = await db.select().from(emailDeliveries).where(and(eq(emailDeliveries.campaignId, campaign.id), eq(emailDeliveries.status, "pending"))).limit(Math.min(BATCH, remaining));
    if (!pending.length) {
      await db.update(emailCampaigns).set({ status: "done", updatedAt: new Date() }).where(eq(emailCampaigns.id, campaign.id));
      continue;
    }
    const image = campaign.imageData && campaign.imageType ? { type: campaign.imageType, data: Buffer.from(campaign.imageData.split(",").pop() ?? "", "base64") } : undefined;
    for (const delivery of pending) {
      const contactId = delivery.contactId ?? "";
      const link = contactId ? unsubscribeUrl(contactId) : `${site.url}/contact`;
      const paragraphs = campaign.body.split(/\n{2,}/).map((part) => `<p style="margin:0 0 14px;line-height:1.6">${escapeHtml(part).replace(/\n/g, "<br>")}</p>`).join("");
      const html = `<div style="font-family:Arial,sans-serif;color:#1d1d1b;max-width:600px">
        ${image ? `<img src="cid:poster" alt="" style="width:100%;border-radius:12px;margin-bottom:16px"/>` : ""}
        ${paragraphs}
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0"/>
        <p style="font-size:12px;color:#6b7280;line-height:1.5">${escapeHtml(site.name)} · ${escapeHtml(site.address.street)}, ${escapeHtml(site.address.locality)}, ${escapeHtml(site.address.city)}, ${escapeHtml(site.address.region)} ${escapeHtml(site.address.postalCode)}<br>
        You are receiving this because you asked us to keep you informed. <a href="${link}" style="color:#6b7280">Unsubscribe</a></p></div>`;
      const text = `${campaign.body}\n\n${site.name}, ${site.address.street}, ${site.address.locality}, ${site.address.city}\nUnsubscribe: ${link}`;
      try {
        await sendCampaignMail({ to: delivery.email, subject: campaign.subject, html, text, unsubscribeUrl: link, image });
        await db.update(emailDeliveries).set({ status: "sent", sentAt: new Date(), error: null }).where(eq(emailDeliveries.id, delivery.id));
        sent++;
      } catch (error) {
        await db.update(emailDeliveries).set({ status: "failed", error: (error instanceof Error ? error.message : "send failed").slice(0, 200) }).where(eq(emailDeliveries.id, delivery.id));
        failed++;
      }
      remaining--;
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    const [counts] = await db.select({ sentCount: sql<number>`count(*) filter (where ${emailDeliveries.status} = 'sent')::int`, failedCount: sql<number>`count(*) filter (where ${emailDeliveries.status} = 'failed')::int`, pendingCount: sql<number>`count(*) filter (where ${emailDeliveries.status} = 'pending')::int` }).from(emailDeliveries).where(eq(emailDeliveries.campaignId, campaign.id));
    await db.update(emailCampaigns).set({ sentCount: counts.sentCount, failedCount: counts.failedCount, status: counts.pendingCount === 0 ? "done" : "sending", updatedAt: new Date() }).where(eq(emailCampaigns.id, campaign.id));
  }
  return { sent, failed, skippedForLimit: remaining <= 0 };
}

/** Unsubscribe from campaign emails: the contact is marked as having said NO. */
export async function unsubscribeContact(contactId: string) {
  await db.update(contacts).set({ consent: "opted_out", updatedAt: new Date() }).where(eq(contacts.id, contactId));
}
