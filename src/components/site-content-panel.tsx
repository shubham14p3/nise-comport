"use client";

import { FormEvent, useEffect, useState } from "react";
import { EyeOff, Eye, LayoutTemplate, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import PosterPicker from "@/components/poster-picker";
import { secureApi } from "@/lib/secure-api-client";

type Text3 = { en: string; hi: string; bn: string };
type Banner = { id: string; placement: string; title: Text3; text: Text3 | null; cta: Text3 | null; href: string | null; image: string | null; tone: string; categories: string[]; startsOn: string | null; endsOn: string | null; active: boolean; sortOrder: number };
type BuiltIn = { slug: string; title: string; categorySlug: string; hidden: boolean };
type Custom = { id: string; slug: string; title: string; categorySlug: string; description: string; keywords: string[]; highlights: string[]; documents: string[]; steps: string[]; faqs: { question: string; answer: string }[]; seoTitle?: string; seoDescription?: string; published: boolean; sortOrder: number };
type Content = { banners: Banner[]; builtIn: BuiltIn[]; custom: Custom[]; categories: { slug: string; title: string }[] };

const PLACES: Record<string, string> = { strip: "Thin strip at the top of every page", home: "Home page, below the top section", services: "All-services page", "service-page": "Service pages (side panel)", insurer: "Insurer logo (insurance page) — only insurers you're authorised to sell" };
const TONES = ["blue", "violet", "pink", "green", "saffron", "cyan", "night"];
const empty3 = { en: "", hi: "", bn: "" };

/** Admin → Site content: banners on the website, new service pages, and hiding old services. */
export default function SiteContentPanel() {
  const [data, setData] = useState<Content | null>(null);
  const [banner, setBanner] = useState<Partial<Banner> | null>(null);
  const [service, setService] = useState<Partial<Custom> | null>(null);
  const [filter, setFilter] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    try { setData(await secureApi<Content>("C8m3J6xR1vT4")); } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not load site content."); }
  }
  useEffect(() => {
    let active = true;
    secureApi<Content>("C8m3J6xR1vT4").then((result) => { if (active) setData(result); }).catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "Could not load site content."); });
    return () => { active = false; };
  }, []);

  async function act(body: Record<string, unknown>, message: string) {
    setError(""); setNotice("");
    try { await secureApi("K1w5Y9pB3nD7", body); setNotice(message); await load(); return true; }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not save."); return false; }
  }

  const categoryName = (slug: string) => data?.categories.find((item) => item.slug === slug)?.title ?? slug;
  const builtIn = (data?.builtIn ?? []).filter((item) => !filter || item.title.toLowerCase().includes(filter.toLowerCase()));
  return <section className="admin-queue site-content">
    <h2><LayoutTemplate size={17}/> Site content</h2>
    <p className="admin-lead">Change what customers see without touching code. Changes show on the website within a minute.</p>
    {error && <div className="alert alert--error" role="alert">{error}</div>}
    {notice && <div className="alert alert--success" role="status">{notice}</div>}

    <div className="content-block">
      <div className="personal-codes__head"><h3>Banners</h3><button type="button" className="btn btn--primary btn--sm" onClick={() => setBanner({ placement: "home", tone: "blue", active: true, title: { ...empty3 }, categories: [] })}><Plus size={15}/>New banner</button></div>
      {banner && <BannerForm value={banner} categories={data?.categories ?? []} onCancel={() => setBanner(null)} onSave={async (next) => { if (await act({ action: "saveBanner", banner: next }, "Banner saved.")) setBanner(null); }}/>}
      {data && !data.banners.length && !banner && <p className="admin-empty">No banners yet. Add one for a festival, a new service or a notice (e.g. “Closed on Sunday for Chhath”).</p>}
      <div className="batch-list">{(data?.banners ?? []).map((item) => <article key={item.id} className={item.active ? "batch-row" : "batch-row is-off"}>
        <div><b>{item.title.en}</b><small>{PLACES[item.placement] ?? item.placement}{item.categories.length ? ` · ${item.categories.map(categoryName).join(", ")}` : ""}{item.startsOn || item.endsOn ? ` · ${item.startsOn ?? "now"} → ${item.endsOn ?? "no end"}` : ""}{item.href ? ` · links to ${item.href}` : ""}</small></div>
        <div className="batch-row__actions">
          <button type="button" className="icon-btn" onClick={() => setBanner(item)} aria-label="Edit"><Pencil size={16}/></button>
          <label className="switch" title={item.active ? "Hide" : "Show"}><input type="checkbox" checked={item.active} onChange={() => void act({ action: "saveBanner", banner: { ...item, active: !item.active } }, item.active ? "Banner hidden." : "Banner shown.")}/><span/></label>
          <button type="button" className="icon-btn" onClick={() => { if (window.confirm(`Delete “${item.title.en}”?`)) void act({ action: "deleteBanner", id: item.id }, "Banner deleted."); }} aria-label="Delete"><Trash2 size={16}/></button>
        </div>
      </article>)}</div>
    </div>

    <div className="content-block">
      <div className="personal-codes__head"><h3>Added services</h3><button type="button" className="btn btn--primary btn--sm" onClick={() => setService({ categorySlug: data?.categories[0]?.slug ?? "", published: true, keywords: [], highlights: [], documents: [], steps: [], faqs: [] })}><Plus size={15}/>New service</button></div>
      {service && <ServiceForm value={service} categories={data?.categories ?? []} onCancel={() => setService(null)} onSave={async (next) => { if (await act({ action: "saveService", service: next }, `Service saved. It's live at /services/${next.slug || "…"}.`)) setService(null); }}/>}
      {data && !data.custom.length && !service && <p className="admin-empty">No added services yet. New services get their own page, appear in the services list, the request flow, the chat and the sitemap.</p>}
      <div className="batch-list">{(data?.custom ?? []).map((item) => <article key={item.id} className={item.published ? "batch-row" : "batch-row is-off"}>
        <div><b>{item.title}</b><small>{categoryName(item.categorySlug)} · <a href={`/services/${item.slug}`} target="_blank" rel="noopener noreferrer">/services/{item.slug}</a>{item.published ? "" : " · draft"}</small></div>
        <div className="batch-row__actions">
          <button type="button" className="icon-btn" onClick={() => setService(item)} aria-label="Edit"><Pencil size={16}/></button>
          <button type="button" className="icon-btn" onClick={() => { if (window.confirm(`Delete “${item.title}”? Its page will stop working.`)) void act({ action: "deleteService", id: item.id }, "Service deleted."); }} aria-label="Delete"><Trash2 size={16}/></button>
        </div>
      </article>)}</div>
    </div>

    <div className="content-block">
      <div className="personal-codes__head"><h3>Built-in services</h3><label className="input-wrap"><input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Search" aria-label="Search services"/></label></div>
      <p className="field__hint">Hide a service you no longer offer. It disappears from the site, the request flow and the sitemap; show it again any time.</p>
      <div className="builtin-list">{builtIn.map((item) => <div key={item.slug} className={item.hidden ? "builtin-row is-off" : "builtin-row"}>
        <span><b>{item.title}</b><small>{categoryName(item.categorySlug)}</small></span>
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => void act({ action: "hideService", slug: item.slug, hidden: !item.hidden }, item.hidden ? `${item.title} is shown again.` : `${item.title} is hidden.`)}>{item.hidden ? <><Eye size={14}/>Show</> : <><EyeOff size={14}/>Hide</>}</button>
      </div>)}</div>
    </div>
  </section>;
}

function Text3Fields({ label, value, onChange, max, required, hint }: { label: string; value: Text3 | null | undefined; onChange: (next: Text3) => void; max: number; required?: boolean; hint?: string }) {
  const current = value ?? empty3;
  return <div className="form-grid form-grid--3">
    {(["en", "hi", "bn"] as const).map((lang) => <label key={lang} className="field"><span className="field__label">{label} ({lang === "en" ? "English" : lang === "hi" ? "हिन्दी" : "বাংলা"}){lang !== "en" || !required ? <em> optional</em> : null}</span>
      <input value={current[lang]} required={required && lang === "en"} maxLength={max} placeholder={lang === "en" ? hint : "Uses English if empty"} onChange={(event) => onChange({ ...current, [lang]: event.target.value })}/></label>)}
  </div>;
}

function BannerForm({ value, categories, onCancel, onSave }: { value: Partial<Banner>; categories: { slug: string; title: string }[]; onCancel: () => void; onSave: (next: Partial<Banner>) => Promise<void> }) {
  const [draft, setDraft] = useState<Partial<Banner>>(value);
  const [busy, setBusy] = useState(false);
  const update = (patch: Partial<Banner>) => setDraft({ ...draft, ...patch });
  async function submit(event: FormEvent) { event.preventDefault(); setBusy(true); await onSave(draft); setBusy(false); }
  return <form className="promo-editor" onSubmit={submit}>
    <div className="promo-editor__head"><h3>{value.id ? "Edit banner" : "New banner"}</h3><button type="button" className="icon-btn" onClick={onCancel} aria-label="Close"><X size={18}/></button></div>
    <div className="form-grid form-grid--3">
      <label className="field"><span className="field__label">Where</span><select value={draft.placement} onChange={(event) => update({ placement: event.target.value })}>{Object.entries(PLACES).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
      <label className="field"><span className="field__label">Colour</span><select value={draft.tone} onChange={(event) => update({ tone: event.target.value })}>{TONES.map((tone) => <option key={tone} value={tone}>{tone}</option>)}</select></label>
      <label className="field"><span className="field__label">Order <em>lower first</em></span><input type="number" min={0} max={999} value={draft.sortOrder ?? 0} onChange={(event) => update({ sortOrder: Number(event.target.value) })}/></label>
    </div>
    <Text3Fields label="Headline" value={draft.title} onChange={(title) => update({ title })} max={120} required hint="New: Ayushman card in 10 minutes"/>
    <Text3Fields label="Short text" value={draft.text} onChange={(text) => update({ text })} max={260} hint="Bring Aadhaar and the linked mobile."/>
    <Text3Fields label="Button" value={draft.cta} onChange={(cta) => update({ cta })} max={40} hint="Start now"/>
    <div className="form-grid form-grid--3">
      <label className="field"><span className="field__label">Link <em>optional</em></span><input value={draft.href ?? ""} onChange={(event) => update({ href: event.target.value })} placeholder="/services/ayushman-card"/></label>
      <label className="field"><span className="field__label">From <em>optional</em></span><input type="date" value={draft.startsOn ?? ""} onChange={(event) => update({ startsOn: event.target.value || null })}/></label>
      <label className="field"><span className="field__label">Until <em>optional</em></span><input type="date" value={draft.endsOn ?? ""} onChange={(event) => update({ endsOn: event.target.value || null })}/></label>
    </div>
    {draft.placement === "service-page" && <><span className="field__label">Only on these categories <em>none ticked = all service pages</em></span>
      <div className="scope-picker__row">{categories.map((item) => <label key={item.slug} className={draft.categories?.includes(item.slug) ? "scope-chip is-on" : "scope-chip"}><input type="checkbox" checked={Boolean(draft.categories?.includes(item.slug))} onChange={() => update({ categories: draft.categories?.includes(item.slug) ? draft.categories.filter((slug) => slug !== item.slug) : [...(draft.categories ?? []), item.slug] })}/>{item.title}</label>)}</div></>}
    {draft.placement !== "strip" && <><span className="field__label">Image <em>optional, from the poster library or an upload</em></span>
      <PosterPicker value={draft.image ? { en: draft.image } : {}} onChange={(next) => update({ image: next.en ?? next.hi ?? next.bn ?? null })}/></>}
    <div className={`banner-preview tone-${draft.tone ?? "blue"}`}><b>{draft.title?.en || "Headline"}</b>{draft.text?.en && <small>{draft.text.en}</small>}{draft.cta?.en && <em>{draft.cta.en} →</em>}</div>
    <div className="promo-editor__actions"><button className="btn btn--primary" disabled={busy}><Save size={16}/>{busy ? "Saving…" : "Save banner"}</button><button type="button" className="btn btn--ghost" onClick={onCancel}>Cancel</button></div>
  </form>;
}

const lines = (value: string) => value.split("\n").map((line) => line.trim()).filter(Boolean);

function ServiceForm({ value, categories, onCancel, onSave }: { value: Partial<Custom>; categories: { slug: string; title: string }[]; onCancel: () => void; onSave: (next: Record<string, unknown>) => Promise<void> }) {
  const [title, setTitle] = useState(value.title ?? "");
  const [slug, setSlug] = useState(value.slug ?? "");
  const [categorySlug, setCategory] = useState(value.categorySlug ?? categories[0]?.slug ?? "");
  const [description, setDescription] = useState(value.description ?? "");
  const [keywords, setKeywords] = useState((value.keywords ?? []).join(", "));
  const [highlights, setHighlights] = useState((value.highlights ?? []).join("\n"));
  const [documents, setDocuments] = useState((value.documents ?? []).join("\n"));
  const [steps, setSteps] = useState((value.steps ?? []).join("\n"));
  const [faqs, setFaqs] = useState((value.faqs ?? []).map((item) => `${item.question}\n${item.answer}`).join("\n\n"));
  const [published, setPublished] = useState(value.published !== false);
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true);
    await onSave({ id: value.id, title, slug, categorySlug, description, published,
      keywords: keywords.split(",").map((item) => item.trim()).filter(Boolean), highlights: lines(highlights), documents: lines(documents), steps: lines(steps),
      faqs: faqs.split(/\n\s*\n/).map((block) => { const [question, ...answer] = block.split("\n"); return { question: question?.trim() ?? "", answer: answer.join(" ").trim() }; }).filter((item) => item.question && item.answer) });
    setBusy(false);
  }
  return <form className="promo-editor" onSubmit={submit}>
    <div className="promo-editor__head"><h3>{value.id ? `Edit ${value.title}` : "New service"}</h3><button type="button" className="icon-btn" onClick={onCancel} aria-label="Close"><X size={18}/></button></div>
    <div className="form-grid form-grid--3">
      <label className="field"><span className="field__label">Title</span><input required value={title} maxLength={90} onChange={(event) => setTitle(event.target.value)} placeholder="Senior citizen card help"/></label>
      <label className="field"><span className="field__label">Web address <em>/services/…</em></span><input value={slug} disabled={Boolean(value.id)} onChange={(event) => setSlug(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} placeholder="made from the title"/></label>
      <label className="field"><span className="field__label">Category</span><select value={categorySlug} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item.slug} value={item.slug}>{item.title}</option>)}</select></label>
    </div>
    <label className="field"><span className="field__label">Short description <em>shown under the title and in Google</em></span><textarea rows={2} required minLength={20} maxLength={300} value={description} onChange={(event) => setDescription(event.target.value)}/></label>
    <label className="field"><span className="field__label">Search words <em>comma separated</em></span><input value={keywords} onChange={(event) => setKeywords(event.target.value)} placeholder="senior citizen card Jamshedpur, old age card Telco"/></label>
    <div className="form-grid form-grid--3">
      <label className="field"><span className="field__label">What we do <em>one per line</em></span><textarea rows={5} value={highlights} onChange={(event) => setHighlights(event.target.value)}/></label>
      <label className="field"><span className="field__label">Documents to bring <em>one per line</em></span><textarea rows={5} required value={documents} onChange={(event) => setDocuments(event.target.value)}/></label>
      <label className="field"><span className="field__label">Steps <em>one per line</em></span><textarea rows={5} required value={steps} onChange={(event) => setSteps(event.target.value)}/></label>
    </div>
    <label className="field"><span className="field__label">FAQs <em>question on one line, answer below, blank line between</em></span><textarea rows={4} value={faqs} onChange={(event) => setFaqs(event.target.value)}/></label>
    <label className="check"><input type="checkbox" checked={published} onChange={(event) => setPublished(event.target.checked)}/> Show on the website</label>
    <div className="promo-editor__actions"><button className="btn btn--primary" disabled={busy}><Save size={16}/>{busy ? "Saving…" : "Save service"}</button><button type="button" className="btn btn--ghost" onClick={onCancel}>Cancel</button></div>
  </form>;
}
