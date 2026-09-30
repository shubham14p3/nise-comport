"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Check, Clock3, ExternalLink, Megaphone, Pause, Play, Plus, RefreshCw, Send, SkipForward, Square, FlaskConical, X } from "lucide-react";
import PosterPicker from "@/components/poster-picker";
import { useLiveCodes } from "@/components/offers-provider";
import { clampPacing, DEFAULT_PACING, MAX_BATCH, simulateCampaign, type Pacing } from "@/lib/campaign-pacing";
import { CAMPAIGN_KINDS, CAMPAIGN_SERVICES, DEFAULT_MESSAGES, renderMessage, SERVICE_NAMES, type CampaignKind, type Lang, serviceTitle } from "@/lib/campaign-text";
import { addDays, todayIst } from "@/lib/festivals";
import { secureApi } from "@/lib/secure-api-client";

type Campaign = {
  id: string; name: string; kind: CampaignKind; service: string | null; status: string; message: Record<Lang, string>; posters: Partial<Record<Lang, string>> | null;
  couponCode: string | null; audience: { renewalWithinDays?: number | null; locales?: Lang[] | null } | null; testNumbers: string[]; pacing: Pacing; provider: string; templateName: string | null;
  counts: Record<string, number>; tests: number; audienceSize: number | null; nextRoundAt: string | null; round: number; startedAt: string | null;
};
type Listing = { campaigns: Campaign[]; cloudApi: boolean };
type QueueItem = { id: string; campaignName: string; phone: string; name: string; locale: string; body: string; posterUrl: string | null; test: boolean; status: string; scheduledAt: string | null; link: string };

const LANGS: { id: Lang; label: string }[] = [{ id: "en", label: "English" }, { id: "hi", label: "हिन्दी" }, { id: "bn", label: "বাংলা" }];
const STATUS_LABEL: Record<string, string> = { draft: "Draft", test: "Testing", running: "Running", paused: "Paused", done: "Finished" };
type Send = { at: Date; round: number };
type RoundSummary = { round: number; count: number; first: Date; last: Date; wait: string | null };
const clock = (date: Date) => date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" });
const dayName = (date: Date) => date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
/** Groups a simulated schedule into rounds and says how long each pause is, and why. */
function summariseRounds(sends: Send[], dailyLimit: number): RoundSummary[] {
  const rounds: RoundSummary[] = [];
  for (const send of sends) {
    const last = rounds.at(-1);
    if (last && last.round === send.round) { last.count++; last.last = send.at; }
    else rounds.push({ round: send.round, count: 1, first: send.at, last: send.at, wait: null });
  }
  let sentThatDay = 0;
  rounds.forEach((round, index) => {
    const next = rounds[index + 1];
    sentThatDay = index && dayName(rounds[index - 1].first) === dayName(round.first) ? sentThatDay + round.count : round.count;
    if (!next) return;
    const minutes = Math.round((next.first.getTime() - round.last.getTime()) / 60_000);
    if (dayName(next.first) === dayName(round.last)) round.wait = `then a random pause of ${minutes} min`;
    else round.wait = sentThatDay >= dailyLimit ? `daily limit of ${dailyLimit} reached, continues ${dayName(next.first)} at ${clock(next.first)}` : `sending hours over, continues ${dayName(next.first)} at ${clock(next.first)}`;
  });
  return rounds;
}
const time = (iso: string | null) => iso ? new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" }) : "—";
const PHONE_FOR_PREVIEW = "+91 97712 19893";

type Draft = {
  id?: string; name: string; kind: CampaignKind; service: string; message: Record<Lang, string>; posters: Partial<Record<Lang, string>>; couponCode: string;
  renewalWithinDays: string; locales: Lang[]; testNumbers: string; pacing: Pacing; provider: "manual" | "cloud"; templateName: string;
};

const blankDraft = (): Draft => ({
  name: "", kind: "renewal", service: "insurance", message: { ...DEFAULT_MESSAGES.renewal }, posters: {}, couponCode: "", renewalWithinDays: "30", locales: [],
  testNumbers: "", pacing: { ...DEFAULT_PACING }, provider: "manual", templateName: "",
});

/**
 * Admin → WhatsApp campaigns: build a campaign, send yourself a test, start it, and work through
 * the one-tap send queue. Rounds of up to 10 messages go out with random 10–30 minute gaps.
 */
export default function CampaignsPanel() {
  const [data, setData] = useState<Listing | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [testLangs, setTestLangs] = useState<Lang[]>(["en"]);
  const [preview, setPreview] = useState<{ id: string; sends: Send[] } | null>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const liveCodes = useLiveCodes();

  async function load() {
    const [listing, pending] = await Promise.all([secureApi<Listing>("S3k9V6nD2hQ8"), secureApi<{ messages: QueueItem[] }>("V1p7K4dZ8mR5")]);
    setData(listing); setQueue(pending.messages);
  }
  useEffect(() => {
    let active = true;
    const refresh = () => Promise.all([secureApi<Listing>("S3k9V6nD2hQ8"), secureApi<{ messages: QueueItem[] }>("V1p7K4dZ8mR5")])
      .then(([listing, pending]) => { if (active) { setData(listing); setQueue(pending.messages); } })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "Could not load campaigns."); });
    void refresh();
    // The queue fills over time (one round every 10–30 minutes), so keep it fresh while the tab is open.
    const timer = window.setInterval(() => void refresh(), 60_000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  async function act(id: string, action: string, label: string) {
    if (action === "stop" && !window.confirm("Stop this campaign? Messages not yet sent will be skipped.")) return;
    setBusy(`${id}:${action}`); setError(""); setNotice("");
    try {
      const result = await secureApi<Record<string, unknown>>("T6h2F9qB3xN7", { id, action, ...(action === "test" ? { testLocales: testLangs } : {}) });
      const parts = [label];
      if (typeof result.queued === "number") parts.push(`${result.queued} message${result.queued === 1 ? "" : "s"} queued`);
      if (typeof result.scheduled === "number" && result.scheduled) parts.push(`${result.scheduled} scheduled this round`);
      if (typeof result.ready === "number" && result.ready) parts.push(`${result.ready} ready to send below`);
      if (typeof result.sent === "number" && result.sent) parts.push(`${result.sent} sent`);
      if (Array.isArray(result.waiting) && result.waiting.length) parts.push(String(result.waiting[0]));
      setNotice(parts.join(" · "));
      await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not do that."); }
    finally { setBusy(""); }
  }

  async function mark(item: QueueItem, status: "sent" | "skipped") {
    setBusy(item.id); setError("");
    try { await secureApi("L9c3X6vH1tB8", { id: item.id, status }); setQueue((list) => list.filter((row) => row.id !== item.id)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not update."); }
    finally { setBusy(""); }
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!draft) return;
    setBusy("save"); setError(""); setNotice("");
    try {
      await secureApi("R8w4Y1pM5cJ2", {
        ...(draft.id ? { id: draft.id } : {}), name: draft.name, kind: draft.kind, service: draft.service || null, message: draft.message, posters: draft.posters,
        couponCode: draft.couponCode || null, audience: { renewalWithinDays: draft.kind === "renewal" && draft.renewalWithinDays ? Number(draft.renewalWithinDays) : null, locales: draft.locales.length ? draft.locales : null },
        testNumbers: draft.testNumbers.split(/[\s,;]+/).filter(Boolean), pacing: clampPacing(draft.pacing), provider: draft.provider, templateName: draft.templateName || null,
      });
      setNotice(`“${draft.name}” saved. Send yourself a test, then press Start.`);
      setDraft(null);
      await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not save the campaign."); }
    finally { setBusy(""); }
  }

  function edit(row: Campaign) {
    setDraft({
      id: row.id, name: row.name, kind: row.kind, service: row.service ?? "", message: { ...row.message }, posters: row.posters ?? {}, couponCode: row.couponCode ?? "",
      renewalWithinDays: row.audience?.renewalWithinDays ? String(row.audience.renewalWithinDays) : "", locales: row.audience?.locales ?? [],
      testNumbers: row.testNumbers.join(", "), pacing: row.pacing, provider: row.provider === "cloud" ? "cloud" : "manual", templateName: row.templateName ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const ready = queue.filter((item) => item.status === "ready");
  const upcoming = queue.filter((item) => item.status === "scheduled");
  return <section className="admin-queue campaigns">
    <h2><Megaphone size={17}/> WhatsApp campaigns <span>{data?.campaigns.length ?? "…"}</span></h2>
    <div className="promo-admin__bar">
      <button type="button" className="btn btn--primary btn--sm" onClick={() => { setDraft(blankDraft()); setNotice(""); }}><Plus size={15}/>New campaign</button>
      <button type="button" className="btn btn--ghost btn--sm" onClick={() => void load().catch(() => undefined)}><RefreshCw size={15}/>Refresh</button>
      <span className={data?.cloudApi ? "status-pill status-pill--done campaign-mode" : "status-pill campaign-mode"}>{data?.cloudApi ? "WhatsApp Business API connected: automatic sending available" : "One-tap sending (WhatsApp Business API not connected)"}</span>
    </div>
    {error && <div className="alert alert--error" role="alert">{error}</div>}
    {notice && <div className="alert alert--success" role="status">{notice}</div>}

    {draft && <CampaignEditor draft={draft} setDraft={setDraft} onSubmit={save} busy={busy === "save"} cloudApi={Boolean(data?.cloudApi)} liveCodes={liveCodes.map((offer) => offer.code ?? "").filter(Boolean)}/>}

    {(ready.length > 0 || upcoming.length > 0) && <div className="send-queue">
      <h3><Send size={16}/> Ready to send <span>{ready.length}</span></h3>
      {ready.length === 0 && <p className="admin-empty">Nothing to send right now. The next round is below.</p>}
      {ready.map((item) => <article key={item.id} className="send-item">
        <div className="send-item__who"><b>{item.name}</b><small>{item.phone} · {item.locale.toUpperCase()} · {item.campaignName}{item.test ? " · TEST" : ""}</small></div>
        <p className="send-item__body">{item.body}</p>
        {item.posterUrl && <a className="text-link" href={item.posterUrl} target="_blank" rel="noopener noreferrer" download>Poster: open and attach it in WhatsApp <ExternalLink size={13}/></a>}
        <div className="send-item__actions">
          <a className="btn btn--wa btn--sm" href={item.link} target="_blank" rel="noopener noreferrer"><Send size={15}/>Open in WhatsApp</a>
          <button type="button" className="btn btn--primary btn--sm" disabled={busy === item.id} onClick={() => void mark(item, "sent")}><Check size={15}/>Mark sent</button>
          <button type="button" className="btn btn--ghost btn--sm" disabled={busy === item.id} onClick={() => void mark(item, "skipped")}><SkipForward size={15}/>Skip</button>
        </div>
      </article>)}
      {upcoming.length > 0 && <p className="field__hint"><Clock3 size={13}/> Coming up: {upcoming.slice(0, 5).map((item) => `${item.name} at ${time(item.scheduledAt)}`).join(" · ")}{upcoming.length > 5 ? ` and ${upcoming.length - 5} more` : ""}</p>}
    </div>}

    <div className="campaign-list">{(data?.campaigns ?? []).map((row) => {
      const counts = row.counts ?? {};
      const pending = (counts.queued ?? 0) + (counts.scheduled ?? 0) + (counts.ready ?? 0);
      const sim = preview?.id === row.id ? preview.sends : [];
      const rounds = sim.length ? summariseRounds(sim, row.pacing.dailyLimit) : [];
      return <article key={row.id} className={`campaign-card status-${row.status}`}>
        <div className="campaign-card__head">
          <div><b>{row.name}</b><small>{CAMPAIGN_KINDS[row.kind]?.label ?? row.kind}{row.service ? ` · ${SERVICE_NAMES[row.service]?.en ?? row.service}` : ""} · {row.provider === "cloud" ? "automatic (API)" : "one-tap"}</small></div>
          <span className="role-pill">{STATUS_LABEL[row.status] ?? row.status}</span>
        </div>
        <p className="campaign-card__pace">Up to {row.pacing.batchSize} per round · random {row.pacing.gapMinMinutes}–{row.pacing.gapMaxMinutes} min between rounds · max {row.pacing.dailyLimit}/day · {String(row.pacing.windowStart).padStart(2, "0")}:00–{String(row.pacing.windowEnd).padStart(2, "0")}:00 IST</p>
        <div className="campaign-card__stats">
          {row.audienceSize !== null && <span><b>{row.audienceSize}</b> would receive it</span>}
          <span><b>{counts.sent ?? 0}</b> sent</span><span><b>{pending}</b> waiting</span>
          {(counts.failed ?? 0) > 0 && <span><b>{counts.failed}</b> failed</span>}
          {(counts.opted_out ?? 0) > 0 && <span><b>{counts.opted_out}</b> said STOP</span>}
          <span><b>{row.tests}</b> tests</span>
          {row.status === "running" && <span><Clock3 size={12}/> next round {time(row.nextRoundAt)}</span>}
        </div>
        <div className="campaign-card__actions">
          {row.status !== "running" && <button type="button" className="btn btn--ghost btn--sm" onClick={() => edit(row)}>Edit</button>}
          <span className="test-langs">{LANGS.map(({ id, label }) => <label key={id}><input type="checkbox" checked={testLangs.includes(id)} onChange={(event) => setTestLangs(event.target.checked ? [...testLangs, id] : testLangs.filter((lang) => lang !== id))}/>{label}</label>)}</span>
          <button type="button" className="btn btn--ghost btn--sm" disabled={!row.testNumbers.length || busy === `${row.id}:test`} title={row.testNumbers.join(", ") || "Add a test number in Edit"} onClick={() => void act(row.id, "test", `Test sent to ${row.testNumbers.join(", ")}`)}><FlaskConical size={15}/>Send test</button>
          {["draft", "paused", "done"].includes(row.status) && row.status !== "paused" && <button type="button" className="btn btn--primary btn--sm" disabled={busy === `${row.id}:start`} onClick={() => void act(row.id, "start", "Started")}><Play size={15}/>Start</button>}
          {row.status === "paused" && <button type="button" className="btn btn--primary btn--sm" onClick={() => void act(row.id, "resume", "Resumed")}><Play size={15}/>Resume</button>}
          {row.status === "running" && <><button type="button" className="btn btn--ghost btn--sm" onClick={() => void act(row.id, "pause", "Paused")}><Pause size={15}/>Pause</button><button type="button" className="btn btn--ghost btn--sm" onClick={() => void act(row.id, "run", "Checked now")}><RefreshCw size={15}/>Run now</button></>}
          {["running", "paused"].includes(row.status) && <button type="button" className="btn btn--ghost btn--sm" onClick={() => void act(row.id, "stop", "Stopped")}><Square size={15}/>Stop</button>}
          <button type="button" className="profile-text-button" onClick={() => setPreview(preview?.id === row.id ? null : { id: row.id, sends: simulateCampaign(Math.max(1, row.audienceSize ?? pending), new Date(), row.pacing) })}>{preview?.id === row.id ? "Hide schedule" : "Preview schedule"}</button>
        </div>
        {rounds.length > 0 && <div className="schedule-preview">
          <p>If it started now, {sim.length} message{sim.length === 1 ? "" : "s"} would go out in {rounds.length} round{rounds.length === 1 ? "" : "s"}, finishing {dayName(sim.at(-1)!.at)} at {clock(sim.at(-1)!.at)}. The pauses change every time.</p>
          <ol>{rounds.slice(0, 12).map((round) => <li key={round.round}>
            <b>Round {round.round}</b><span>{dayName(round.first)} · {round.count} message{round.count === 1 ? "" : "s"} · {clock(round.first)}{round.count > 1 ? `–${clock(round.last)}` : ""}</span>
            {round.wait && <small>{round.wait}</small>}
          </li>)}</ol>
          {rounds.length > 12 && <p className="field__hint">…and {rounds.length - 12} more rounds.</p>}
        </div>}
      </article>;
    })}</div>
    {data && !data.campaigns.length && <p className="admin-empty">No campaigns yet.</p>}
    <p className="admin-note">Renewal reminders go to customers who haven’t said STOP; offers only to people who replied YES. Every message ends with “Reply STOP”. Replies are recorded automatically when the WhatsApp Business API is connected; otherwise mark them in Contacts.</p>
  </section>;
}

function CampaignEditor({ draft, setDraft, onSubmit, busy, cloudApi, liveCodes }: { draft: Draft; setDraft: (next: Draft | null) => void; onSubmit: (event: FormEvent) => void; busy: boolean; cloudApi: boolean; liveCodes: string[] }) {
  const [lang, setLang] = useState<Lang>("en");
  const update = (patch: Partial<Draft>) => setDraft({ ...draft, ...patch });
  const pace = (patch: Partial<Pacing>) => update({ pacing: { ...draft.pacing, ...patch } });
  const sample = useMemo(() => renderMessage(draft.message[lang], { lang, kind: draft.kind, name: "Priya Kumari", service: draft.service || null, code: draft.couponCode || null, renewalOn: draft.kind === "renewal" ? addDays(todayIst(), 12) : null, phone: PHONE_FOR_PREVIEW }), [draft, lang]);
  return <form className="promo-editor campaign-editor" onSubmit={onSubmit}>
    <div className="promo-editor__head"><h3>{draft.id ? "Edit campaign" : "New campaign"}</h3><button type="button" className="icon-btn" onClick={() => setDraft(null)} aria-label="Close"><X size={18}/></button></div>
    <div className="form-grid form-grid--3">
      <label className="field"><span className="field__label">Name</span><input value={draft.name} onChange={(event) => update({ name: event.target.value })} required maxLength={100} placeholder="Bike insurance renewals: November"/></label>
      <label className="field"><span className="field__label">Type</span><select value={draft.kind} onChange={(event) => { const kind = event.target.value as CampaignKind; update({ kind, message: { ...DEFAULT_MESSAGES[kind] } }); }}>{(Object.keys(CAMPAIGN_KINDS) as CampaignKind[]).map((kind) => <option key={kind} value={kind}>{CAMPAIGN_KINDS[kind].label}</option>)}</select></label>
      <label className="field"><span className="field__label">Service</span><select value={draft.service} onChange={(event) => update({ service: event.target.value })}><option value="">Any</option>{CAMPAIGN_SERVICES.map((service) => <option key={service} value={service}>{serviceTitle(service)}</option>)}</select></label>
    </div>
    <p className="field__hint">{CAMPAIGN_KINDS[draft.kind].detail}</p>

    <div className="lang-tabs" role="tablist">{LANGS.map(({ id, label }) => <button key={id} type="button" role="tab" aria-selected={lang === id} className={lang === id ? "is-active" : undefined} onClick={() => setLang(id)}>{label}</button>)}</div>
    <div className="message-grid">
      <label className="field"><span className="field__label">Message ({LANGS.find((item) => item.id === lang)?.label}) <em>placeholders: {"{name} {service} {date} {code} {phone}"}</em></span>
        <textarea rows={6} value={draft.message[lang]} onChange={(event) => update({ message: { ...draft.message, [lang]: event.target.value } })} maxLength={1000}/>
        <small className="field__hint">{"{date}"} becomes “on 12 October” and {"{code}"} a whole “Use code … for ₹50 off” sentence; each disappears when a contact has no date or the campaign has no code.</small>
        <button type="button" className="profile-text-button" onClick={() => update({ message: { ...draft.message, [lang]: DEFAULT_MESSAGES[draft.kind][lang] } })}>Reset to the default wording</button>
      </label>
      <div className="wa-preview" aria-label="Preview"><span className="wa-preview__label">Preview</span><div className="wa-bubble">{draft.posters[lang] || draft.posters.en ? /* eslint-disable-next-line @next/next/no-img-element -- admin preview */ <img src={draft.posters[lang] || draft.posters.en} alt=""/> : null}<p>{sample}</p></div></div>
    </div>

    <div className="form-grid form-grid--3">
      <label className="field"><span className="field__label">Promo code <em>optional</em></span><input list="live-codes" value={draft.couponCode} onChange={(event) => update({ couponCode: event.target.value.toUpperCase() })} placeholder="e.g. DIWALI26"/><datalist id="live-codes">{liveCodes.map((code) => <option key={code} value={code}/>)}</datalist></label>
      {draft.kind === "renewal" && <label className="field"><span className="field__label">Renewal due within (days)</span><input type="number" min={1} max={365} value={draft.renewalWithinDays} onChange={(event) => update({ renewalWithinDays: event.target.value })} placeholder="Everyone with this service"/></label>}
      <div className="field"><span className="field__label">Only these languages <em>optional</em></span><span className="test-langs">{LANGS.map(({ id, label }) => <label key={id}><input type="checkbox" checked={draft.locales.includes(id)} onChange={(event) => update({ locales: event.target.checked ? [...draft.locales, id] : draft.locales.filter((item) => item !== id) })}/>{label}</label>)}</span></div>
    </div>

    <span className="field__label">Poster <em>sent above the message; one per language</em></span>
    <PosterPicker value={draft.posters} onChange={(posters) => update({ posters })}/>

    <fieldset className="pace-box">
      <legend>Sending speed</legend>
      <div className="form-grid form-grid--3">
        <label className="field"><span className="field__label">Messages per round (max {MAX_BATCH})</span><input type="number" min={1} max={MAX_BATCH} value={draft.pacing.batchSize} onChange={(event) => pace({ batchSize: Number(event.target.value) })}/></label>
        <label className="field"><span className="field__label">Gap between rounds (minutes)</span><span className="input-wrap input-wrap--pair"><input type="number" min={1} max={480} value={draft.pacing.gapMinMinutes} onChange={(event) => pace({ gapMinMinutes: Number(event.target.value) })} aria-label="Shortest gap"/>to<input type="number" min={1} max={480} value={draft.pacing.gapMaxMinutes} onChange={(event) => pace({ gapMaxMinutes: Number(event.target.value) })} aria-label="Longest gap"/></span></label>
        <label className="field"><span className="field__label">Most per day</span><input type="number" min={1} max={500} value={draft.pacing.dailyLimit} onChange={(event) => pace({ dailyLimit: Number(event.target.value) })}/></label>
        <label className="field"><span className="field__label">Send between (IST)</span><span className="input-wrap input-wrap--pair"><input type="number" min={0} max={23} value={draft.pacing.windowStart} onChange={(event) => pace({ windowStart: Number(event.target.value) })} aria-label="From hour"/>:00 to<input type="number" min={1} max={24} value={draft.pacing.windowEnd} onChange={(event) => pace({ windowEnd: Number(event.target.value) })} aria-label="Until hour"/>:00</span></label>
      </div>
      <p className="field__hint">Each gap is picked at random in your range, plus up to a minute, and messages inside a round are 25–90 seconds apart, so sending never looks machine-regular. Set “Messages per round” to 1 to space every single message 10–30 min apart; the pauses only show within a day when “Most per day” is above the round size.</p>
    </fieldset>

    <div className="form-grid form-grid--3">
      <label className="field"><span className="field__label">Test numbers</span><input value={draft.testNumbers} onChange={(event) => update({ testNumbers: event.target.value })} placeholder="+91 80927 66575"/></label>
      <label className="field"><span className="field__label">How messages are sent</span><select value={draft.provider} onChange={(event) => update({ provider: event.target.value as "manual" | "cloud" })}><option value="manual">One-tap from this panel</option><option value="cloud" disabled={!cloudApi}>Automatically (Business API){cloudApi ? "" : ", not connected"}</option></select></label>
      {draft.provider === "cloud" && <label className="field"><span className="field__label">Approved template name</span><input value={draft.templateName} onChange={(event) => update({ templateName: event.target.value })} placeholder="nise_offer_v1"/></label>}
    </div>
    <div className="promo-editor__actions"><button className="btn btn--primary" disabled={busy}>{busy ? "Saving…" : "Save campaign"}</button><button type="button" className="btn btn--ghost" onClick={() => setDraft(null)}>Cancel</button></div>
  </form>;
}
