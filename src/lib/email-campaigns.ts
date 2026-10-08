import { createHmac, timingSafeEqual } from "node:crypto";
import { type SQL, and, asc, count, desc, eq, gt, ilike, inArray, isNotNull, lte, ne, or, sql } from "drizzle-orm";
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

export async function createEmailCampaign(input: { subject: string; body: string; image?: { type: string; data: string }; audience?: "yes" | "selected"; audienceIds?: string[] }, actor: User) {
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
  const audience = input.audience ?? "yes";
  const audienceIds = audience === "selected" ? [...new Set(input.audienceIds ?? [])] : null;
  if (audience === "selected" && !audienceIds?.length) throw new PublicError("Pick at least one person, or send to everyone who said YES.", 400);
  const [row] = await db.insert(emailCampaigns).values({ subject, body, imageType, imageData, audience, audienceIds, createdBy: actor.id }).returning({ id: emailCampaigns.id });
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
    .where(and(eq(contacts.consent, "opted_in"), isNotNull(contacts.email), ne(contacts.email, ""), campaign.audience === "selected" && campaign.audienceIds?.length ? inArray(contacts.id, campaign.audienceIds) : undefined)).limit(50_000);
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

/* ---- Asking people to say YES by email (double opt-in) ---- */

const CONSENT_AGAIN_AFTER_DAYS = 30;
const CONSENT_ASK_LIMIT = 40;

export function consentToken(contactId: string) {
  return createHmac("sha256", process.env.OTP_SECRET ?? "unsubscribe").update(`consent:${contactId}`).digest("base64url").slice(0, 40);
}
export function consentUrl(contactId: string) {
  return `${site.url}/api/consent/email?c=${encodeURIComponent(contactId)}&t=${consentToken(contactId)}`;
}
function consentTokenMatches(contactId: string, token: string) {
  const expected = Buffer.from(consentToken(contactId));
  const received = Buffer.from(token);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

/** Emails each chosen person once, asking them to click YES. Skips anyone who already answered or was asked recently. */
export async function askForConsent(contactIds: string[], actor: User) {
  const ids = [...new Set(contactIds)].slice(0, CONSENT_ASK_LIMIT);
  if (!ids.length) throw new PublicError("Pick at least one person.", 400);
  const cutoff = new Date(Date.now() - CONSENT_AGAIN_AFTER_DAYS * 86_400_000);
  const rows = await db.select({ id: contacts.id, name: contacts.name, email: contacts.email, consent: contacts.consent, consentAskedAt: contacts.consentAskedAt })
    .from(contacts).where(inArray(contacts.id, ids));
  let sent = 0;
  let skipped = 0;
  let failed = 0;
  for (const row of rows) {
    if (row.consent !== "unknown" || !row.email || (row.consentAskedAt && row.consentAskedAt > cutoff)) { skipped++; continue; }
    const first = row.name.trim().split(/\s+/)[0] || "there";
    const text = `Namaste ${first},\n\nNISE COMPORT (Pragya Kendra, Kharangajhar, Jamshedpur) would like to send you updates about government and digital services, offers and important dates.\n\nIf you would like them, open this link and click YES: ${consentUrl(row.id)}\n\nNot interested? Click here to say NO: ${unsubscribeUrl(row.id)}\nYou can unsubscribe at any time.`;
    const html = `<div style="font-family:Arial,sans-serif;color:#1d1d1b;max-width:600px">
      <p>Namaste ${escapeHtml(first)},</p>
      <p>NISE COMPORT (Pragya Kendra, Kharangajhar, Jamshedpur) would like to send you updates about government and digital services, offers and important dates.</p>
      <p>If you would like them, click the button below.</p>
      <p><a href="${consentUrl(row.id)}" style="display:inline-block;padding:12px 22px;background:#1f6feb;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold">YES, send me updates</a></p>
      <p style="font-size:13px;color:#555">Not interested? <a href="${unsubscribeUrl(row.id)}">Click here to say NO</a>. You can unsubscribe at any time.</p></div>`;
    try {
      await sendCampaignMail({ to: row.email, subject: "Would you like updates from NISE COMPORT?", html, text, unsubscribeUrl: unsubscribeUrl(row.id) });
      await db.update(contacts).set({ consentAskedAt: new Date(), updatedAt: new Date() }).where(eq(contacts.id, row.id));
      sent++;
    } catch (error) {
      failed++;
      console.error("[consent ask] failed", error);
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  await logActivity({ kind: "campaign", permission: "campaigns", category: "campaigns", title: `${actor.name} asked people to say YES by email`, detail: `${sent} asked · ${skipped} skipped · ${failed} failed`, refType: "campaign", refId: null, actorId: actor.id });
  return { sent, skipped, failed };
}

/** The YES link in the email. Only moves unknown people to YES; people who said STOP stay stopped. */
export async function confirmConsent(contactId: string, token: string) {
  if (!/^[0-9a-f-]{36}$/i.test(contactId) || !consentTokenMatches(contactId, token)) return "invalid" as const;
  const [row] = await db.select({ consent: contacts.consent }).from(contacts).where(eq(contacts.id, contactId)).limit(1);
  if (!row) return "invalid" as const;
  if (row.consent === "opted_in") return "already" as const;
  if (row.consent === "opted_out") return "stopped" as const;
  await db.update(contacts).set({ consent: "opted_in", updatedAt: new Date() }).where(eq(contacts.id, contactId));
  return "confirmed" as const;
}

/** Everyone with an email address, for the picker. Filter: "" (all), "opted_in", "unknown", "opted_out". */
export async function listEmailPeople(options: { q?: string; filter?: string; service?: string; page?: number }) {
  const filters: SQL[] = [isNotNull(contacts.email), ne(contacts.email, "")];
  if (options.filter && ["opted_in", "unknown", "opted_out"].includes(options.filter)) filters.push(eq(contacts.consent, options.filter));
  if (options.service && /^[a-z-]{2,30}$/.test(options.service)) filters.push(sql`${contacts.services} @> ${JSON.stringify([{ service: options.service }])}::jsonb`);
  const q = (options.q ?? "").trim().slice(0, 80);
  if (q) {
    const like = `%${q.replace(/[\\%_]/g, "\\$&")}%`;
    filters.push(or(ilike(contacts.name, like), ilike(contacts.email, like))!);
  }
  const page = Math.max(0, Math.min(options.page ?? 0, 500));
  const where = and(...filters);
  const rows = await db.select({ id: contacts.id, name: contacts.name, email: contacts.email, consent: contacts.consent, consentAskedAt: contacts.consentAskedAt })
    .from(contacts).where(where).orderBy(contacts.name).limit(100).offset(page * 100);
  const [total] = await db.select({ total: count() }).from(contacts).where(where);
  return {
    people: rows.map((row) => ({ ...row, email: row.email ?? "", consentAskedAt: row.consentAskedAt ? row.consentAskedAt.toISOString() : null })),
    matching: total.total,
    page,
  };
}

