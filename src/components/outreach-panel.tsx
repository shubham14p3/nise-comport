"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Cake, CarFront, Check, ChevronDown, Copy, Download, Mail, MessageCircle, Pencil, Phone, RefreshCw, Search, Send, ShieldCheck } from "lucide-react";
import OutreachTemplates from "@/components/outreach-templates";
import { secureApi } from "@/lib/secure-api-client";
import type { BirthdayTemplate, Lang, RefreshStatus, RenewalTemplate } from "@/lib/outreach-core";

type Tab = "birthdays" | "renewals" | "templates";
type Channel = "email" | "whatsapp";
type BirthdayPerson = {
  id: string; name: string; phone: string; email: string | null; locale: Lang; area: string | null; month: number; day: number; daysUntil: number; dateLabel: string;
  consent: string; emailConsent: string; wishedEmail: boolean; wishedWhatsApp: boolean; canEmail: boolean; canWhatsApp: boolean; cardUrl: string; caption: string;
};
type BirthdayList = { totals: { all: number; today: number; week: number; month: number }; matched: number; template: string; people: BirthdayPerson[]; refresh?: RefreshStatus };
type RenewalPerson = {
  key: string; contactId: string | null; name: string; phone: string; email: string | null; vehicle: "bike" | "car" | null; renewalOn: string; daysLeft: number; locale: Lang;
  consent: string; emailConsent: string; canEmail: boolean; canWhatsApp: boolean; sentEmail: boolean; sentWhatsApp: boolean;
};
type RenewalList = { people: RenewalPerson[]; matched: number; totals: { bike: number; car: number; unknown: number }; template: string; from: string; to: string; refresh?: RefreshStatus };
type Report = { doneIds: string[]; emailSent: number; whatsappQueued: number; notAllowed: number; alreadySent: number; failed: number; remaining: number; errors: string[] };
type Config = { settings: { birthday: { template: string }; renewal: { template: string } }; birthdayTemplates: BirthdayTemplate[]; renewalTemplates: RenewalTemplate[] };

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const day = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const when = (days: number) => (days === 0 ? "today" : days === 1 ? "tomorrow" : days > 0 ? `in ${days} days` : `${-days} day${days === -1 ? "" : "s"} ago`);
const pill = (state: string, yes: string, no: string, unknown: string) => state === "opted_in" ? <span className="status-pill status-pill--done">{yes}</span> : state === "opted_out" ? <span className="status-pill status-pill--warn">{no}</span> : <span className="status-pill">{unknown}</span>;
const waLink = (phone: string, text = "") => `https://wa.me/${phone.replace(/\D/g, "")}${text ? `?text=${encodeURIComponent(text)}` : ""}`;

/** Admin → Birthdays & renewals. Every staff member (admin or staff) can open it. */
export default function OutreachPanel() {
  const [tab, setTab] = useState<Tab>("birthdays");
  const [config, setConfig] = useState<Config | null>(null);
  const loadConfig = useCallback(async () => { try { setConfig(await secureApi<Config>("B5dY8rN2cV6w", { view: "config" })); } catch { /* the lists show their own errors */ } }, []);
  useEffect(() => { void loadConfig(); }, [loadConfig]);
  return <section className="admin-queue outreach">
    <h2><Cake size={17}/> Birthdays &amp; insurance renewals</h2>
    <div className="seg" role="tablist" aria-label="Birthdays and renewals">
      {([["birthdays", "Birthdays"], ["renewals", "Insurance renewals"], ["templates", "Cards, wording & automatic"]] as [Tab, string][]).map(([id, label]) => <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? "is-active" : undefined} onClick={() => setTab(id)}>{label}</button>)}
    </div>
    {tab === "birthdays" && <Birthdays config={config}/>}
    {tab === "renewals" && <Renewals config={config}/>}
    {tab === "templates" && <OutreachTemplates onChanged={() => void loadConfig()}/>}
  </section>;
}

/** Sends in rounds until everyone selected is handled (each request has a time limit), adding up the results. */
async function sendAll(op: Record<string, unknown>, ids: string[], idsKey: "ids" | "keys", progress: (done: number) => void): Promise<Report> {
  const total: Report = { doneIds: [], emailSent: 0, whatsappQueued: 0, notAllowed: 0, alreadySent: 0, failed: 0, remaining: 0, errors: [] };
  let left = ids;
  for (let round = 0; round < 60 && left.length; round++) {
    const report = await secureApi<Report>("O3bQ7mT5xK2n", { ...op, [idsKey]: left });
    for (const key of ["emailSent", "whatsappQueued", "notAllowed", "alreadySent", "failed"] as const) total[key] += report[key];
    total.errors.push(...report.errors); total.doneIds.push(...report.doneIds);
    const done = new Set(total.doneIds);
    left = left.filter((id) => !done.has(id));
    progress(ids.length - left.length);
    if (!report.doneIds.length) break;
  }
  total.remaining = left.length;
  return total;
}

const summary = (report: Report) => [
  report.emailSent ? `${report.emailSent} email${report.emailSent === 1 ? "" : "s"} sent` : "",
  report.whatsappQueued ? `${report.whatsappQueued} WhatsApp message${report.whatsappQueued === 1 ? "" : "s"} queued (open WhatsApp → Ready to send)` : "",
  report.alreadySent ? `${report.alreadySent} already sent before` : "",
  report.notAllowed ? `${report.notAllowed} skipped (no permission or no email)` : "",
  report.failed ? `${report.failed} failed${report.errors[0] ? `: ${report.errors[0]}` : ""}` : "",
  report.remaining ? `${report.remaining} not done yet, press Send again` : "",
].filter(Boolean).join(" · ") || "Nothing to send.";

const timeLabel = (iso: string) => new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" });
const countdown = (ms: number) => { const total = Math.max(0, Math.ceil(ms / 60000)); const h = Math.floor(total / 60); const m = total % 60; return h ? `${h}h ${m}m` : `${m}m`; };

type RefreshResult = { scanned: number; birthdays: number; vehicles: number; contactsAdded: number; refresh: RefreshStatus };

/** "Refresh the data": reads the saved records again (new imports, new dates of birth). Allowed once in the morning and once in the evening; shows when the next one opens. */
function RefreshData({ status, onDone, onError, onNotice }: { status?: RefreshStatus; onDone: (next: RefreshStatus) => void; onError: (message: string) => void; onNotice: (message: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 30_000); return () => window.clearInterval(timer); }, []);
  const opensIn = status?.nextAt ? new Date(status.nextAt).getTime() - now : 0;
  const locked = Boolean(status && !status.allowed && opensIn > 0);
  async function run() {
    setBusy(true); onError(""); onNotice("Reading your saved records… this can take up to a minute.");
    try {
      const result = await secureApi<RefreshResult>("O3bQ7mT5xK2n", { action: "scan" });
      onNotice(`Data refreshed: ${result.scanned} records read, ${result.birthdays} birthdays found, ${result.vehicles} marked bike/car, ${result.contactsAdded} new contacts added.`);
      onDone(result.refresh);
    } catch (reason) { onNotice(""); onError(reason instanceof Error ? reason.message : "Could not refresh the data."); }
    finally { setBusy(false); }
  }
  return <span className="outreach-refresh">
    <button type="button" className="btn btn--ghost btn--sm" disabled={busy || locked || !status} onClick={() => void run()} title="Reads your saved records again for new dates of birth and bike / car. Allowed once in the morning and once in the evening."><RefreshCw size={15}/> {busy ? "Refreshing…" : "Refresh the data"}</button>
    {status && <small>{locked ? `Next refresh opens at ${timeLabel(status.nextAt!)} (in ${countdown(opensIn)}). ` : ""}{status.usedToday} of {status.limit} used today{status.lastAt ? ` · last ${timeLabel(status.lastAt)}` : ""}</small>}
  </span>;
}

function ChannelPick({ value, onChange }: { value: Channel[]; onChange: (next: Channel[]) => void }) {
  const toggle = (channel: Channel) => onChange(value.includes(channel) ? value.filter((item) => item !== channel) : [...value, channel]);
  return <span className="outreach-channels"><label className="check"><input type="checkbox" checked={value.includes("email")} onChange={() => toggle("email")}/> <Mail size={14}/> Email</label><label className="check"><input type="checkbox" checked={value.includes("whatsapp")} onChange={() => toggle("whatsapp")}/> <MessageCircle size={14}/> WhatsApp</label></span>;
}

function Birthdays({ config }: { config: Config | null }) {
  const [range, setRange] = useState<"today" | "week" | "month" | "all">("today");
  const [month, setMonth] = useState(0);
  const [q, setQ] = useState("");
  const [template, setTemplate] = useState("");
  const [data, setData] = useState<BirthdayList | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [channels, setChannels] = useState<Channel[]>(["email", "whatsapp"]);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [copied, setCopied] = useState("");
  const chosen = template || config?.settings.birthday.template || "";

  const load = useCallback(async () => {
    try {
      const result = await secureApi<BirthdayList>("B5dY8rN2cV6w", { view: "birthdays", range, month: month ? String(month) : "", q, template: chosen });
      setData(result); setError("");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not load birthdays."); }
  }, [range, month, q, chosen]);
  useEffect(() => {
    let active = true;
    secureApi<BirthdayList>("B5dY8rN2cV6w", { view: "birthdays", range, month: month ? String(month) : "", q, template: chosen })
      .then((result) => { if (active) { setData(result); setError(""); } }).catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "Could not load birthdays."); });
    return () => { active = false; };
  }, [range, month, q, chosen]);

  const people = useMemo(() => data?.people ?? [], [data]);
  const selected = people.filter((person) => picked.has(person.id));
  const willEmail = selected.filter((person) => person.canEmail && !person.wishedEmail).length;
  const willWhatsApp = selected.filter((person) => person.canWhatsApp && !person.wishedWhatsApp).length;

  async function send() {
    setBusy("send"); setError(""); setNotice("");
    try {
      const report = await sendAll({ action: "send-birthdays", channels, template: chosen }, selected.map((person) => person.id), "ids", (done) => setNotice(`Sending… ${done} of ${selected.length} done`));
      setNotice(summary(report)); setPicked(new Set()); await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not send."); }
    finally { setBusy(""); }
  }
  async function copyAll() {
    setBusy("copy"); setError(""); setNotice("");
    try {
      const result = await secureApi<{ items: { id: string; name: string; phone: string; text: string }[]; skipped: number }>("O3bQ7mT5xK2n", { action: "copy", kind: "birthday", ids: selected.map((person) => person.id), template: chosen });
      await navigator.clipboard.writeText(result.items.map((item) => `${item.name} · ${item.phone}\n${item.text}`).join("\n\n----------\n\n"));
      setNotice(`Copied ${result.items.length} message${result.items.length === 1 ? "" : "s"}${result.skipped ? `. ${result.skipped} left out because they have not said YES` : ""}. Paste into WhatsApp or a note.`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not copy the messages."); }
    finally { setBusy(""); }
  }
  async function copyOne(person: BirthdayPerson) {
    setBusy(person.id); setError("");
    try {
      const result = await secureApi<{ items: { text: string }[]; skipped: number }>("O3bQ7mT5xK2n", { action: "copy", kind: "birthday", ids: [person.id], template: chosen });
      if (!result.items.length) { setError(`${person.name} has not said YES on WhatsApp yet, so no message was prepared.`); return; }
      await navigator.clipboard.writeText(result.items[0].text);
      setCopied(`msg-${person.id}`); setTimeout(() => setCopied(""), 1500);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not copy the message."); }
    finally { setBusy(""); }
  }
  async function consent(person: BirthdayPerson, kind: "whatsapp" | "email", next: "opted_in" | "opted_out" | "unknown") {
    setBusy(person.id); setError("");
    try {
      if (kind === "whatsapp") await secureApi("J7t1P5xW3qM9", { id: person.id, consent: next });
      else await secureApi("O3bQ7mT5xK2n", { action: "contact", id: person.id, emailConsent: next });
      await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not update."); }
    finally { setBusy(""); }
  }
  async function copy(text: string, id: string) { try { await navigator.clipboard.writeText(text); setCopied(id); setTimeout(() => setCopied(""), 1500); } catch { setError("Could not copy. Select the text and copy it by hand."); } }

  const totals = data?.totals;
  return <div className="outreach-body">
    <p className="admin-lead">Everyone with a birthday on file. Wishes go <b>only to people who said YES</b> (WhatsApp YES or Email OK), each person once a year. Mark who agreed with the buttons on each row.</p>
    <div className="promo-admin__bar">
      <div className="seg">{([["today", `Today${totals ? ` (${totals.today})` : ""}`], ["week", `7 days${totals ? ` (${totals.week})` : ""}`], ["month", `30 days${totals ? ` (${totals.month})` : ""}`], ["all", `All${totals ? ` (${totals.all})` : ""}`]] as const).map(([id, label]) => <button key={id} type="button" className={!month && range === id ? "is-active" : undefined} onClick={() => { setMonth(0); setRange(id); }}>{label}</button>)}</div>
      <select aria-label="Month" value={month} onChange={(event) => setMonth(Number(event.target.value))}><option value={0}>Any month</option>{MONTHS.map((name, index) => <option key={name} value={index + 1}>{name}</option>)}</select>
      <label className="input-wrap"><Search size={16}/><input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Name, mobile or area" aria-label="Search birthdays"/></label>
    </div>
    <div className="outreach-send">
      <label className="field"><span className="field__label">Card</span><select value={chosen} onChange={(event) => setTemplate(event.target.value)}>{(config?.birthdayTemplates ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <ChannelPick value={channels} onChange={setChannels}/>
      <button type="button" className="btn btn--primary" disabled={busy === "send" || !selected.length || !channels.length} onClick={() => void send()}><Send size={16}/> {busy === "send" ? "Sending…" : `Send to ${selected.length} selected`}</button>
      {selected.length > 0 && <small>{channels.includes("email") ? `${willEmail} email` : ""}{channels.includes("email") && channels.includes("whatsapp") ? " · " : ""}{channels.includes("whatsapp") ? `${willWhatsApp} WhatsApp` : ""} will go out (people without YES or already wished are skipped)</small>}
      <button type="button" className="btn btn--ghost btn--sm" disabled={busy === "copy" || !selected.length} onClick={() => void copyAll()} title="Copies each selected person's WhatsApp message with their name and number, to paste into WhatsApp"><Copy size={15}/> {busy === "copy" ? "Preparing…" : `Copy ${selected.length || ""} WhatsApp message${selected.length === 1 ? "" : "s"}`}</button>
      <RefreshData status={data?.refresh} onDone={() => void load()} onError={setError} onNotice={setNotice}/>
    </div>
    {error && <div className="alert alert--error" role="alert">{error}</div>}
    {notice && <div className="alert alert--success" role="status">{notice}</div>}
    {people.length > 0 && <label className="check outreach-all"><input type="checkbox" checked={selected.length === people.length} onChange={(event) => setPicked(event.target.checked ? new Set(people.map((person) => person.id)) : new Set())}/> Select all {people.length} shown{data && data.matched > people.length ? ` (of ${data.matched})` : ""}</label>}
    <div className="contact-list">{people.map((person) => <article key={person.id} className="contact-row outreach-row">
      <input type="checkbox" aria-label={`Select ${person.name}`} checked={picked.has(person.id)} onChange={(event) => setPicked((current) => { const next = new Set(current); if (event.target.checked) next.add(person.id); else next.delete(person.id); return next; })}/>
      <div>
        <b>{person.name}</b> <span className={person.daysUntil === 0 ? "status-pill status-pill--done" : "status-pill"}>{person.dateLabel} · {when(person.daysUntil)}</span>
        <small>{person.phone}{person.email ? ` · ${person.email}` : " · no email"} · {person.locale.toUpperCase()}{person.area ? ` · ${person.area}` : ""}</small>
        <span className="outreach-row__state">WhatsApp {pill(person.consent, "YES", "STOP", "not asked")} Email {pill(person.emailConsent, "OK", "stopped", "not asked")}{person.wishedEmail && <em><Check size={12}/> emailed this year</em>}{person.wishedWhatsApp && <em><Check size={12}/> WhatsApp this year</em>}</span>
      </div>
      <div className="contact-row__actions">
        {person.consent !== "opted_in" ? <button type="button" className="profile-text-button" disabled={busy === person.id} onClick={() => void consent(person, "whatsapp", "opted_in")}>WhatsApp YES</button> : <button type="button" className="profile-text-button" disabled={busy === person.id} onClick={() => void consent(person, "whatsapp", "unknown")}>Undo YES</button>}
        {person.email && (person.emailConsent !== "opted_in" ? <button type="button" className="profile-text-button" disabled={busy === person.id} onClick={() => void consent(person, "email", "opted_in")}>Email OK</button> : <button type="button" className="profile-text-button" disabled={busy === person.id} onClick={() => void consent(person, "email", "unknown")}>Undo OK</button>)}
        <a className="profile-text-button" href={`tel:${person.phone}`}><Phone size={13}/> Call</a>
        {person.consent !== "opted_out" && <a className="profile-text-button" href={waLink(person.phone)} target="_blank" rel="noreferrer"><MessageCircle size={13}/> Chat</a>}
        <a className="profile-text-button" href={person.cardUrl} target="_blank" rel="noreferrer" title="Open the card to save it, then post it on Instagram or WhatsApp status"><Download size={13}/> Card</a>
        <button type="button" className="profile-text-button" disabled={busy === person.id} onClick={() => void copyOne(person)} title="Copies this person's WhatsApp message to paste into WhatsApp"><Copy size={13}/> {copied === `msg-${person.id}` ? "Copied" : "WhatsApp text"}</button>
        <button type="button" className="profile-text-button" onClick={() => void copy(person.caption, person.id)} title="Caption for Instagram"><Copy size={13}/> {copied === person.id ? "Copied" : "Instagram caption"}</button>
        <button type="button" className="profile-text-button" onClick={() => setEditing(editing === person.id ? null : person.id)}><Pencil size={13}/> Edit</button>
      </div>
      {editing === person.id && <ContactEdit person={person} onDone={() => { setEditing(null); void load(); }} onError={setError}/>}
    </article>)}</div>
    {data && !people.length && <p className="admin-empty">{data.totals.all ? "No birthdays in this view." : "No birthdays saved yet. Press “Refresh the data” to read them from the Excel files you imported, or add a date of birth with Edit on a contact."}</p>}
    <p className="outreach-note"><ShieldCheck size={14}/> Instagram does not allow a business to message people first, so use <b>Card</b> + <b>Instagram caption</b> to post the wish on your page or story and tag them.</p>
  </div>;
}

function ContactEdit({ person, onDone, onError }: { person: BirthdayPerson; onDone: () => void; onError: (message: string) => void }) {
  const [email, setEmail] = useState(person.email ?? "");
  const [dob, setDob] = useState(`2000-${String(person.month).padStart(2, "0")}-${String(person.day).padStart(2, "0")}`);
  const [busy, setBusy] = useState(false);
  async function save() {
    setBusy(true);
    try {
      const [, month, dayOfMonth] = dob.split("-").map(Number);
      await secureApi("O3bQ7mT5xK2n", { action: "contact", id: person.id, email: email.trim() || null, birthMonth: month || null, birthDay: dayOfMonth || null });
      onDone();
    } catch (reason) { onError(reason instanceof Error ? reason.message : "Could not save."); }
    finally { setBusy(false); }
  }
  return <div className="outreach-edit">
    <label className="field"><span className="field__label">Email</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={200}/></label>
    <label className="field"><span className="field__label">Birthday <em>the year is ignored</em></span><input type="date" value={dob} onChange={(event) => setDob(event.target.value)}/></label>
    <button type="button" className="btn btn--primary btn--sm" disabled={busy} onClick={() => void save()}>{busy ? "Saving…" : "Save"}</button>
  </div>;
}

function Renewals({ config }: { config: Config | null }) {
  const [days, setDays] = useState(7);
  const [overdue, setOverdue] = useState(false);
  const [vehicle, setVehicle] = useState("");
  const [q, setQ] = useState("");
  const [template, setTemplate] = useState("");
  const [data, setData] = useState<RenewalList | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [channels, setChannels] = useState<Channel[]>(["email", "whatsapp"]);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const chosen = template || config?.settings.renewal.template || "";

  const load = useCallback(async () => {
    try { setData(await secureApi<RenewalList>("B5dY8rN2cV6w", { view: "renewals", days: String(days), overdue, vehicle, q, template: chosen })); setError(""); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not load renewals."); }
  }, [days, overdue, vehicle, q, chosen]);
  useEffect(() => {
    let active = true;
    secureApi<RenewalList>("B5dY8rN2cV6w", { view: "renewals", days: String(days), overdue, vehicle, q, template: chosen })
      .then((result) => { if (active) { setData(result); setError(""); } }).catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "Could not load renewals."); });
    return () => { active = false; };
  }, [days, overdue, vehicle, q, chosen]);

  const people = useMemo(() => data?.people ?? [], [data]);
  const selected = people.filter((person) => picked.has(person.key));
  async function copyAll() {
    setBusy("copy"); setError(""); setNotice("");
    try {
      const result = await secureApi<{ items: { id: string; name: string; phone: string; text: string }[]; skipped: number }>("O3bQ7mT5xK2n", { action: "copy", kind: "renewal", ids: selected.map((person) => person.key), template: chosen, days: Math.max(days, 45) });
      await navigator.clipboard.writeText(result.items.map((item) => `${item.name} · ${item.phone}\n${item.text}`).join("\n\n----------\n\n"));
      setNotice(`Copied ${result.items.length} message${result.items.length === 1 ? "" : "s"}${result.skipped ? `. ${result.skipped} left out (stopped or not in contacts)` : ""}. Paste into WhatsApp or a note.`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not copy the messages."); }
    finally { setBusy(""); }
  }
  async function send() {
    setBusy("send"); setError(""); setNotice("");
    try {
      const report = await sendAll({ action: "send-renewals", channels, template: chosen, days: Math.max(days, 45) }, selected.map((person) => person.key), "keys", (done) => setNotice(`Sending… ${done} of ${selected.length} done`));
      setNotice(summary(report)); setPicked(new Set()); await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not send."); }
    finally { setBusy(""); }
  }

  return <div className="outreach-body">
    <p className="admin-lead">Bike and car policies that end soon, from your imported insurance registers. Where an Excel sheet had no end date, it is taken as one year after the policy date. Reminders go to everyone who has not said STOP.</p>
    <div className="promo-admin__bar">
      <div className="seg">{[7, 14, 30].map((value) => <button key={value} type="button" className={days === value ? "is-active" : undefined} onClick={() => setDays(value)}>Next {value} days</button>)}</div>
      <div className="seg">{([["", `All${data ? ` (${data.matched})` : ""}`], ["bike", `Bike${data ? ` (${data.totals.bike})` : ""}`], ["car", `Car${data ? ` (${data.totals.car})` : ""}`]] as const).map(([id, label]) => <button key={id} type="button" className={vehicle === id ? "is-active" : undefined} onClick={() => setVehicle(id)}>{label}</button>)}</div>
      <label className="check"><input type="checkbox" checked={overdue} onChange={(event) => setOverdue(event.target.checked)}/> Also ended in the last 30 days</label>
      <label className="input-wrap"><Search size={16}/><input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Name or mobile" aria-label="Search renewals"/></label>
    </div>
    <div className="outreach-send">
      <label className="field"><span className="field__label">Reminder wording</span><select value={chosen} onChange={(event) => setTemplate(event.target.value)}>{(config?.renewalTemplates ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <ChannelPick value={channels} onChange={setChannels}/>
      <button type="button" className="btn btn--primary" disabled={busy === "send" || !selected.length || !channels.length} onClick={() => void send()}><Send size={16}/> {busy === "send" ? "Sending…" : `Remind ${selected.length} selected`}</button>
      <button type="button" className="btn btn--ghost btn--sm" disabled={busy === "copy" || !selected.length} onClick={() => void copyAll()} title="Copies each selected person's WhatsApp reminder with their name and number, to paste into WhatsApp"><Copy size={15}/> {busy === "copy" ? "Preparing…" : `Copy ${selected.length || ""} WhatsApp message${selected.length === 1 ? "" : "s"}`}</button>
      <RefreshData status={data?.refresh} onDone={() => void load()} onError={setError} onNotice={setNotice}/>
    </div>
    {error && <div className="alert alert--error" role="alert">{error}</div>}
    {notice && <div className="alert alert--success" role="status">{notice}</div>}
    {people.length > 0 && <label className="check outreach-all"><input type="checkbox" checked={selected.length === people.length} onChange={(event) => setPicked(event.target.checked ? new Set(people.map((person) => person.key)) : new Set())}/> Select all {people.length} shown{data && data.matched > people.length ? ` (of ${data.matched})` : ""}</label>}
    <div className="contact-list">{people.map((person) => <article key={person.key} className="contact-row outreach-row">
      <input type="checkbox" aria-label={`Select ${person.name}`} checked={picked.has(person.key)} onChange={(event) => setPicked((current) => { const next = new Set(current); if (event.target.checked) next.add(person.key); else next.delete(person.key); return next; })}/>
      <div>
        <b>{person.name}</b> <span className={person.daysLeft < 0 ? "status-pill status-pill--warn" : person.daysLeft <= 3 ? "status-pill status-pill--warn" : "status-pill"}>{person.vehicle === "bike" ? "Bike" : person.vehicle === "car" ? "Car" : "Vehicle"} · ends {day(person.renewalOn)} ({when(person.daysLeft)})</span>
        <small>{person.phone}{person.email ? ` · ${person.email}` : " · no email"} · {person.locale.toUpperCase()}{person.contactId ? "" : " · not in contacts yet"}</small>
        <span className="outreach-row__state">WhatsApp {pill(person.consent, "YES", "STOP", "ok")} Email {pill(person.emailConsent, "OK", "stopped", "ok")}{person.sentEmail && <em><Check size={12}/> emailed</em>}{person.sentWhatsApp && <em><Check size={12}/> WhatsApp queued</em>}</span>
      </div>
      <div className="contact-row__actions">
        <a className="profile-text-button" href={`tel:${person.phone}`}><Phone size={13}/> Call</a>
        {person.consent !== "opted_out" && <a className="profile-text-button" href={waLink(person.phone)} target="_blank" rel="noreferrer"><MessageCircle size={13}/> Chat</a>}
      </div>
    </article>)}</div>
    {data && !people.length && <p className="admin-empty"><CarFront size={16}/> No policies end in this period. Import an insurance register in Records, then press “Refresh the data” to mark bike and car.</p>}
    <p className="outreach-note"><ChevronDown size={14}/> To send these automatically {days} days before, open “Cards, wording &amp; automatic”.</p>
  </div>;
}
