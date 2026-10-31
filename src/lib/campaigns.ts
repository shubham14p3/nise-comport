import { and, asc, count, desc, eq, gte, ilike, inArray, isNull, lte, or, sql, type SQL } from "drizzle-orm";
import { campaignMessages, campaigns, contacts, jobs, printJobs, serviceRequests } from "@/db/schema";
import { db } from "@/lib/db";
import { extractJobCode } from "@/lib/job-id";
import { findOwnedJobByCode, latestPublicJobUpdate, verifiedWhatsAppUserId } from "@/lib/jobs";
import { PublicError } from "@/lib/errors";
import { clampPacing, istDayStartOf, planRound, type Pacing } from "@/lib/campaign-pacing";
import { CAMPAIGN_SERVICES, classifyReply, consentAllows, DEFAULT_MESSAGES, isLang, renderMessage, whatsappLink, type CampaignKind, type Lang, type Text3 } from "@/lib/campaign-text";
import { isPosterUrl, posterFor } from "@/lib/poster-library";
import { statusLabel } from "@/lib/requests";
import { site } from "@/lib/site";
import { normalizePhone } from "@/lib/validation";
import { cloudApiConfigured, sendTemplate, type InboundEvent } from "@/lib/whatsapp";

type CampaignRow = typeof campaigns.$inferSelect;
const KINDS: CampaignKind[] = ["renewal", "offer", "optin", "birthday"];
const shopPhone = () => site.phones.primary.display ?? site.phones.primary.e164;

// ---------------------------------------------------------------------------------------------
// Contacts
// ---------------------------------------------------------------------------------------------

export type ContactInput = { id?: string; name: string; phone: string; locale?: string; area?: string | null; services?: { service: string; renewalOn?: string | null; note?: string | null }[]; consent?: string; notes?: string | null; source?: string | null };

function cleanServices(list: ContactInput["services"]) {
  return (list ?? []).slice(0, 12).flatMap((item) => {
    const service = (CAMPAIGN_SERVICES as readonly string[]).includes(item.service) ? item.service : null;
    if (!service) return [];
    const renewalOn = item.renewalOn && /^\d{4}-\d{2}-\d{2}$/.test(item.renewalOn) ? item.renewalOn : null;
    return [{ service, renewalOn, note: item.note?.slice(0, 120) || null }];
  });
}

export async function saveContact(input: ContactInput) {
  const phone = normalizePhone(input.phone);
  if (!phone) throw new PublicError("Enter a valid mobile number, e.g. 98765 43210.", 400, { fields: { phone: "Check the number." } });
  const name = input.name.replace(/\s+/g, " ").trim().slice(0, 100);
  if (name.length < 2) throw new PublicError("Enter the person’s name.", 400, { fields: { name: "Add a name." } });
  const consent = input.consent === "opted_in" || input.consent === "opted_out" ? input.consent : "unknown";
  const values = {
    name, phone, locale: isLang(input.locale) ? input.locale : "en", area: input.area?.slice(0, 80) || null,
    services: cleanServices(input.services), consent, consentAt: consent === "unknown" ? null : new Date(),
    notes: input.notes?.slice(0, 500) || null, source: input.source?.slice(0, 40) || "admin", updatedAt: new Date(),
  };
  const [row] = await db.insert(contacts).values(values).onConflictDoUpdate({
    target: contacts.phone,
    // Merging duplicates: keep the stronger "no" (a STOP always wins over a later import).
    set: { name: values.name, locale: values.locale, area: values.area, services: values.services, notes: values.notes, updatedAt: values.updatedAt,
      consent: sql`CASE WHEN ${contacts.consent} = 'opted_out' THEN 'opted_out' WHEN ${values.consent} = 'unknown' THEN ${contacts.consent} ELSE ${values.consent} END`, consentAt: sql`coalesce(${contacts.consentAt}, now())` },
  }).returning();
  return row;
}

export async function setConsent(id: string, consent: "unknown" | "opted_in" | "opted_out") {
  const [row] = await db.update(contacts).set({ consent, consentAt: new Date(), updatedAt: new Date() }).where(eq(contacts.id, id)).returning({ id: contacts.id });
  if (!row) throw new PublicError("Contact not found.", 404, { code: "not_found" });
  if (consent === "opted_out") await skipPendingFor({ contactId: id });
}

export async function listContacts(options: { q?: string; consent?: string; page?: number; pageSize?: number; limit?: number }) {
  const filters: SQL[] = [];
  const q = options.q?.trim().slice(0, 80);
  if (q) {
    const like = `%${q.replace(/[\\%_]/g, "\\$&")}%`;
    filters.push(or(ilike(contacts.name, like), ilike(contacts.phone, like), ilike(contacts.area, like))!);
  }
  if (options.consent && ["unknown", "opted_in", "opted_out"].includes(options.consent)) filters.push(eq(contacts.consent, options.consent));
  const where = filters.length ? and(...filters) : undefined;
  const pageSize = [10, 20, 50].includes(options.pageSize ?? 0) ? options.pageSize! : Math.min(options.limit ?? 100, 200);
  const page = Math.max(0, Math.min(100000, options.page ?? 0));
  const [rows, totals, [matched]] = await Promise.all([
    db.select().from(contacts).where(where).orderBy(desc(contacts.updatedAt), desc(contacts.id)).limit(options.limit ? Math.min(options.limit, 200) : pageSize).offset(options.limit ? 0 : page * pageSize),
    db.select({ consent: contacts.consent, total: count() }).from(contacts).groupBy(contacts.consent),
    db.select({ total: count() }).from(contacts).where(where),
  ]);
  return {
    contacts: rows.map((row) => ({ ...row, consentAt: row.consentAt?.toISOString() ?? null, lastMessagedAt: row.lastMessagedAt?.toISOString() ?? null, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() })),
    totals: Object.fromEntries(totals.map((row) => [row.consent, Number(row.total)])) as Record<string, number>,
    matched: Number(matched.total),
  };
}

// ---------------------------------------------------------------------------------------------
// Campaigns
// ---------------------------------------------------------------------------------------------

export type CampaignInput = {
  id?: string; name: string; kind: CampaignKind; service?: string | null; message?: Partial<Text3>; posters?: Partial<Text3> | null; couponCode?: string | null;
  audience?: { renewalWithinDays?: number | null; locales?: string[] | null }; testNumbers?: string[]; pacing?: Partial<Pacing>;
  provider?: "manual" | "cloud"; templateName?: string | null;
};

export async function saveCampaign(input: CampaignInput, actorId: string) {
  const name = input.name.replace(/\s+/g, " ").trim().slice(0, 100);
  if (name.length < 3) throw new PublicError("Give the campaign a name.", 400, { fields: { name: "Add a name." } });
  if (!KINDS.includes(input.kind)) throw new PublicError("Choose a campaign type.", 400);
  const defaults = DEFAULT_MESSAGES[input.kind];
  const message: Text3 = {
    en: input.message?.en?.trim().slice(0, 1000) || defaults.en,
    hi: input.message?.hi?.trim().slice(0, 1000) || defaults.hi,
    bn: input.message?.bn?.trim().slice(0, 1000) || defaults.bn,
  };
  const posters: Partial<Text3> = {};
  for (const lang of ["en", "hi", "bn"] as const) {
    const url = input.posters?.[lang];
    if (url && !isPosterUrl(url)) throw new PublicError("Choose posters from the poster library.", 400);
    if (url) posters[lang] = url;
  }
  const testNumbers = [...new Set((input.testNumbers ?? []).map((value) => normalizePhone(value)).filter((value): value is string => Boolean(value)))].slice(0, 10);
  const pacing = clampPacing(input.pacing ?? {});
  const service = input.service && (CAMPAIGN_SERVICES as readonly string[]).includes(input.service) ? input.service : null;
  const coupon = input.couponCode?.trim().toUpperCase().slice(0, 40) || null;
  const renewalWithinDays = input.audience?.renewalWithinDays ? Math.max(1, Math.min(365, Math.round(input.audience.renewalWithinDays))) : null;
  const locales = (input.audience?.locales ?? []).filter(isLang);
  const values = {
    name, kind: input.kind, service, message, posters: Object.keys(posters).length ? posters : null, couponCode: coupon,
    audience: { renewalWithinDays, locales: locales.length ? locales : null }, testNumbers, ...pacing,
    provider: input.provider === "cloud" ? "cloud" : "manual", templateName: input.templateName?.trim().slice(0, 100) || null, updatedAt: new Date(),
  };
  if (input.id) {
    const [current] = await db.select({ status: campaigns.status }).from(campaigns).where(eq(campaigns.id, input.id)).limit(1);
    if (!current) throw new PublicError("Campaign not found.", 404, { code: "not_found" });
    if (current.status === "running") throw new PublicError("Pause the campaign before editing it.", 409);
    const [row] = await db.update(campaigns).set(values).where(eq(campaigns.id, input.id)).returning();
    return row;
  }
  const [row] = await db.insert(campaigns).values({ ...values, status: "draft", createdBy: actorId }).returning();
  return row;
}

function pacingOf(row: CampaignRow): Pacing {
  return clampPacing({ batchSize: row.batchSize, gapMinMinutes: row.gapMinMinutes, gapMaxMinutes: row.gapMaxMinutes, dailyLimit: row.dailyLimit, windowStart: row.windowStart, windowEnd: row.windowEnd });
}

/** Contacts the campaign may message under the consent rules, service and renewal window. */
async function audienceOf(row: CampaignRow) {
  const kind = row.kind as CampaignKind;
  const consents = kind === "offer" || kind === "birthday" ? ["opted_in"] : kind === "optin" ? ["unknown"] : ["unknown", "opted_in"];
  const filters: SQL[] = [inArray(contacts.consent, consents)];
  const locales = row.audience?.locales?.filter(isLang) ?? [];
  if (locales.length) filters.push(inArray(contacts.locale, locales));
  if (row.service) filters.push(sql`${contacts.services} @> ${JSON.stringify([{ service: row.service }])}::jsonb`);
  if (kind === "birthday") {
    const [, month, day] = new Date(Date.now() + 5.5 * 3_600_000).toISOString().slice(0, 10).split("-").map(Number);
    filters.push(eq(contacts.birthMonth, month), eq(contacts.birthDay, day));
  }
  const rows = await db.select().from(contacts).where(and(...filters)).orderBy(asc(contacts.createdAt)).limit(20_000);
  const within = row.audience?.renewalWithinDays;
  if (kind !== "renewal" || !within || !row.service) return rows.filter((contact) => consentAllows(kind, contact.consent));
  const today = new Date(Date.now() + 5.5 * 3_600_000).toISOString().slice(0, 10);
  const until = new Date(Date.parse(`${today}T00:00:00Z`) + within * 86_400_000).toISOString().slice(0, 10);
  return rows.filter((contact) => consentAllows(kind, contact.consent) && contact.services.some((item) => item.service === row.service && item.renewalOn && item.renewalOn >= today && item.renewalOn <= until));
}

function messageFor(row: CampaignRow, person: { name: string; locale: string; renewalOn?: string | null }) {
  const lang: Lang = isLang(person.locale) ? person.locale : "en";
  const kind = row.kind as CampaignKind;
  const body = renderMessage(row.message[lang] || row.message.en, { lang, kind, name: person.name, service: row.service, code: row.couponCode, renewalOn: person.renewalOn ?? null, phone: shopPhone() });
  const poster = posterFor(row.posters, lang);
  return { lang, body, posterUrl: poster ? `${site.url}${poster}` : null };
}

async function queueFor(row: CampaignRow, people: { contactId: string | null; phone: string; name: string; locale: string; renewalOn?: string | null }[], test: boolean, scheduleNow: boolean) {
  if (!people.length) return 0;
  const now = new Date();
  const values = people.map((person) => {
    const { lang, body, posterUrl } = messageFor(row, person);
    return { campaignId: row.id, contactId: person.contactId, phone: person.phone, name: person.name, locale: lang, body, posterUrl, test, status: scheduleNow ? "scheduled" : "queued", scheduledAt: scheduleNow ? now : null, round: scheduleNow ? 0 : null };
  });
  let inserted = 0;
  for (let index = 0; index < values.length; index += 500) {
    const chunk = values.slice(index, index + 500);
    inserted += (test
      ? await db.insert(campaignMessages).values(chunk).returning({ id: campaignMessages.id })
      : await db.insert(campaignMessages).values(chunk).onConflictDoNothing().returning({ id: campaignMessages.id })).length;
  }
  return inserted;
}

/**
 * Queues ready-made messages (birthday wishes, renewal reminders) in a campaign named for the day, so they
 * go out with the usual pacing and appear in the one-tap queue (or are sent through the WhatsApp Business API).
 * Returns how many were newly queued; a number already in today's campaign is not added twice.
 */
export async function queueOutreach(name: string, kind: CampaignKind, service: string | null, people: { contactId: string; phone: string; name: string; locale: string; body: string; posterUrl: string | null }[]) {
  if (!people.length) return 0;
  const now = new Date();
  let [row] = await db.select().from(campaigns).where(eq(campaigns.name, name)).limit(1);
  if (!row) {
    const pacing = clampPacing({ batchSize: 10, dailyLimit: 200 });
    [row] = await db.insert(campaigns).values({ name, kind, service, status: "running", message: DEFAULT_MESSAGES[kind], audience: {}, ...pacing, provider: "manual", startedAt: now, nextRoundAt: now }).returning();
  } else if (row.status !== "running") {
    await db.update(campaigns).set({ status: "running", finishedAt: null, nextRoundAt: now, updatedAt: now }).where(eq(campaigns.id, row.id));
  }
  let queued = 0;
  for (let index = 0; index < people.length; index += 400) {
    const chunk = people.slice(index, index + 400).map((person) => ({ campaignId: row.id, contactId: person.contactId, phone: person.phone, name: person.name, locale: person.locale, body: person.body, posterUrl: person.posterUrl, test: false, status: "queued" }));
    queued += (await db.insert(campaignMessages).values(chunk).onConflictDoNothing().returning({ id: campaignMessages.id })).length;
  }
  if (queued) await runCampaigns(now, row.id);
  return queued;
}

export type CampaignAction = "test" | "start" | "pause" | "resume" | "stop" | "run";

export async function campaignAction(id: string, action: CampaignAction, options: { testLocales?: string[] } = {}) {
  const [row] = await db.select().from(campaigns).where(eq(campaigns.id, id)).limit(1);
  if (!row) throw new PublicError("Campaign not found.", 404, { code: "not_found" });
  const now = new Date();
  if (action === "test") {
    if (!row.testNumbers.length) throw new PublicError("Add at least one test number first.", 400, { fields: { testNumbers: "Add your own number." } });
    const locales = (options.testLocales ?? ["en"]).filter(isLang);
    const people = row.testNumbers.flatMap((phone) => (locales.length ? locales : ["en" as Lang]).map((locale) => ({ contactId: null, phone, name: "Test", locale, renewalOn: new Date(Date.now() + 12 * 86_400_000).toISOString().slice(0, 10) })));
    const queued = await queueFor(row, people, true, true);
    await deliverDue(now);
    return { queued };
  }
  if (action === "start") {
    if (!["draft", "paused", "done"].includes(row.status)) throw new PublicError("This campaign is already running.", 409);
    if (row.provider === "cloud" && !cloudApiConfigured()) throw new PublicError("WhatsApp Business API isn’t set up yet. Use the one-tap queue (manual) for now.", 409);
    if (row.provider === "cloud" && !row.templateName) throw new PublicError("Add the approved WhatsApp template name for automatic sending.", 400, { fields: { templateName: "Required for automatic sending." } });
    const audience = await audienceOf(row);
    const queued = await queueFor(row, audience.map((contact) => ({ contactId: contact.id, phone: contact.phone, name: contact.name, locale: contact.locale, renewalOn: contact.services.find((item) => item.service === row.service)?.renewalOn ?? null })), false, false);
    await db.update(campaigns).set({ status: "running", startedAt: row.startedAt ?? now, finishedAt: null, nextRoundAt: now, updatedAt: now }).where(eq(campaigns.id, id));
    const report = await runCampaigns(now, id);
    return { queued, audience: audience.length, ...report };
  }
  if (action === "pause") { await db.update(campaigns).set({ status: "paused", updatedAt: now }).where(eq(campaigns.id, id)); return {}; }
  if (action === "resume") {
    if (row.status !== "paused") throw new PublicError("Only a paused campaign can be resumed.", 409);
    await db.update(campaigns).set({ status: "running", nextRoundAt: now, updatedAt: now }).where(eq(campaigns.id, id));
    return runCampaigns(now, id);
  }
  if (action === "stop") {
    await db.update(campaignMessages).set({ status: "skipped", error: "Campaign stopped" }).where(and(eq(campaignMessages.campaignId, id), inArray(campaignMessages.status, ["queued", "scheduled"])));
    await db.update(campaigns).set({ status: "done", finishedAt: now, updatedAt: now }).where(eq(campaigns.id, id));
    return {};
  }
  return runCampaigns(now, id);
}

async function skipPendingFor(target: { contactId?: string; phone?: string }) {
  const match = target.contactId ? eq(campaignMessages.contactId, target.contactId) : eq(campaignMessages.phone, target.phone ?? "");
  await db.update(campaignMessages).set({ status: "opted_out", error: "Replied STOP" }).where(and(match, inArray(campaignMessages.status, ["queued", "scheduled", "ready"])));
}

/**
 * The scheduler (run every few minutes by /api/cron/whatsapp, or "Run now" in the admin panel):
 * plans the next round for each running campaign, then delivers messages that are due.
 */
export async function runCampaigns(now = new Date(), onlyId?: string) {
  const report = { rounds: 0, scheduled: 0, sent: 0, ready: 0, failed: 0, skipped: 0, waiting: [] as string[] };
  const due = await db.select().from(campaigns).where(and(
    eq(campaigns.status, "running"), or(isNull(campaigns.nextRoundAt), lte(campaigns.nextRoundAt, now)),
    ...(onlyId ? [eq(campaigns.id, onlyId)] : []),
  ));
  for (const row of due) {
    const pacing = pacingOf(row);
    const [{ pending }] = await db.select({ pending: count() }).from(campaignMessages).where(and(eq(campaignMessages.campaignId, row.id), eq(campaignMessages.status, "queued"), eq(campaignMessages.test, false)));
    const [{ today }] = await db.select({ today: count() }).from(campaignMessages).where(and(
      eq(campaignMessages.campaignId, row.id), eq(campaignMessages.test, false), gte(campaignMessages.scheduledAt, istDayStartOf(now)),
      inArray(campaignMessages.status, ["scheduled", "ready", "sent", "failed"]),
    ));
    const plan = planRound({ now, pacing, pending: Number(pending), sentToday: Number(today) });
    if (plan.kind === "done") {
      const [{ open }] = await db.select({ open: count() }).from(campaignMessages).where(and(eq(campaignMessages.campaignId, row.id), eq(campaignMessages.test, false), inArray(campaignMessages.status, ["scheduled", "ready"])));
      if (!Number(open)) await db.update(campaigns).set({ status: "done", finishedAt: now, nextRoundAt: null, updatedAt: now }).where(eq(campaigns.id, row.id));
      continue;
    }
    if (plan.kind === "wait") {
      await db.update(campaigns).set({ nextRoundAt: plan.nextRoundAt, updatedAt: now }).where(eq(campaigns.id, row.id));
      report.waiting.push(`${row.name}: ${plan.reason} until ${plan.nextRoundAt.toISOString()}`);
      continue;
    }
    const batch = await db.select({ id: campaignMessages.id }).from(campaignMessages)
      .where(and(eq(campaignMessages.campaignId, row.id), eq(campaignMessages.status, "queued"), eq(campaignMessages.test, false)))
      .orderBy(asc(campaignMessages.createdAt)).limit(plan.times.length);
    const round = row.round + 1;
    for (let index = 0; index < batch.length; index++) {
      await db.update(campaignMessages).set({ status: "scheduled", scheduledAt: plan.times[index], round }).where(and(eq(campaignMessages.id, batch[index].id), eq(campaignMessages.status, "queued")));
    }
    await db.update(campaigns).set({ round, nextRoundAt: plan.nextRoundAt, updatedAt: now }).where(eq(campaigns.id, row.id));
    report.rounds++;
    report.scheduled += batch.length;
  }
  const delivered = await deliverDue(now, onlyId);
  return { ...report, ...delivered, scheduled: report.scheduled };
}

/** Sends (automatic) or releases to the one-tap queue (manual) every message whose time has come. */
async function deliverDue(now: Date, onlyId?: string) {
  const result = { sent: 0, ready: 0, failed: 0, skipped: 0 };
  const rows = await db.select({ message: campaignMessages, campaign: campaigns, consent: contacts.consent })
    .from(campaignMessages).innerJoin(campaigns, eq(campaignMessages.campaignId, campaigns.id)).leftJoin(contacts, eq(campaignMessages.contactId, contacts.id))
    .where(and(eq(campaignMessages.status, "scheduled"), lte(campaignMessages.scheduledAt, now), ...(onlyId ? [eq(campaignMessages.campaignId, onlyId)] : [])))
    .orderBy(asc(campaignMessages.scheduledAt)).limit(60);
  for (const { message, campaign, consent } of rows) {
    if (consent === "opted_out") {
      await db.update(campaignMessages).set({ status: "opted_out", error: "Replied STOP" }).where(eq(campaignMessages.id, message.id));
      result.skipped++;
      continue;
    }
    if (campaign.provider === "cloud" && cloudApiConfigured() && campaign.templateName) {
      const lang = isLang(message.locale) ? message.locale : "en";
      const outcome = await sendTemplate({ to: message.phone, template: campaign.templateName, lang, bodyParams: [message.name.split(/\s+/)[0] || "ji", message.body.split("\n\n")[0]], imageUrl: message.posterUrl });
      if (outcome.ok) {
        await db.update(campaignMessages).set({ status: "sent", sentAt: now, providerMessageId: outcome.id, attempts: message.attempts + 1, error: null }).where(eq(campaignMessages.id, message.id));
        if (message.contactId) await db.update(contacts).set({ lastMessagedAt: now }).where(eq(contacts.id, message.contactId));
        result.sent++;
      } else {
        const retry = outcome.retry && message.attempts < 2;
        await db.update(campaignMessages).set({ status: retry ? "scheduled" : "failed", scheduledAt: retry ? new Date(now.getTime() + 5 * 60_000) : message.scheduledAt, attempts: message.attempts + 1, error: outcome.error }).where(eq(campaignMessages.id, message.id));
        result.failed++;
      }
    } else {
      // One-tap queue: the message appears in Admin → Campaigns → "Ready to send".
      await db.update(campaignMessages).set({ status: "ready" }).where(eq(campaignMessages.id, message.id));
      result.ready++;
    }
  }
  return result;
}

export async function listCampaigns() {
  const rows = await db.select().from(campaigns).orderBy(desc(campaigns.createdAt)).limit(100);
  const tallies = rows.length ? await db.select({ campaignId: campaignMessages.campaignId, status: campaignMessages.status, test: campaignMessages.test, total: count() })
    .from(campaignMessages).where(inArray(campaignMessages.campaignId, rows.map((row) => row.id))).groupBy(campaignMessages.campaignId, campaignMessages.status, campaignMessages.test) : [];
  const result = await Promise.all(rows.map(async (row) => {
    const counts: Record<string, number> = {};
    for (const tally of tallies) if (tally.campaignId === row.id && !tally.test) counts[tally.status] = Number(tally.total);
    const tests = tallies.filter((tally) => tally.campaignId === row.id && tally.test).reduce((sum, tally) => sum + Number(tally.total), 0);
    const audienceSize = ["draft", "paused", "done"].includes(row.status) ? (await audienceOf(row)).length : null;
    return { ...row, pacing: pacingOf(row), counts, tests, audienceSize, nextRoundAt: row.nextRoundAt?.toISOString() ?? null, startedAt: row.startedAt?.toISOString() ?? null, finishedAt: row.finishedAt?.toISOString() ?? null, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() };
  }));
  return { campaigns: result, cloudApi: cloudApiConfigured() };
}

/** Messages to send by hand (ready now) and the next ones coming up. */
export async function sendQueue() {
  const rows = await db.select({ message: campaignMessages, campaignName: campaigns.name }).from(campaignMessages).innerJoin(campaigns, eq(campaignMessages.campaignId, campaigns.id))
    .where(inArray(campaignMessages.status, ["ready", "scheduled"])).orderBy(asc(campaignMessages.scheduledAt)).limit(80);
  return rows.map(({ message, campaignName }) => ({
    id: message.id, campaignName, phone: message.phone, name: message.name, locale: message.locale, body: message.body, posterUrl: message.posterUrl, test: message.test,
    status: message.status, scheduledAt: message.scheduledAt?.toISOString() ?? null, link: whatsappLink(message.phone, message.body),
  }));
}

export async function markMessage(id: string, status: "sent" | "skipped" | "failed", actorId: string) {
  const now = new Date();
  const [row] = await db.update(campaignMessages).set({ status, sentAt: status === "sent" ? now : null, sentBy: actorId })
    .where(and(eq(campaignMessages.id, id), inArray(campaignMessages.status, ["ready", "scheduled"]))).returning({ contactId: campaignMessages.contactId });
  if (!row) throw new PublicError("This message was already handled.", 409);
  if (status === "sent" && row.contactId) await db.update(contacts).set({ lastMessagedAt: now }).where(eq(contacts.id, row.contactId));
}

/** STOP / YES replies and delivery receipts from the WhatsApp webhook. */
const REFERENCE_PATTERN = /\b([A-Z]{2,3}-\d{6}-[A-Z0-9]{6})\b/i;

/**
 * "What's the status?" self-serve reply. Only replies within Meta's 24h customer-service window
 * (it's always a reply to the customer's own inbound message, never business-initiated), and only
 * to requests owned by the account whose phone/WhatsApp number matches the sender — so one
 * customer's WhatsApp number can never be used to read another customer's status.
 * Returns true if the message was handled as a status query (caller should skip STOP/YES parsing).
 */
async function sendStatusReply(phone: string, message: string) {
  // Persist the actual sent reply so Admin → WhatsApp chats matches the conversation.
  return (await import("@/lib/whatsapp-bot")).replyAndLog(phone, message, "bot");
}

export async function handleStatusQuery(phone: string, text: string): Promise<boolean> {
  const isStatus = /^\s*(status|stat|track|track\s*my\s*(order|request))\b/i.test(text);
  const jobCode = extractJobCode(text);
  if (!cloudApiConfigured() || (!isStatus && !jobCode)) return false;
  // Phone must be OTP-verified for exactly one account. No 'first matching user'
  // resolution: a shared family number or an unverified WhatsApp alias proves nothing.
  const accountId = await verifiedWhatsAppUserId(phone);
  if (!accountId) {
    await sendStatusReply(phone, "For your privacy, please sign in to nisecomport.com and verify this mobile number, or contact our desk. A Job ID alone does not give access to private details.");
    return true;
  }
  if (jobCode) {
    const job = await findOwnedJobByCode(jobCode, accountId);
    if (!job) {
      await sendStatusReply(phone, "That Job ID is not linked to your verified account. Please check the ID or contact our desk; older counter records may need ownership verification.");
      return true;
    }
    const missing = (job.missingDocuments ?? []).slice(0, 5).join(", ");
    const latest = await latestPublicJobUpdate(jobCode, accountId);
    await sendStatusReply(phone, `${job.code} (${job.serviceName}): ${statusLabel(job.status)}.${missing ? ` Missing documents: ${missing}.` : ""}${latest ? ` Latest update: ${latest}.` : ""} Sign in to nisecomport.com for details.`);
    return true;
  }
  const reference = text.match(REFERENCE_PATTERN)?.[1]?.toUpperCase();
  if (reference) {
    const [service] = await db.select({ reference: serviceRequests.reference, name: serviceRequests.serviceName, status: serviceRequests.status, officialReference: serviceRequests.officialReference, officialReferenceLabel: serviceRequests.officialReferenceLabel }).from(serviceRequests).where(and(eq(serviceRequests.reference, reference), eq(serviceRequests.userId, accountId))).limit(1);
    const [print] = service ? [] : await db.select({ reference: printJobs.reference, name: printJobs.fileName, status: printJobs.status }).from(printJobs).where(and(eq(printJobs.reference, reference), eq(printJobs.userId, accountId))).limit(1);
    const found = service ?? print;
    const officialLine = found && "officialReference" in found && found.officialReference ? ` · ${found.officialReferenceLabel || "Official ref"}: ${found.officialReference}` : "";
    await sendStatusReply(phone, found ? `${found.reference} (${found.name}): ${statusLabel(found.status)}${officialLine}.` : `We couldn't find ${reference} on your account. Check the reference number, or call the desk.`);
    return true;
  }
  const recent = await db.select({
    code: jobs.code, name: jobs.serviceName, status: jobs.status, updatedAt: jobs.updatedAt,
  }).from(jobs).where(eq(jobs.userId, accountId)).orderBy(desc(jobs.updatedAt)).limit(3);
  await sendStatusReply(phone, recent.length
    ? `Your latest jobs:\n${recent.map((item) => `${item.code} (${item.name}): ${statusLabel(item.status)}`).join("\n")}`
    : "We don't see any jobs on your verified account yet. Start one at nisecomport.com or visit the desk.");
  return true;
}

export async function handleInbound(events: InboundEvent[]) {
  let consentChanges = 0;
  for (const event of events) {
    if (event.type === "status") {
      if (event.status === "failed") await db.update(campaignMessages).set({ status: "failed", error: event.error ?? "Delivery failed" }).where(eq(campaignMessages.providerMessageId, event.id));
      continue;
    }
    const statusPhone = normalizePhone(event.from);
    if (statusPhone && cloudApiConfigured() && (/^\s*(status|stat|track|track\s*my\s*(order|request))\b/i.test(event.text) || Boolean(extractJobCode(event.text)))) {
      // Preserve actual conversation order: the question is saved before the reply.
      try { await (await import("@/lib/whatsapp-bot")).logInboundOnly(statusPhone, event.text, event.name); }
      catch (error) { console.error("[whatsapp] could not log status question", error); }
      if (await handleStatusQuery(statusPhone, event.text)) continue;
    }
    const intent = classifyReply(event.text);
    if (!intent) {
      // Not a STOP / YES reply: the assistant answers it (needs the Cloud API; without it nothing is sent).
      if (cloudApiConfigured()) {
        try { await (await import("@/lib/whatsapp-bot")).handleBotMessage(event); } catch (error) { console.error("[whatsapp-bot] failed", error); }
      }
      continue;
    }
    const phone = normalizePhone(event.from);
    if (!phone) continue;
    const consent = intent === "stop" ? "opted_out" : "opted_in";
    const [existing] = await db.select({ id: contacts.id, consent: contacts.consent }).from(contacts).where(eq(contacts.phone, phone)).limit(1);
    if (existing) await db.update(contacts).set({ consent, consentAt: new Date(), updatedAt: new Date() }).where(eq(contacts.id, existing.id));
    else await db.insert(contacts).values({ name: event.name?.slice(0, 100) || "WhatsApp contact", phone, consent, consentAt: new Date(), source: "whatsapp-reply" }).onConflictDoNothing();
    try { await (await import("@/lib/whatsapp-bot")).logInboundOnly(phone, event.text, event.name); }
    catch (error) { console.error("[whatsapp] could not log consent reply", error); }
    if (consent === "opted_out") await skipPendingFor({ phone });
    consentChanges++;
  }
  return { consentChanges };
}
