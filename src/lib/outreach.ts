import { and, asc, eq, inArray, isNotNull, or, sql } from "drizzle-orm";
import { contacts, customerRecords, outreachLog, outreachSettings } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { queueOutreach } from "@/lib/campaigns";
import { renderMessage } from "@/lib/campaign-text";
import { db } from "@/lib/db";
import { sendMail } from "@/lib/email";
import { PublicError } from "@/lib/errors";
import {
  addDays, collapseRenewals, rollRenewal, birthdayEmail, birthdayLabel, birthdayWhatsApp, birthFromFields, DEFAULT_SETTINGS, daysBetween, daysUntilBirthday, instagramCaption, istToday, lastBirthday, markRefreshed, mayMessage, refreshStatus,
  pickBirthdayTemplate, pickRenewalTemplate, renewalEmail, renewalWhatsApp, sanitizeBirthdayTemplates, sanitizeRenewalTemplates, sanitizeSettings, vehicleFrom,
  type BirthdayCouponInfo, type BirthdayTemplate, type Lang, type OutreachSettings, type RefreshState, type RenewalTemplate, type Vehicle,
} from "@/lib/outreach-core";
import { addContacts, CONTACT_SERVICE, type Person } from "@/lib/records";
import { ensureBirthdayCoupon } from "@/lib/birthday-coupon";
import { site } from "@/lib/site";
import { blindIndex, open } from "@/lib/vault";

const isLang = (value: unknown): value is Lang => value === "en" || value === "hi" || value === "bn";
const langOf = (value: string | null | undefined): Lang => (isLang(value) ? value : "en");
const shopPhone = () => site.phones.primary.display ?? site.phones.primary.e164;

// ---------------------------------------------------------------------------------------------
// Settings and templates (saved in outreach_settings)
// ---------------------------------------------------------------------------------------------

async function readSetting(key: string): Promise<unknown> {
  const [row] = await db.select({ value: outreachSettings.value }).from(outreachSettings).where(eq(outreachSettings.key, key)).limit(1);
  return row?.value;
}
async function writeSetting(key: string, value: unknown) {
  await db.insert(outreachSettings).values({ key, value }).onConflictDoUpdate({ target: outreachSettings.key, set: { value, updatedAt: new Date() } });
}

export async function loadConfig() {
  const [settings, birthday, renewal] = await Promise.all([readSetting("settings"), readSetting("birthday_templates"), readSetting("renewal_templates")]);
  return { settings: settings ? sanitizeSettings(settings) : DEFAULT_SETTINGS, birthdayTemplates: sanitizeBirthdayTemplates(birthday), renewalTemplates: sanitizeRenewalTemplates(renewal) };
}

/** Just the on/off switches and the coupon settings (cheap enough to read on a customer's login). */
export async function loadSettings() {
  const settings = await readSetting("settings");
  return settings ? sanitizeSettings(settings) : DEFAULT_SETTINGS;
}

/** Everything the Templates screen needs, plus a real (signed) preview of each saved card in the three languages. */
export async function configWithPreviews() {
  const config = await loadConfig();
  const previews = Object.fromEntries(config.birthdayTemplates.map((template) => [template.id, { en: cardUrl(template.id, "en", "Anita Devi", ""), hi: cardUrl(template.id, "hi", "अनीता देवी", ""), bn: cardUrl(template.id, "bn", "অনিতা দেবী", "") }]));
  return { ...config, previews };
}

export async function saveConfig(input: { settings?: unknown; birthdayTemplates?: unknown; renewalTemplates?: unknown }, actor: { id: string; name: string }) {
  if (input.birthdayTemplates !== undefined) {
    if (!Array.isArray(input.birthdayTemplates) || !input.birthdayTemplates.length) throw new PublicError("Keep at least one birthday card.", 400);
    await writeSetting("birthday_templates", sanitizeBirthdayTemplates(input.birthdayTemplates));
  }
  if (input.renewalTemplates !== undefined) {
    if (!Array.isArray(input.renewalTemplates) || !input.renewalTemplates.length) throw new PublicError("Keep at least one reminder template.", 400);
    await writeSetting("renewal_templates", sanitizeRenewalTemplates(input.renewalTemplates));
  }
  if (input.settings !== undefined) await writeSetting("settings", sanitizeSettings(input.settings));
  await logActivity({ kind: "campaign", permission: "campaigns", category: "outreach", title: `${actor.name} changed birthday / renewal settings`, actorId: actor.id });
  return configWithPreviews();
}

// ---------------------------------------------------------------------------------------------
// Signed links (the card image and the unsubscribe link carry a signature, so nobody can make cards with any text)
// ---------------------------------------------------------------------------------------------

const cleanName = (name: string) => name.replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 40);
export function cardSignature(template: string, lang: string, name: string) { return blindIndex("card", `${template}|${lang}|${cleanName(name)}`).slice(0, 20); }
export function cardUrl(template: string, lang: Lang, name: string, base = site.url) {
  const params = new URLSearchParams({ t: template, l: lang, n: cleanName(name), s: cardSignature(template, lang, name) });
  return `${base}/api/birthday-card?${params.toString()}`;
}
export function unsubscribeUrl(contactId: string) { return `${site.url}/api/unsubscribe?c=${contactId}&s=${blindIndex("unsub", contactId).slice(0, 20)}`; }
export function validUnsubscribe(contactId: string, signature: string) { return signature.length > 0 && blindIndex("unsub", contactId).slice(0, 20) === signature; }

export async function unsubscribeEmail(contactId: string) {
  const [row] = await db.update(contacts).set({ emailConsent: "opted_out", emailConsentAt: new Date(), updatedAt: new Date() }).where(eq(contacts.id, contactId)).returning({ id: contacts.id });
  return Boolean(row);
}

// ---------------------------------------------------------------------------------------------
// Reading the existing records for birthdays and vehicles
// ---------------------------------------------------------------------------------------------

type Sealed = { mobile: string | null; whatsapp?: string | null; email?: string | null; fields: Record<string, string> };

/**
 * Looks through the customer records already imported (the Excel files are deleted after import, so the
 * data is read from the encrypted rows) for dates of birth and bike / car, and puts birthdays and email
 * addresses on the matching WhatsApp contacts (creating contacts for people who have none, "not asked yet").
 */
export async function refreshState() {
  return refreshStatus((await readSetting("refresh_state")) as RefreshState | undefined);
}

/** Refreshes the data (reads the saved records for birthdays and bike / car), but only once in the morning and once in the evening. Both tabs share the limit. */
export async function refreshData(actor: { id: string; name: string }) {
  const before = (await readSetting("refresh_state")) as RefreshState | undefined;
  const status = refreshStatus(before);
  if (!status.allowed) {
    const when = status.nextAt ? new Date(status.nextAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" }) : "later";
    throw new PublicError(`The data was already refreshed this ${status.slot}. The next refresh opens at ${when}.`, 429, { code: "refresh_limit" });
  }
  // Claim the slot first so two clicks at once cannot both run; give it back if the read fails.
  await writeSetting("refresh_state", markRefreshed(before));
  try { return { ...(await scanRecords(actor)), refresh: await refreshState() }; }
  catch (error) { await writeSetting("refresh_state", before ?? {}); throw error; }
}

export async function scanRecords(actor: { id: string; name: string }) {
  const result = { scanned: 0, birthdays: 0, vehicles: 0, contactsAdded: 0 };
  const people = new Map<string, Person>();
  let cursor = "00000000-0000-0000-0000-000000000000";
  for (;;) {
    const rows = await db.select().from(customerRecords).where(sql`${customerRecords.id} > ${cursor}`).orderBy(asc(customerRecords.id)).limit(500);
    if (!rows.length) break;
    cursor = rows[rows.length - 1].id;
    const patches: { id: string; m: number | null; d: number | null; veh: string | null }[] = [];
    for (const row of rows) {
      result.scanned++;
      let sealed: Sealed;
      try { sealed = open<Sealed>(row.payloadEnc); } catch { continue; }
      const fields = sealed.fields ?? {};
      const birth = birthFromFields(fields);
      const vehicle = row.service === "insurance" ? vehicleFrom(fields, row.source) : null;
      const patch: { birthMonth?: number; birthDay?: number; vehicle?: string } = {};
      if (birth && (row.birthMonth !== birth.month || row.birthDay !== birth.day)) { patch.birthMonth = birth.month; patch.birthDay = birth.day; result.birthdays++; }
      if (vehicle && row.vehicle !== vehicle) { patch.vehicle = vehicle; result.vehicles++; }
      if (Object.keys(patch).length) patches.push({ id: row.id, m: patch.birthMonth ?? null, d: patch.birthDay ?? null, veh: patch.vehicle ?? null });
      const phone = sealed.whatsapp ?? sealed.mobile;
      if (!phone) continue;
      const person: Person = people.get(phone) ?? { name: row.name, services: new Map<string, string | null>(), area: null };
      person.email ??= sealed.email ?? null;
      const month = patch.birthMonth ?? row.birthMonth; const day = patch.birthDay ?? row.birthDay;
      if (month && day) person.birth ??= { month, day };
      const service = CONTACT_SERVICE[row.service];
      if (service) { const previous = person.services.get(service); if (!previous || (row.renewalOn && row.renewalOn > previous)) person.services.set(service, row.renewalOn ?? previous ?? null); }
      people.set(phone, person);
    }
    // One statement for the whole batch of 500 rows instead of one per row.
    if (patches.length) await db.execute(sql`update customer_records c set birth_month = coalesce(v.m, c.birth_month), birth_day = coalesce(v.d, c.birth_day), vehicle = coalesce(v.veh, c.vehicle)
      from jsonb_to_recordset(${JSON.stringify(patches)}::jsonb) as v(id uuid, m int, d int, veh text) where c.id = v.id`);
  }
  // Only people who have a birthday or an email need to be added or updated.
  const useful = new Map([...people].filter(([, person]) => person.birth || person.email || person.services.size));
  result.contactsAdded = await addContacts(useful, "records scan");
  await logActivity({ kind: "import", permission: "records", category: "records", title: `${actor.name} scanned records for birthdays`, detail: `${result.scanned} rows read, ${result.birthdays} birthdays found, ${result.vehicles} bike/car marked, ${result.contactsAdded} contacts added.`, actorId: actor.id });
  return result;
}

// ---------------------------------------------------------------------------------------------
// Birthdays
// ---------------------------------------------------------------------------------------------

export type BirthdayRange = "today" | "week" | "month" | "all";

export async function listBirthdays(options: { range: BirthdayRange; month?: number; q?: string; template?: string }) {
  const config = await loadConfig();
  const template = pickBirthdayTemplate(config.birthdayTemplates, options.template ?? config.settings.birthday.template);
  const today = istToday();
  const year = Number(today.slice(0, 4));
  const rows = await db.select().from(contacts).where(and(isNotNull(contacts.birthMonth), isNotNull(contacts.birthDay)));
  const q = options.q?.trim().toLowerCase();
  const all = rows.map((row) => ({ row, days: daysUntilBirthday({ month: row.birthMonth!, day: row.birthDay! }, today) })).sort((a, b) => a.days - b.days || a.row.name.localeCompare(b.row.name));
  const totals = { all: all.length, today: all.filter((item) => item.days === 0).length, week: all.filter((item) => item.days <= 7).length, month: all.filter((item) => item.days <= 30).length };
  let picked = all;
  if (options.month) picked = picked.filter((item) => item.row.birthMonth === options.month);
  else if (options.range === "today") picked = picked.filter((item) => item.days === 0);
  else if (options.range === "week") picked = picked.filter((item) => item.days <= 7);
  else if (options.range === "month") picked = picked.filter((item) => item.days <= 30);
  if (q) picked = picked.filter(({ row }) => `${row.name} ${row.phone} ${row.email ?? ""} ${row.area ?? ""}`.toLowerCase().includes(q));
  const shown = picked.slice(0, 600);
  const wished = shown.length ? await db.select({ contactId: outreachLog.contactId, channel: outreachLog.channel }).from(outreachLog)
    .where(and(eq(outreachLog.kind, "birthday"), eq(outreachLog.year, year), inArray(outreachLog.contactId, shown.map((item) => item.row.id)))) : [];
  const sent = (id: string, channel: string) => wished.some((entry) => entry.contactId === id && entry.channel === channel);
  return {
    totals, matched: picked.length, template: template.id,
    people: shown.map(({ row, days }) => {
      const lang = langOf(row.locale);
      return {
        id: row.id, name: row.name, phone: row.phone, email: row.email, locale: lang, area: row.area, month: row.birthMonth!, day: row.birthDay!, daysUntil: days,
        dateLabel: birthdayLabel({ month: row.birthMonth!, day: row.birthDay! }, "en"), consent: row.consent, emailConsent: row.emailConsent,
        wishedEmail: sent(row.id, "email"), wishedWhatsApp: sent(row.id, "whatsapp"),
        canEmail: mayMessage("birthday", "email", row), canWhatsApp: mayMessage("birthday", "whatsapp", row),
        cardUrl: cardUrl(template.id, lang, row.name, ""), caption: instagramCaption(row.name, lang),
      };
    }),
  };
}

export type SendReport = { doneIds: string[]; emailSent: number; whatsappQueued: number; notAllowed: number; alreadySent: number; failed: number; remaining: number; errors: string[] };
const emptyReport = (): SendReport => ({ doneIds: [], emailSent: 0, whatsappQueued: 0, notAllowed: 0, alreadySent: 0, failed: 0, remaining: 0, errors: [] });

/** Writes the "sent" marker first; false means this wish or reminder was already sent (or is being sent) this year. */
async function claim(contactId: string, kind: "birthday" | "renewal", channel: "email" | "whatsapp", year: number, ref = "") {
  const rows = await db.insert(outreachLog).values({ contactId, kind, channel, year, ref, status: "sent" }).onConflictDoNothing().returning({ id: outreachLog.id });
  return rows[0]?.id ?? null;
}
const release = (id: string) => db.delete(outreachLog).where(eq(outreachLog.id, id));

async function mailBirthday(contact: typeof contacts.$inferSelect, template: BirthdayTemplate, lang: Lang, coupon: BirthdayCouponInfo | null) {
  const mail = birthdayEmail(template, contact.name, lang, coupon);
  await sendMail({ to: contact.email!, subject: mail.subject, heading: mail.heading, paragraphs: mail.paragraphs, image: { src: cardUrl(template.id, lang, contact.name), alt: template.title[lang] }, unsubscribe: unsubscribeUrl(contact.id) });
}

/** Sends birthday wishes to the chosen contacts. Only people who said YES (per channel) are messaged. Stops when the time budget is used; `remaining` says how many are left. */
export async function sendBirthdays(input: { ids: string[]; channels: ("email" | "whatsapp")[]; template: string; budgetMs?: number }, actor: { id: string; name: string } | null) {
  const report = emptyReport();
  const config = await loadConfig();
  const template = pickBirthdayTemplate(config.birthdayTemplates, input.template);
  const today = istToday();
  const year = Number(today.slice(0, 4));
  const gift = config.settings.birthday.coupon;
  /** The gift coupon for one person, or null when the gift is switched off or could not be made (the wish still goes out). */
  const couponFor = async (contact: typeof contacts.$inferSelect): Promise<BirthdayCouponInfo | null> => {
    if (!gift.enabled || contact.birthMonth === null || contact.birthDay === null) return null;
    try { return await ensureBirthdayCoupon(contact, gift, lastBirthday({ month: contact.birthMonth, day: contact.birthDay }, today)); }
    catch (error) { console.error("[birthday] coupon failed", error instanceof Error ? error.message : error); return null; }
  };
  const ids = [...new Set(input.ids)].slice(0, 2000);
  const rows = ids.length ? await db.select().from(contacts).where(inArray(contacts.id, ids)) : [];
  const deadline = Date.now() + (input.budgetMs ?? 40_000);
  const queue: Parameters<typeof queueOutreach>[3] = [];
  const queueClaims: string[] = [];
  let index = 0;
  for (; index < rows.length; index++) {
    if (Date.now() > deadline) break;
    const contact = rows[index];
    const lang = langOf(contact.locale);
    report.doneIds.push(contact.id);
    if (input.channels.includes("email")) {
      if (!mayMessage("birthday", "email", contact)) report.notAllowed++;
      else {
        const marker = await claim(contact.id, "birthday", "email", year);
        if (!marker) report.alreadySent++;
        else {
          try { await mailBirthday(contact, template, lang, await couponFor(contact)); report.emailSent++; }
          catch (error) { await release(marker); report.failed++; if (report.errors.length < 3) report.errors.push(error instanceof Error ? error.message : "Email failed."); }
        }
      }
    }
    if (input.channels.includes("whatsapp")) {
      if (!mayMessage("birthday", "whatsapp", contact)) report.notAllowed++;
      else {
        const marker = await claim(contact.id, "birthday", "whatsapp", year);
        if (!marker) report.alreadySent++;
        else {
          queueClaims.push(marker);
          queue.push({ contactId: contact.id, phone: contact.phone, name: contact.name, locale: lang, body: renderMessage(birthdayWhatsApp(template, lang, await couponFor(contact)), { lang, kind: "birthday", name: contact.name, phone: shopPhone() }), posterUrl: cardUrl(template.id, lang, contact.name) });
        }
      }
    }
  }
  report.remaining = Math.max(0, rows.length - index);
  if (!report.remaining) report.doneIds.push(...ids.filter((id) => !rows.some((row) => row.id === id)));
  if (queue.length) {
    try { report.whatsappQueued = await queueOutreach(`Birthday wishes ${today}`, "birthday", null, queue); }
    catch (error) { for (const marker of queueClaims) await release(marker); report.failed += queue.length; report.errors.push(error instanceof Error ? error.message : "Could not queue WhatsApp."); }
  }
  if (actor && (report.emailSent || report.whatsappQueued)) await logActivity({ kind: "campaign", permission: "campaigns", category: "outreach", title: `${actor.name} sent birthday wishes`, detail: `${report.emailSent} emails, ${report.whatsappQueued} WhatsApp queued.`, actorId: actor.id });
  return report;
}

// ---------------------------------------------------------------------------------------------
// Insurance renewals
// ---------------------------------------------------------------------------------------------

/** Log reference for a reminder: the date, plus the vehicle type so two vehicles ending the same day are both sent. */
function renewalRef(date: string, vehicle: string | null) { return vehicle ? `${date}|${vehicle}` : date; }

export async function renewalsDue(options: { days: number; overdue?: boolean; vehicle?: string; q?: string; template?: string }) {
  const config = await loadConfig();
  const template = pickRenewalTemplate(config.renewalTemplates, options.template ?? config.settings.renewal.template);
  const today = istToday();
  const days = Math.max(1, Math.min(90, Math.round(options.days || 7)));
  const from = options.overdue ? addDays(today, -30) : today;
  const to = addDays(today, days);
  // Every insurance row with a renewal date. Policies are assumed to renew yearly, so an old date rolls forward to its next anniversary.
  const all = await db.select({ id: customerRecords.id, name: customerRecords.name, mobileHash: customerRecords.mobileHash, mobileEnc: customerRecords.mobileEnc, contactEnc: customerRecords.contactEnc, vehicle: customerRecords.vehicle, renewalOn: customerRecords.renewalOn })
    .from(customerRecords).where(and(eq(customerRecords.service, "insurance"), isNotNull(customerRecords.renewalOn), isNotNull(customerRecords.mobileEnc))).limit(30_000);
  const rolled = all.flatMap((row) => {
    const roll = rollRenewal(row.renewalOn!, today);
    if (roll.date < from || roll.date > to) return [];
    return [{ row, date: roll.date, estimated: roll.estimated, original: row.renewalOn!, group: `${row.mobileHash}|${row.vehicle ?? ""}`, vehicleKnown: Boolean(row.vehicle) }];
  });
  // The window above only holds some of each person's policies, so look at all of them before deciding which is the latest.
  const everyone = new Set(rolled.map((item) => item.row.mobileHash));
  const complete = all.filter((row) => everyone.has(row.mobileHash)).flatMap((row) => {
    const roll = rollRenewal(row.renewalOn!, today);
    return [{ row, date: roll.date, estimated: roll.estimated, original: row.renewalOn!, group: `${row.mobileHash}|${row.vehicle ?? ""}`, vehicleKnown: Boolean(row.vehicle) }];
  });
  const kept = collapseRenewals(complete).filter((item) => item.date >= from && item.date <= to);
  const seen = new Set<string>();
  const found: { name: string; phone: string; email: string | null; vehicle: Vehicle | null; renewalOn: string; estimated: boolean }[] = [];
  for (const item of kept.sort((a, b) => a.date.localeCompare(b.date))) {
    const row = item.row;
    let phone: string; let email: string | null = null;
    try { phone = open<string>(row.mobileEnc!); if (row.contactEnc) email = open<{ email: string | null }>(row.contactEnc).email ?? null; } catch { continue; }
    const key = `${phone}|${row.vehicle ?? ""}|${item.date}`;
    if (seen.has(key)) continue;
    seen.add(key);
    found.push({ name: row.name, phone, email, vehicle: (row.vehicle as Vehicle | null) ?? null, renewalOn: item.date, estimated: item.estimated });
  }
  const phones = [...new Set(found.map((item) => item.phone))];
  const known = phones.length ? await db.select().from(contacts).where(inArray(contacts.phone, phones)) : [];
  const byPhone = new Map(known.map((contact) => [contact.phone, contact]));
  const logged = known.length ? await db.select({ contactId: outreachLog.contactId, channel: outreachLog.channel, ref: outreachLog.ref }).from(outreachLog)
    .where(and(eq(outreachLog.kind, "renewal"), inArray(outreachLog.contactId, known.map((contact) => contact.id)))) : [];
  const q = options.q?.trim().toLowerCase();
  const vehicleFilter = options.vehicle === "bike" || options.vehicle === "car" ? options.vehicle : null;
  const people = found
    .filter((item) => (!vehicleFilter || item.vehicle === vehicleFilter) && (!q || `${item.name} ${item.phone}`.toLowerCase().includes(q)))
    .map((item) => {
      const contact = byPhone.get(item.phone);
      const lang = langOf(contact?.locale);
      const email = contact?.email ?? item.email;
      const sent = (channel: string) => Boolean(contact && logged.some((entry) => entry.contactId === contact.id && entry.channel === channel && (entry.ref === item.renewalOn || entry.ref === renewalRef(item.renewalOn, item.vehicle))));
      const consents = { consent: contact?.consent ?? "unknown", emailConsent: contact?.emailConsent ?? "unknown", email };
      return {
        key: `${item.phone}|${item.vehicle ?? ""}|${item.renewalOn}`, estimated: item.estimated, contactId: contact?.id ?? null, name: item.name, phone: item.phone, email, vehicle: item.vehicle, renewalOn: item.renewalOn,
        daysLeft: daysBetween(today, item.renewalOn), locale: lang, consent: consents.consent, emailConsent: consents.emailConsent,
        canEmail: Boolean(contact) && mayMessage("renewal", "email", consents), canWhatsApp: Boolean(contact) && mayMessage("renewal", "whatsapp", consents),
        sentEmail: sent("email"), sentWhatsApp: sent("whatsapp"),
      };
    })
    .sort((a, b) => a.daysLeft - b.daysLeft || a.name.localeCompare(b.name));
  return { people: people.slice(0, 600), matched: people.length, totals: { bike: people.filter((p) => p.vehicle === "bike").length, car: people.filter((p) => p.vehicle === "car").length, unknown: people.filter((p) => !p.vehicle).length }, template: template.id, from, to };
}

export async function sendRenewals(input: { keys: string[]; channels: ("email" | "whatsapp")[]; template: string; days?: number; budgetMs?: number }, actor: { id: string; name: string } | null) {
  const report = emptyReport();
  const config = await loadConfig();
  const template = pickRenewalTemplate(config.renewalTemplates, input.template);
  const wanted = new Set(input.keys);
  const due = await renewalsDue({ days: input.days ?? 45, overdue: true, template: template.id });
  const people = due.people.filter((person) => wanted.has(person.key));
  const phones = people.map((person) => person.phone);
  const rows = phones.length ? await db.select().from(contacts).where(inArray(contacts.phone, phones)) : [];
  const byPhone = new Map(rows.map((contact) => [contact.phone, contact]));
  const deadline = Date.now() + (input.budgetMs ?? 40_000);
  const today = istToday(); const year = Number(today.slice(0, 4));
  const queue: Parameters<typeof queueOutreach>[3] = []; const queueClaims: string[] = [];
  let index = 0;
  for (; index < people.length; index++) {
    if (Date.now() > deadline) break;
    const person = people[index];
    report.doneIds.push(person.key);
    const contact = byPhone.get(person.phone);
    if (!contact) { report.notAllowed++; continue; }
    const lang = langOf(contact.locale);
    if (input.channels.includes("email")) {
      if (!mayMessage("renewal", "email", contact)) report.notAllowed++;
      else {
        const marker = await claim(contact.id, "renewal", "email", year, renewalRef(person.renewalOn, person.vehicle));
        if (!marker) report.alreadySent++;
        else {
          try {
            const mail = renewalEmail(template, contact.name, person.vehicle, person.renewalOn, lang, shopPhone(), person.estimated);
            await sendMail({ to: contact.email!, subject: mail.subject, heading: mail.heading, paragraphs: mail.paragraphs, unsubscribe: unsubscribeUrl(contact.id), action: { label: lang === "hi" ? "WhatsApp पर बात करें" : lang === "bn" ? "WhatsApp-এ কথা বলুন" : "Chat on WhatsApp", href: `https://wa.me/${site.whatsapp.primary}` } });
            report.emailSent++;
          } catch (error) { await release(marker); report.failed++; if (report.errors.length < 3) report.errors.push(error instanceof Error ? error.message : "Email failed."); }
        }
      }
    }
    if (input.channels.includes("whatsapp")) {
      if (!mayMessage("renewal", "whatsapp", contact)) report.notAllowed++;
      else {
        const marker = await claim(contact.id, "renewal", "whatsapp", year, renewalRef(person.renewalOn, person.vehicle));
        if (!marker) report.alreadySent++;
        else {
          queueClaims.push(marker);
          queue.push({ contactId: contact.id, phone: contact.phone, name: contact.name, locale: lang, body: renderMessage(renewalWhatsApp(template, person.vehicle, person.renewalOn, lang, shopPhone(), person.estimated), { lang, kind: "renewal", name: contact.name, phone: shopPhone() }), posterUrl: null });
        }
      }
    }
  }
  report.remaining = Math.max(0, people.length - index);
  if (!report.remaining) report.doneIds.push(...input.keys.filter((key) => !people.some((person) => person.key === key)));
  if (queue.length) {
    try { report.whatsappQueued = await queueOutreach(`Insurance reminders ${today}`, "renewal", "insurance", queue); }
    catch (error) { for (const marker of queueClaims) await release(marker); report.failed += queue.length; report.errors.push(error instanceof Error ? error.message : "Could not queue WhatsApp."); }
  }
  if (actor && (report.emailSent || report.whatsappQueued)) await logActivity({ kind: "campaign", permission: "campaigns", category: "outreach", title: `${actor.name} sent insurance renewal reminders`, detail: `${report.emailSent} emails, ${report.whatsappQueued} WhatsApp queued.`, actorId: actor.id });
  return report;
}

// ---------------------------------------------------------------------------------------------
// Contact details
// ---------------------------------------------------------------------------------------------

export async function saveContactExtras(input: { id: string; email?: string | null; birthMonth?: number | null; birthDay?: number | null; emailConsent?: "unknown" | "opted_in" | "opted_out" }) {
  const set: Partial<typeof contacts.$inferInsert> = { updatedAt: new Date() };
  if (input.email !== undefined) {
    const email = input.email?.trim().toLowerCase() || null;
    if (email && !/^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,}$/i.test(email)) throw new PublicError("Enter a valid email address.", 400, { fields: { email: "Check the email." } });
    set.email = email;
  }
  if (input.birthMonth !== undefined || input.birthDay !== undefined) {
    const month = input.birthMonth ?? null; const day = input.birthDay ?? null;
    if ((month === null) !== (day === null)) throw new PublicError("Add both the day and the month of the birthday.", 400);
    if (month !== null && day !== null && (month < 1 || month > 12 || day < 1 || day > [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1])) throw new PublicError("That is not a real date.", 400);
    set.birthMonth = month; set.birthDay = day;
  }
  if (input.emailConsent) { set.emailConsent = input.emailConsent; set.emailConsentAt = new Date(); }
  const [row] = await db.update(contacts).set(set).where(eq(contacts.id, input.id)).returning({ id: contacts.id });
  if (!row) throw new PublicError("Contact not found.", 404, { code: "not_found" });
}

// ---------------------------------------------------------------------------------------------
// Daily automatic run (called from the WhatsApp cron every few minutes)
// ---------------------------------------------------------------------------------------------

/**
 * When switched on in Admin, sends today's birthday wishes (people who said YES) and insurance reminders
 * (policies ending within the chosen number of days) between 9 am and 8 pm India time. Each person gets
 * each message once; a run sends a limited number of emails and carries on at the next call.
 */
export async function runDailyOutreach(now = new Date()) {
  const config = await loadConfig();
  const { settings } = config;
  if (!settings.birthday.enabled && !settings.renewal.enabled) return { skipped: "off" };
  const hour = new Date(now.getTime() + 5.5 * 3_600_000).getUTCHours();
  if (hour < 9 || hour >= 20) return { skipped: "outside sending hours" };
  const today = istToday(now);
  const state = (await readSetting("daily_run")) as { day?: string; done?: boolean } | undefined;
  if (state?.day === today && state.done) return { skipped: "done for today" };
  const channels = (flags: { email: boolean; whatsapp: boolean }) => [...(flags.email ? ["email" as const] : []), ...(flags.whatsapp ? ["whatsapp" as const] : [])];
  let remaining = 0; const summary: Record<string, SendReport> = {};
  if (settings.birthday.enabled) {
    const [, month, day] = today.split("-").map(Number);
    const todays = await db.select({ id: contacts.id }).from(contacts).where(and(eq(contacts.birthMonth, month), eq(contacts.birthDay, day), or(eq(contacts.consent, "opted_in"), eq(contacts.emailConsent, "opted_in"))));
    const report = await sendBirthdays({ ids: todays.map((row) => row.id), channels: channels(settings.birthday), template: settings.birthday.template, budgetMs: 40_000 }, null);
    summary.birthday = report; remaining += report.remaining;
  }
  if (settings.renewal.enabled) {
    const due = await renewalsDue({ days: settings.renewal.daysBefore, template: settings.renewal.template });
    const pending = due.people.filter((person) => (settings.renewal.email && person.canEmail && !person.sentEmail) || (settings.renewal.whatsapp && person.canWhatsApp && !person.sentWhatsApp));
    const report = await sendRenewals({ keys: pending.map((person) => person.key), channels: channels(settings.renewal), template: settings.renewal.template, days: settings.renewal.daysBefore, budgetMs: 40_000 }, null);
    summary.renewal = report; remaining += report.remaining;
  }
  await writeSetting("daily_run", { day: today, done: remaining === 0 });
  return summary;
}


// ---------------------------------------------------------------------------------------------
// Copy-and-paste messages (for sending by hand from WhatsApp)
// ---------------------------------------------------------------------------------------------

export type CopyItem = { id: string; name: string; phone: string; text: string };

/** The WhatsApp text for each chosen person, ready to copy. Same opt-in rule as sending: people who have not said YES (birthdays) or said STOP (renewals) are left out. */
export async function copyMessages(input: { kind: "birthday" | "renewal"; ids: string[]; template: string; days?: number }) {
  const config = await loadConfig();
  const items: CopyItem[] = []; let skipped = 0;
  if (input.kind === "birthday") {
    const template = pickBirthdayTemplate(config.birthdayTemplates, input.template);
    const today = istToday();
    const gift = config.settings.birthday.coupon;
    const ids = [...new Set(input.ids)].slice(0, 500);
    const rows = ids.length ? await db.select().from(contacts).where(inArray(contacts.id, ids)) : [];
    for (const contact of rows) {
      if (!mayMessage("birthday", "whatsapp", contact)) { skipped++; continue; }
      let coupon: BirthdayCouponInfo | null = null;
      if (gift.enabled && contact.birthMonth !== null && contact.birthDay !== null) {
        try { coupon = await ensureBirthdayCoupon(contact, gift, lastBirthday({ month: contact.birthMonth, day: contact.birthDay }, today)); } catch { coupon = null; }
      }
      const lang = langOf(contact.locale);
      items.push({ id: contact.id, name: contact.name, phone: contact.phone, text: renderMessage(birthdayWhatsApp(template, lang, coupon), { lang, kind: "birthday", name: contact.name, phone: shopPhone() }) });
    }
    return { items, skipped };
  }
  const template = pickRenewalTemplate(config.renewalTemplates, input.template);
  const wanted = new Set(input.ids);
  const due = await renewalsDue({ days: input.days ?? 45, overdue: true, template: template.id });
  const people = due.people.filter((person) => wanted.has(person.key)).slice(0, 500);
  const phones = people.map((person) => person.phone);
  const rows = phones.length ? await db.select().from(contacts).where(inArray(contacts.phone, phones)) : [];
  const byPhone = new Map(rows.map((contact) => [contact.phone, contact]));
  for (const person of people) {
    const contact = byPhone.get(person.phone);
    if (!contact || !mayMessage("renewal", "whatsapp", contact)) { skipped++; continue; }
    const lang = langOf(contact.locale);
    items.push({ id: person.key, name: contact.name, phone: contact.phone, text: renderMessage(renewalWhatsApp(template, person.vehicle, person.renewalOn, lang, shopPhone(), person.estimated), { lang, kind: "renewal", name: contact.name, phone: shopPhone() }) });
  }
  return { items, skipped };
}
