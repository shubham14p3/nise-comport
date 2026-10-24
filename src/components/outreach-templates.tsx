"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Copy, Plus, Save, Trash2 } from "lucide-react";
import { secureApi } from "@/lib/secure-api-client";
import type { BirthdayTemplate, Lang, OutreachSettings, RenewalTemplate } from "@/lib/outreach-core";

type Config = { settings: OutreachSettings; birthdayTemplates: BirthdayTemplate[]; renewalTemplates: RenewalTemplate[]; previews?: Record<string, Record<Lang, string>> };
const LANGS: { id: Lang; label: string }[] = [{ id: "en", label: "English" }, { id: "hi", label: "हिन्दी" }, { id: "bn", label: "বাংলা" }];
const COLOURS: { key: "from" | "to" | "accent" | "ink" | "shape"; label: string }[] = [
  { key: "from", label: "Background start" }, { key: "to", label: "Background end" }, { key: "accent", label: "Title colour" }, { key: "ink", label: "Text colour" }, { key: "shape", label: "Confetti & cake" },
];
const uid = () => `card-${Math.random().toString(36).slice(2, 7)}`;

/** Birthday cards and insurance reminders: add, edit, delete, and the switches for sending them automatically. */
export default function OutreachTemplates({ onChanged }: { onChanged?: () => void }) {
  const [config, setConfig] = useState<Config | null>(null);
  const [lang, setLang] = useState<Lang>("en");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    try { setConfig(await secureApi<Config>("B5dY8rN2cV6w", { view: "config" })); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not load the templates."); }
  }
  useEffect(() => {
    let active = true;
    secureApi<Config>("B5dY8rN2cV6w", { view: "config" }).then((result) => { if (active) setConfig(result); })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "Could not load the templates."); });
    return () => { active = false; };
  }, []);

  if (!config) return <p className="admin-empty">{error || "Loading…"}</p>;
  const { settings, birthdayTemplates, renewalTemplates } = config;
  const patch = (next: Partial<Config>) => setConfig({ ...config, ...next });
  const editBirthday = (id: string, change: Partial<BirthdayTemplate>) => patch({ birthdayTemplates: birthdayTemplates.map((item) => (item.id === id ? { ...item, ...change } : item)) });
  const editRenewal = (id: string, change: Partial<RenewalTemplate>) => patch({ renewalTemplates: renewalTemplates.map((item) => (item.id === id ? { ...item, ...change } : item)) });
  const setText = <K extends "title" | "line" | "signoff" | "whatsapp" | "email">(item: BirthdayTemplate, key: K, value: string) => editBirthday(item.id, { [key]: { ...item[key], [lang]: value } } as Partial<BirthdayTemplate>);

  async function save() {
    if (!config) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const saved = await secureApi<Config>("O3bQ7mT5xK2n", { action: "config", settings: config.settings, birthdayTemplates: config.birthdayTemplates, renewalTemplates: config.renewalTemplates });
      setConfig(saved); setNotice("Saved. New cards and wording are used from the next message."); onChanged?.();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not save."); }
    finally { setBusy(false); }
  }

  return <div className="outreach-templates">
    {error && <div className="alert alert--error" role="alert">{error}</div>}
    {notice && <div className="alert alert--success" role="status">{notice}</div>}

    <section className="team-add">
      <h3>Send automatically</h3>
      <p className="admin-lead">Turn these on and the WhatsApp scheduler (the same one that runs your campaigns every few minutes) sends them between 9 am and 8 pm. Birthday wishes only go to people who said YES. Nothing is sent twice.</p>
      <div className="form-grid form-grid--3">
        <label className="field"><span className="field__label">Birthday wishes</span><select value={settings.birthday.enabled ? "on" : "off"} onChange={(event) => patch({ settings: { ...settings, birthday: { ...settings.birthday, enabled: event.target.value === "on" } } })}><option value="off">Off, I send by hand</option><option value="on">On, every day</option></select></label>
        <label className="field"><span className="field__label">Birthday card</span><select value={settings.birthday.template} onChange={(event) => patch({ settings: { ...settings, birthday: { ...settings.birthday, template: event.target.value } } })}>{birthdayTemplates.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <div className="field"><span className="field__label">Through</span><label className="check"><input type="checkbox" checked={settings.birthday.email} onChange={(event) => patch({ settings: { ...settings, birthday: { ...settings.birthday, email: event.target.checked } } })}/> Email</label> <label className="check"><input type="checkbox" checked={settings.birthday.whatsapp} onChange={(event) => patch({ settings: { ...settings, birthday: { ...settings.birthday, whatsapp: event.target.checked } } })}/> WhatsApp</label></div>
        <label className="field"><span className="field__label">Birthday gift coupon</span><select value={settings.birthday.coupon.enabled ? "on" : "off"} onChange={(event) => patch({ settings: { ...settings, birthday: { ...settings.birthday, coupon: { ...settings.birthday.coupon, enabled: event.target.value === "on" } } } })}><option value="on">On: coupon in the wish and a pop-up at login</option><option value="off">Off: wishes only</option></select></label>
        <label className="field"><span className="field__label">Gift: percent off our service charge</span><input type="number" min={1} max={50} value={settings.birthday.coupon.percent} onChange={(event) => patch({ settings: { ...settings, birthday: { ...settings.birthday, coupon: { ...settings.birthday.coupon, percent: Number(event.target.value) || 10 } } } })}/></label>
        <label className="field"><span className="field__label">Gift: days it stays valid</span><input type="number" min={1} max={90} value={settings.birthday.coupon.validDays} onChange={(event) => patch({ settings: { ...settings, birthday: { ...settings.birthday, coupon: { ...settings.birthday.coupon, validDays: Number(event.target.value) || 30 } } } })}/></label>
        <label className="field"><span className="field__label">Insurance reminders</span><select value={settings.renewal.enabled ? "on" : "off"} onChange={(event) => patch({ settings: { ...settings, renewal: { ...settings.renewal, enabled: event.target.value === "on" } } })}><option value="off">Off, I send by hand</option><option value="on">On, every day</option></select></label>
        <label className="field"><span className="field__label">Reminder wording</span><select value={settings.renewal.template} onChange={(event) => patch({ settings: { ...settings, renewal: { ...settings.renewal, template: event.target.value } } })}>{renewalTemplates.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label className="field"><span className="field__label">Days before the policy ends</span><input type="number" min={1} max={45} value={settings.renewal.daysBefore} onChange={(event) => patch({ settings: { ...settings, renewal: { ...settings.renewal, daysBefore: Number(event.target.value) || 7 } } })}/></label>
        <div className="field"><span className="field__label">Reminders through</span><label className="check"><input type="checkbox" checked={settings.renewal.email} onChange={(event) => patch({ settings: { ...settings, renewal: { ...settings.renewal, email: event.target.checked } } })}/> Email</label> <label className="check"><input type="checkbox" checked={settings.renewal.whatsapp} onChange={(event) => patch({ settings: { ...settings, renewal: { ...settings.renewal, whatsapp: event.target.checked } } })}/> WhatsApp</label></div>
      </div>
    </section>

    <div className="seg" role="group" aria-label="Language being edited">{LANGS.map((item) => <button key={item.id} type="button" className={lang === item.id ? "is-active" : undefined} onClick={() => setLang(item.id)}>{item.label}</button>)}</div>

    <section>
      <div className="outreach-head"><h3>Birthday cards</h3><button type="button" className="btn btn--ghost btn--sm" onClick={() => patch({ birthdayTemplates: [...birthdayTemplates, { ...birthdayTemplates[0], id: uid(), name: "New card" }].slice(0, 20) })}><Plus size={15}/> Add a card</button></div>
      <div className="outreach-cards">{birthdayTemplates.map((item) => <article key={item.id} className="outreach-card">
        <div className="outreach-card__preview" style={{ backgroundImage: `linear-gradient(150deg, ${item.from}, ${item.to})`, color: item.ink }}>
          <b style={{ color: item.accent }}>{item.title[lang]}</b><span>Anita Devi</span><small>{item.line[lang]}</small><i style={{ background: item.shape }}/>
        </div>
        {config.previews?.[item.id] && <details className="outreach-card__real"><summary>See the real card</summary><Image unoptimized src={config.previews[item.id][lang]} alt={`${item.name} card in ${lang}`} loading="lazy" width={320} height={320}/><small>Shows the last saved version.</small></details>}
        <label className="field"><span className="field__label">Name of this card</span><input value={item.name} maxLength={40} onChange={(event) => editBirthday(item.id, { name: event.target.value })}/></label>
        <div className="outreach-colours">{COLOURS.map(({ key, label }) => <label key={key} className="outreach-colour"><input type="color" value={item[key]} onChange={(event) => editBirthday(item.id, { [key]: event.target.value } as Partial<BirthdayTemplate>)} aria-label={label}/><span>{label}</span></label>)}</div>
        <label className="field"><span className="field__label">Big title on the card</span><input value={item.title[lang]} maxLength={40} onChange={(event) => setText(item, "title", event.target.value)}/></label>
        <label className="field"><span className="field__label">Wish under the name</span><input value={item.line[lang]} maxLength={120} onChange={(event) => setText(item, "line", event.target.value)}/></label>
        <label className="field"><span className="field__label">Line at the bottom</span><input value={item.signoff[lang]} maxLength={60} onChange={(event) => setText(item, "signoff", event.target.value)}/></label>
        <label className="field"><span className="field__label">WhatsApp message <em>{"{name}"} is replaced</em></span><textarea rows={3} value={item.whatsapp[lang]} maxLength={600} onChange={(event) => setText(item, "whatsapp", event.target.value)}/></label>
        <label className="field"><span className="field__label">Email message</span><textarea rows={3} value={item.email[lang]} maxLength={800} onChange={(event) => setText(item, "email", event.target.value)}/></label>
        <div className="outreach-card__actions">
          <button type="button" className="profile-text-button" onClick={() => patch({ birthdayTemplates: [...birthdayTemplates, { ...item, id: uid(), name: `${item.name} copy`.slice(0, 40) }].slice(0, 20) })}><Copy size={13}/> Duplicate</button>
          <button type="button" className="profile-text-button" disabled={birthdayTemplates.length < 2} title={birthdayTemplates.length < 2 ? "Keep at least one card" : undefined} onClick={() => patch({ birthdayTemplates: birthdayTemplates.filter((other) => other.id !== item.id) })}><Trash2 size={13}/> Delete</button>
        </div>
      </article>)}</div>
    </section>

    <section>
      <div className="outreach-head"><h3>Insurance reminder wording</h3><button type="button" className="btn btn--ghost btn--sm" onClick={() => patch({ renewalTemplates: [...renewalTemplates, { ...renewalTemplates[0], id: uid(), name: "New reminder" }].slice(0, 20) })}><Plus size={15}/> Add a reminder</button></div>
      <p className="admin-lead">Placeholders: <code>{"{name}"}</code> <code>{"{vehicle}"}</code> (bike insurance / car insurance) <code>{"{date}"}</code> (the day the policy ends) <code>{"{phone}"}</code> (the shop number). Please do not promise a discount or “lowest price” on the premium: insurance rules do not allow it.</p>
      <div className="outreach-cards">{renewalTemplates.map((item) => <article key={item.id} className="outreach-card">
        <label className="field"><span className="field__label">Name of this reminder</span><input value={item.name} maxLength={40} onChange={(event) => editRenewal(item.id, { name: event.target.value })}/></label>
        <label className="field"><span className="field__label">WhatsApp message</span><textarea rows={4} value={item.whatsapp[lang]} maxLength={600} onChange={(event) => editRenewal(item.id, { whatsapp: { ...item.whatsapp, [lang]: event.target.value } })}/></label>
        <label className="field"><span className="field__label">Email subject</span><input value={item.emailSubject[lang]} maxLength={120} onChange={(event) => editRenewal(item.id, { emailSubject: { ...item.emailSubject, [lang]: event.target.value } })}/></label>
        <label className="field"><span className="field__label">Email message <em>blank line = new paragraph</em></span><textarea rows={6} value={item.emailBody[lang]} maxLength={1500} onChange={(event) => editRenewal(item.id, { emailBody: { ...item.emailBody, [lang]: event.target.value } })}/></label>
        <div className="outreach-card__actions">
          <button type="button" className="profile-text-button" onClick={() => patch({ renewalTemplates: [...renewalTemplates, { ...item, id: uid(), name: `${item.name} copy`.slice(0, 40) }].slice(0, 20) })}><Copy size={13}/> Duplicate</button>
          <button type="button" className="profile-text-button" disabled={renewalTemplates.length < 2} title={renewalTemplates.length < 2 ? "Keep at least one reminder" : undefined} onClick={() => patch({ renewalTemplates: renewalTemplates.filter((other) => other.id !== item.id) })}><Trash2 size={13}/> Delete</button>
        </div>
      </article>)}</div>
    </section>

    <div className="outreach-save"><button type="button" className="btn btn--primary" disabled={busy} onClick={() => void save()}>{busy ? "Saving…" : "Save templates and settings"}<Save size={16}/></button><button type="button" className="btn btn--ghost" onClick={() => void load()}>Discard changes</button></div>
  </div>;
}
