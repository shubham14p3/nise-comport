"use client";

import { useMemo, useState } from "react";
import { hardwareCatalogue } from "@/lib/hardware-catalogue";
import { whatsappLink } from "@/lib/site";

const PURPOSES = ["Study & home", "Office work", "Gaming", "Video or photo editing", "Shop billing / small business", "Other"];
const SYSTEMS = ["Desktop tower", "All-in-one", "Laptop", "Not sure"];
const PROCESSORS = ["Intel", "AMD", "No preference"];
const RAMS = ["8 GB", "16 GB", "32 GB", "64 GB", "Not sure"];
const STORAGE = ["256 GB SSD", "512 GB SSD", "1 TB SSD", "Not sure"];
const GRAPHICS = ["Built-in graphics", "Dedicated graphics card", "Not sure"];
const BUDGETS = ["Under ₹30,000", "₹30,000 to ₹50,000", "₹50,000 to ₹80,000", "Above ₹80,000", "Tell me what fits"];

type BuildState = { purpose: string; system: string; processor: string; ram: string; storage: string; graphics: string; budget: string; monitor: string; name: string; phone: string; notes: string };
const START: BuildState = { purpose: PURPOSES[0], system: SYSTEMS[0], processor: PROCESSORS[2], ram: RAMS[1], storage: STORAGE[1], graphics: GRAPHICS[0], budget: BUDGETS[1], monitor: "", name: "", phone: "", notes: "" };

/** Plain-text request the team reads in the dashboard and on WhatsApp. */
function buildText(s: BuildState) {
  return [
    "PC build quote request",
    `Purpose: ${s.purpose}`,
    `System: ${s.system}`,
    `Processor: ${s.processor}`,
    `RAM: ${s.ram}`,
    `Storage: ${s.storage}`,
    `Graphics: ${s.graphics}`,
    `Budget: ${s.budget}`,
    `Monitor needed: ${s.monitor || "not stated"}`,
    s.name ? `Name: ${s.name}` : "",
    s.phone ? `Mobile: ${s.phone}` : "",
    s.notes ? `Notes: ${s.notes}` : "",
  ].filter(Boolean).join("\n");
}

function requestHref(service: string, text: string) {
  return `/request?service=${service}&note=${encodeURIComponent(text)}`;
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return <label className="field"><span className="field__label">{label}</span>
    <select value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select>
  </label>;
}

export function PcBuildForm() {
  const [state, setState] = useState<BuildState>(START);
  const set = (key: keyof BuildState) => (value: string) => setState((current) => ({ ...current, [key]: value }));
  const text = useMemo(() => buildText(state), [state]);
  return <div className="hw-build">
    <div className="hw-build__grid">
      <Select label="What will you use it for?" value={state.purpose} options={PURPOSES} onChange={set("purpose")}/>
      <Select label="System type" value={state.system} options={SYSTEMS} onChange={set("system")}/>
      <Select label="Processor" value={state.processor} options={PROCESSORS} onChange={set("processor")}/>
      <Select label="RAM" value={state.ram} options={RAMS} onChange={set("ram")}/>
      <Select label="Storage" value={state.storage} options={STORAGE} onChange={set("storage")}/>
      <Select label="Graphics" value={state.graphics} options={GRAPHICS} onChange={set("graphics")}/>
      <Select label="Budget" value={state.budget} options={BUDGETS} onChange={set("budget")}/>
      <label className="field"><span className="field__label">Monitor needed?</span>
        <input value={state.monitor} placeholder="e.g. 24 inch, or already have one" onChange={(event) => set("monitor")(event.target.value)}/></label>
      <label className="field"><span className="field__label">Your name</span>
        <input value={state.name} onChange={(event) => set("name")(event.target.value)}/></label>
      <label className="field"><span className="field__label">Mobile (for the reply)</span>
        <input inputMode="tel" value={state.phone} onChange={(event) => set("phone")(event.target.value)}/></label>
    </div>
    <label className="field"><span className="field__label">Anything else we should know?</span>
      <textarea rows={3} value={state.notes} onChange={(event) => set("notes")(event.target.value)}/></label>
    <div className="hw-build__actions">
      <a className="btn btn--primary btn--lg" href={requestHref("pc-build", text)}>Send to our team</a>
      <a className="btn btn--ghost btn--lg" href={whatsappLink(text)} target="_blank" rel="noopener">Send on WhatsApp</a>
    </div>
    <p className="field__hint">Sending this does not charge you. We reply with options and the latest price before anything is bought.</p>
  </div>;
}

export function PartsQuote() {
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const [other, setOther] = useState("");
  const chosen = Object.keys(picked).filter((key) => picked[key]);
  const text = useMemo(() => {
    const lines = chosen.map((key) => `- ${key}`);
    return ["Hardware parts quote request", ...(lines.length ? ["Items:", ...lines] : []), other.trim() ? `Other items, brands or models: ${other.trim()}` : ""].filter(Boolean).join("\n");
  }, [chosen, other]);
  const ready = chosen.length > 0 || other.trim().length > 0;
  return <div className="hw-parts">
    {hardwareCatalogue.map((group) => <section key={group.slug} className="hw-group">
      <h3>{group.title}</h3>
      <div className="hw-grid">{group.items.map((item) => {
        const label = `${item.name}`;
        return <label key={label} className={`hw-item${picked[label] ? " is-picked" : ""}`}>
          <input type="checkbox" checked={Boolean(picked[label])} onChange={(event) => setPicked((current) => ({ ...current, [label]: event.target.checked }))}/>
          <span className="hw-item__name">{item.name}</span>
          <span className="hw-item__note">{item.note}</span>
          <span className="hw-item__price">Latest price on request</span>
        </label>;
      })}</div>
    </section>)}
    <div className="hw-tray">
      <label className="field"><span className="field__label">Other items, brands or models</span>
        <input value={other} placeholder="e.g. 2 x 16 GB RAM, Brand X" onChange={(event) => setOther(event.target.value)}/></label>
      <p className="field__hint">{chosen.length} item{chosen.length === 1 ? "" : "s"} selected. We confirm the latest price for each.</p>
      <div className="hw-build__actions">
        {ready ? <a className="btn btn--primary btn--lg" href={requestHref("hardware-quote", text)}>Send to our team</a> : <span className="btn btn--ghost btn--lg" aria-disabled="true">Pick items to send</span>}
        {ready ? <a className="btn btn--ghost btn--lg" href={whatsappLink(text)} target="_blank" rel="noopener">Send on WhatsApp</a> : null}
      </div>
    </div>
  </div>;
}
