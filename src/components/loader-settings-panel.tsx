"use client";
import { useState, type FormEvent } from "react";
import { secureApi, secureUpload } from "@/lib/secure-api-client";
import { DEFAULT_LOADER_SRC, LOADER_CHANGED, type LoaderSettings } from "@/lib/loader-config";

/** Owner-only; settings arrive with the Content panel, not an extra page-load request. */
export default function LoaderSettingsPanel({ value, onChange }: { value: LoaderSettings; onChange: (value: LoaderSettings) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  function saved(loader: LoaderSettings) {
    onChange(loader);
    window.dispatchEvent(new CustomEvent(LOADER_CHANGED, { detail: loader }));
    setNotice("Loader updated. New visits use this image; this browser updates immediately.");
  }
  async function upload(event: FormEvent) {
    event.preventDefault(); if (!file || busy) return;
    setBusy(true); setError(""); setNotice("");
    try { const result = await secureUpload<{ loader: LoaderSettings }>("L7d2R8mQ4vN6", file); saved(result.loader); setFile(null); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not upload the loader image."); }
    finally { setBusy(false); }
  }
  async function reset() {
    setBusy(true); setError(""); setNotice("");
    try { const result = await secureApi<{ loader: LoaderSettings }>("K1w5Y9pB3nD7", { action: "resetLoader" }); saved(result.loader); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not restore the default loader."); }
    finally { setBusy(false); }
  }
  return <div className="content-block">
    <h3>API loading logo</h3>
    <p>Shown while requests take longer than a moment. Upload PNG, JPG, WebP, SVG or GIF, up to 2 MB. GIF animation is preserved; SVG artwork becomes a safe static image.</p>
    {/* eslint-disable-next-line @next/next/no-img-element -- preview may be an animated WebP */}
    <img src={value.src ?? DEFAULT_LOADER_SRC} alt="Current API loader logo" width={160} height={80} style={{ objectFit: "contain" }}/>
    <form onSubmit={upload} className="admin-filters">
      <label className="field"><span className="field__label">New loader image</span><input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif" disabled={busy} onChange={(event) => setFile(event.target.files?.[0] ?? null)}/></label>
      <button className="btn btn--primary" disabled={busy || !file}>{busy ? "Saving…" : "Upload & use"}</button>
      <button type="button" className="btn btn--ghost" disabled={busy || !value.src} onClick={() => void reset()}>Restore site logo</button>
    </form>
    {error && <p role="alert" className="alert alert--error">{error}</p>}
    {notice && <p role="status" className="alert alert--success">{notice}</p>}
  </div>;
}
