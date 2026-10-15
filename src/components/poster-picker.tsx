"use client";

import { useState } from "react";
import { Check, ImagePlus, TriangleAlert, Upload, X } from "lucide-react";
import { DISCOUNT_CLAIM_WARNING, findPoster, POSTERS } from "@/lib/poster-library";
import { secureApi, secureUpload } from "@/lib/secure-api-client";

type Lang = "en" | "hi" | "bn";
type Media = { id: string; url: string; title: string; locale: string | null; category: string | null; createdAt: string };
const LANGS: { id: Lang; label: string }[] = [{ id: "en", label: "English" }, { id: "hi", label: "हिन्दी" }, { id: "bn", label: "বাংলা" }];

/** Pick a poster per language from the built-in library or upload a new one (JPG/PNG, max 5 MB). */
export default function PosterPicker({ value, onChange }: { value: Partial<Record<Lang, string>>; onChange: (next: Partial<Record<Lang, string>>) => void }) {
  const [open, setOpen] = useState<Lang | null>(null);
  const [uploaded, setUploaded] = useState<Media[] | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function openLibrary(lang: Lang) {
    setOpen(open === lang ? null : lang); setError("");
    if (uploaded === null) {
      try { setUploaded((await secureApi<{ media: Media[] }>("G7m2W5xK8dP4")).media); } catch { setUploaded([]); }
    }
  }

  async function upload() {
    if (!file || !open) return;
    setBusy(true); setError("");
    try {
      const result = await secureUpload<{ media: Media }>("P6m1T8vC3xK9", file, { title: title || file.name, locale: open, category: "poster" });
      setUploaded((list) => [result.media, ...(list ?? [])]);
      onChange({ ...value, [open]: result.media.url });
      setFile(null); setTitle(""); setOpen(null);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not upload the poster."); }
    finally { setBusy(false); }
  }

  const choose = (lang: Lang, url: string) => { onChange({ ...value, [lang]: url }); setOpen(null); };
  const warn = LANGS.some(({ id }) => findPoster(value[id])?.discountClaim);
  const options = [...(uploaded ?? []).map((item) => ({ src: item.url, title: item.title, discountClaim: false, tag: item.locale?.toUpperCase() ?? "Uploaded" })), ...POSTERS.map((poster) => ({ src: poster.src, title: poster.title, discountClaim: poster.discountClaim, tag: poster.locale.toUpperCase() }))];

  return <div className="poster-picker">
    <div className="poster-slots">{LANGS.map(({ id, label }) => <div key={id} className={open === id ? "poster-slot is-open" : "poster-slot"}>
      <span className="poster-slot__label">{label}</span>
      {value[id] ? <>
        {/* eslint-disable-next-line @next/next/no-img-element -- admin preview of a poster */}
        <img src={value[id]} alt="" loading="lazy"/>
        <div className="poster-slot__actions"><button type="button" className="profile-text-button" onClick={() => void openLibrary(id)}>Change</button><button type="button" className="icon-btn" aria-label={`Remove ${label} poster`} onClick={() => { const next = { ...value }; delete next[id]; onChange(next); }}><X size={15}/></button></div>
      </> : <button type="button" className="poster-slot__empty" onClick={() => void openLibrary(id)}><ImagePlus size={20}/>{id === "en" ? "Choose poster" : "Optional: uses English"}</button>}
    </div>)}</div>
    {warn && <p className="alert alert--warn"><TriangleAlert size={16}/>{DISCOUNT_CLAIM_WARNING}</p>}
    {open && <div className="poster-library">
      <div className="poster-upload">
        <label className="dropzone dropzone--sm"><Upload size={18}/><b>{file ? file.name : "Upload a poster (JPG/PNG, up to 5 MB)"}</b><input type="file" accept="image/jpeg,image/png" onChange={(event) => setFile(event.target.files?.[0] ?? null)}/></label>
        {file && <><input className="poster-upload__title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Poster name, e.g. Diwali bike insurance (Hindi)" maxLength={120}/><button type="button" className="btn btn--primary btn--sm" disabled={busy} onClick={() => void upload()}>{busy ? "Uploading…" : `Upload for ${LANGS.find((lang) => lang.id === open)?.label}`}</button></>}
      </div>
      {error && <p className="alert alert--error">{error}</p>}
      <div className="poster-grid">{options.map((poster) => <button key={poster.src} type="button" className={value[open] === poster.src ? "poster-option is-picked" : "poster-option"} onClick={() => choose(open, poster.src)} title={poster.title}>
        {/* eslint-disable-next-line @next/next/no-img-element -- admin preview of a poster */}
        <img src={poster.src} alt="" loading="lazy"/>
        <span>{poster.title}</span>
        <em>{poster.tag}</em>
        {poster.discountClaim && <i className="poster-option__warn" title="Says “Confirm discount” / “Lowest price”"><TriangleAlert size={12}/></i>}
        {value[open] === poster.src && <i className="poster-option__check"><Check size={14}/></i>}
      </button>)}</div>
    </div>}
  </div>;
}
