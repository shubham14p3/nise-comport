"use client";

import { FormEvent, useEffect, useState } from "react";
import { KeyRound, Plus, Users, X } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons";
import ScopePicker, { type Scope } from "@/components/scope-picker";
import { addDays, todayIst } from "@/lib/festivals";
import { publishedServiceDetails, serviceCatalog } from "@/lib/services";
import { secureApi } from "@/lib/secure-api-client";

type Batch = { id: string; name: string; prefix: string; discountType: string; discountValue: string; minimumAmount: string; maxDiscount: string | null; usesPerCode: number; issued: number; used: number; active: boolean; validOn: string; expiresAt: string | null; createdAt: string };
type Code = { code: string; active: boolean; name: string; email: string; phone: string | null; whatsapp: string | null; used: number };
type AudienceKind = "people" | "all" | "used" | "inactive";

const money = (value: string | number) => `₹${Number(value).toLocaleString("en-IN")}`;
const pretty = (phone: string) => phone.replace(/^\+91(\d{5})(\d{5})$/, "+91 $1 $2");

/**
 * Personal codes: one unique code per chosen customer, tied to their account so it can't be
 * shared, usable a set number of times, and only on the services picked.
 */
export default function PersonalCodes() {
  const [batches, setBatches] = useState<Batch[] | null>(null);
  const [form, setForm] = useState(false);
  const [codes, setCodes] = useState<{ batch: Batch; codes: Code[] } | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    try { setBatches((await secureApi<{ batches: Batch[] }>("Z5b8N2qT6wK1")).batches); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not load personal codes."); }
  }
  useEffect(() => {
    let active = true;
    secureApi<{ batches: Batch[] }>("Z5b8N2qT6wK1").then((result) => { if (active) setBatches(result.batches); })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "Could not load personal codes."); });
    return () => { active = false; };
  }, []);

  async function toggle(batch: Batch) {
    try { await secureApi("H2c7R4vM9xL5", { id: batch.id, active: !batch.active }); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not update."); }
  }
  async function showCodes(batch: Batch) {
    try { setCodes({ batch, codes: (await secureApi<{ codes: Code[] }>("Z5b8N2qT6wK1", { id: batch.id })).codes }); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not load the codes."); }
  }

  return <div className="personal-codes">
    <div className="personal-codes__head">
      <h3><KeyRound size={17}/> Personal codes</h3>
      <button type="button" className="btn btn--primary btn--sm" onClick={() => { setForm(true); setNotice(""); }}><Plus size={15}/>Create personal codes</button>
    </div>
    <p className="admin-lead">Each chosen customer gets their own code (e.g. DIWALI-7KQ2M9XA). It only works when they’re signed in to their own account, so copying it is useless, and it can be used only as many times as you allow, only on the services you pick.</p>
    {error && <div className="alert alert--error" role="alert">{error}</div>}
    {notice && <div className="alert alert--success" role="status">{notice}</div>}
    {form && <BatchForm onCancel={() => setForm(false)} onDone={(message) => { setForm(false); setNotice(message); void load(); }}/>}
    {batches && !batches.length && !form && <p className="admin-empty">No personal codes yet.</p>}
    <div className="batch-list">{(batches ?? []).map((batch) => <article key={batch.id} className={batch.active ? "batch-row" : "batch-row is-off"}>
      <div>
        <b>{batch.name} <small>· {batch.prefix}-…</small></b>
        <small>{batch.discountType === "percent" ? `${Number(batch.discountValue)}% off${batch.maxDiscount ? ` (max ${money(batch.maxDiscount)})` : ""}` : `${money(batch.discountValue)} off`}{Number(batch.minimumAmount) ? ` on ${money(batch.minimumAmount)}+` : ""} · {batch.usesPerCode} use{batch.usesPerCode === 1 ? "" : "s"} per customer · {batch.validOn}{batch.expiresAt ? ` · until ${new Date(batch.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" })}` : ""}</small>
        <span className="batch-row__stats"><em><Users size={12}/> {batch.issued} customers</em><em>{batch.used} uses</em></span>
      </div>
      <div className="batch-row__actions">
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => void showCodes(batch)}>See codes</button>
        <label className="switch" title={batch.active ? "Switch all codes off" : "Switch on"}><input type="checkbox" checked={batch.active} onChange={() => void toggle(batch)}/><span/></label>
      </div>
    </article>)}</div>
    {codes && <div className="record-sheet" role="dialog" aria-label={`Codes for ${codes.batch.name}`}>
      <div className="record-sheet__panel">
        <div className="promo-editor__head"><h3>{codes.batch.name} · {codes.codes.length} codes</h3><button type="button" className="icon-btn" onClick={() => setCodes(null)} aria-label="Close"><X size={18}/></button></div>
        <p className="field__hint">Send each customer their own code. It only works on their account.</p>
        <div className="code-list">{codes.codes.map((row) => {
          const number = (row.whatsapp ?? row.phone ?? "").replace(/\D/g, "");
          const message = `Namaste ${row.name.split(/\s+/)[0]}, your personal NISE COMPORT code is ${row.code}. Use it when you're signed in to your account on nisecomport.com.`;
          return <article key={row.code} className="code-row">
            <div><b>{row.name}</b><small>{row.email}{row.phone ? ` · ${pretty(row.phone)}` : ""}</small></div>
            <code>{row.code}</code>
            <span className={row.used ? "status-pill status-pill--done" : "status-pill"}>{row.used ? `used ${row.used}×` : "not used"}</span>
            {number && <a className="icon-btn" href={`https://wa.me/${number}?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer" aria-label={`Send to ${row.name} on WhatsApp`}><WhatsAppIcon size={16}/></a>}
          </article>;
        })}</div>
      </div>
    </div>}
  </div>;
}

function BatchForm({ onCancel, onDone }: { onCancel: () => void; onDone: (message: string) => void }) {
  const today = todayIst();
  const [name, setName] = useState("");
  const [prefix, setPrefix] = useState("");
  const [discountType, setDiscountType] = useState<"fixed" | "percent">("fixed");
  const [discount, setDiscount] = useState("50");
  const [minimum, setMinimum] = useState("150");
  const [maxDiscount, setMaxDiscount] = useState("");
  const [uses, setUses] = useState("2");
  const [scope, setScope] = useState<Scope | null>(null);
  const [startsOn, setStartsOn] = useState(today);
  const [endsOn, setEndsOn] = useState(addDays(today, 30));
  const [kind, setKind] = useState<AudienceKind>("people");
  const [people, setPeople] = useState("");
  const [usedServices, setUsedServices] = useState<string[]>([]);
  const [days, setDays] = useState("90");
  const [notify, setNotify] = useState(true);
  const [preview, setPreview] = useState<{ count: number; capped: boolean; sample: string[] } | null>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const audience = () => kind === "people" ? { kind, values: people.split(/[\n,;]+/).map((value) => value.trim()).filter(Boolean) }
    : kind === "used" ? { kind, services: usedServices } : kind === "inactive" ? { kind, days: Number(days) || 90 } : { kind };

  async function check() {
    setBusy("preview"); setError("");
    try { setPreview(await secureApi("F6t1W8kN3pQ2", { action: "preview", audience: audience() })); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not count customers."); }
    finally { setBusy(""); }
  }
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy("create"); setError("");
    try {
      const result = await secureApi<{ issued: number }>("F6t1W8kN3pQ2", {
        action: "create", name, prefix, discountType, discount: Number(discount), minimum: Number(minimum),
        maxDiscount: discountType === "percent" && maxDiscount ? Number(maxDiscount) : null, usesPerCode: Number(uses) || 1,
        appliesTo: scope, audience: audience(), startsOn, endsOn, notify,
      });
      onDone(`${result.issued} personal codes created.${notify ? " Customers are being emailed their code." : ""}`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not create the codes."); }
    finally { setBusy(""); }
  }
  const pickable = [{ slug: "print", title: "Print orders" }, { slug: "pan", title: "PAN requests" }, ...serviceCatalog.map((group) => ({ slug: group.slug, title: `${group.title} (all)` })), ...publishedServiceDetails.map((service) => ({ slug: service.slug, title: service.title }))];

  return <form className="promo-editor" onSubmit={submit}>
    <div className="promo-editor__head"><h3>Create personal codes</h3><button type="button" className="icon-btn" onClick={onCancel} aria-label="Close"><X size={18}/></button></div>
    <div className="form-grid form-grid--3">
      <label className="field"><span className="field__label">Name</span><input required value={name} onChange={(event) => setName(event.target.value)} maxLength={80} placeholder="Diwali thank-you"/></label>
      <label className="field"><span className="field__label">Code starts with</span><input required value={prefix} onChange={(event) => setPrefix(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10))} placeholder="DIWALI"/></label>
      <label className="field"><span className="field__label">Uses per customer</span><input type="number" min={1} max={10} value={uses} onChange={(event) => setUses(event.target.value)} required/></label>
    </div>
    <div className="form-grid form-grid--4">
      <label className="field"><span className="field__label">Discount</span><span className="input-wrap"><select value={discountType} onChange={(event) => setDiscountType(event.target.value as "fixed" | "percent")} aria-label="Discount type"><option value="fixed">₹ off</option><option value="percent">% off</option></select><input type="number" min={1} max={discountType === "percent" ? 50 : 5000} value={discount} onChange={(event) => setDiscount(event.target.value)} required/></span></label>
      {discountType === "percent" && <label className="field"><span className="field__label">Maximum discount (₹)</span><input type="number" min={1} max={5000} value={maxDiscount} onChange={(event) => setMaxDiscount(event.target.value)} placeholder="No cap"/></label>}
      <label className="field"><span className="field__label">Minimum order (₹)</span><input type="number" min={0} value={minimum} onChange={(event) => setMinimum(event.target.value)} required/></label>
      <label className="field"><span className="field__label">From</span><input type="date" value={startsOn} onChange={(event) => setStartsOn(event.target.value)} required/></label>
      <label className="field"><span className="field__label">Until</span><input type="date" value={endsOn} min={startsOn} onChange={(event) => setEndsOn(event.target.value)} required/></label>
    </div>
    <span className="field__label">Where can it be used?</span>
    <ScopePicker value={scope} onChange={setScope}/>
    <span className="field__label">Who gets a code?</span>
    <div className="seg" role="radiogroup">{([["people", "Chosen customers"], ["used", "Customers who used…"], ["inactive", "Haven't come back in…"], ["all", "Every customer"]] as [AudienceKind, string][]).map(([id, label]) => <button key={id} type="button" role="radio" aria-checked={kind === id} className={kind === id ? "is-active" : undefined} onClick={() => { setKind(id); setPreview(null); }}>{label}</button>)}</div>
    {kind === "people" && <label className="field"><span className="field__hint">Customer emails or mobile numbers, one per line. They need an account on the website.</span><textarea rows={4} value={people} onChange={(event) => { setPeople(event.target.value); setPreview(null); }} placeholder={"priya@example.com\n98765 43210"}/></label>}
    {kind === "used" && <div className="scope-picker__row">{pickable.map((item) => <label key={item.slug} className={usedServices.includes(item.slug) ? "scope-chip is-on" : "scope-chip"}><input type="checkbox" checked={usedServices.includes(item.slug)} onChange={() => { setUsedServices(usedServices.includes(item.slug) ? usedServices.filter((slug) => slug !== item.slug) : [...usedServices, item.slug]); setPreview(null); }}/>{item.title}</label>)}</div>}
    {kind === "inactive" && <label className="field"><span className="field__label">No request for (days)</span><input type="number" min={7} max={730} value={days} onChange={(event) => { setDays(event.target.value); setPreview(null); }}/></label>}
    <div className="batch-preview">
      <button type="button" className="btn btn--ghost btn--sm" disabled={busy === "preview"} onClick={() => void check()}><Users size={15}/>{busy === "preview" ? "Counting…" : "Count customers"}</button>
      {preview && <span>{preview.count.toLocaleString("en-IN")} customer{preview.count === 1 ? "" : "s"}{preview.capped ? " (limit 5,000)" : ""}{preview.sample.length ? `, e.g. ${preview.sample.join(", ")}` : ""}</span>}
    </div>
    <label className="check"><input type="checkbox" checked={notify} onChange={(event) => setNotify(event.target.checked)}/> Email each customer their code</label>
    {error && <div className="alert alert--error" role="alert">{error}</div>}
    <div className="promo-editor__actions"><button className="btn btn--primary" disabled={busy === "create"}><KeyRound size={16}/>{busy === "create" ? "Creating…" : "Create codes"}</button><button type="button" className="btn btn--ghost" onClick={onCancel}>Cancel</button></div>
  </form>;
}
