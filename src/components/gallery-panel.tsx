"use client";

import { useCallback, useEffect, useState } from "react";
import { Eye, EyeOff, ImagePlus, LoaderCircle, Trash2 } from "lucide-react";
import ShowMore, { useShowMore } from "@/components/show-more";
import { FESTIVAL_TAGS, SERVICE_TAGS, SHOP_TAGS, tagGroup, tagLabel } from "@/lib/gallery-tags";
import { secureApi, secureUpload } from "@/lib/secure-api-client";

type Photo = { src: string; width: number; height: number; title: string; alt: string; tag: string; hidden: boolean; source: "file" | "upload"; addedOn: string };

function TagSelect({ value, onChange, label, includeAll = false }: { value: string; onChange: (value: string) => void; label: string; includeAll?: boolean }) {
  return <select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)}>
    {includeAll && <><option value="">All photos</option><option value="grp:service">All services</option><option value="grp:festival">All festivals</option><option value="grp:shop">All centre photos</option></>}
    <optgroup label="Our centre">{Object.entries(SHOP_TAGS).map(([tag, name]) => <option key={tag} value={tag}>{name}</option>)}</optgroup>
    <optgroup label="Festivals & days">{Object.entries(FESTIVAL_TAGS).map(([tag, name]) => <option key={tag} value={tag}>{name}</option>)}</optgroup>
    <optgroup label="Services (also shown on the service page)">{Object.entries(SERVICE_TAGS).map(([tag, name]) => <option key={tag} value={tag}>{name}</option>)}</optgroup>
  </select>;
}

function Thumb({ src, alt }: { src: string; alt: string }) {
  // eslint-disable-next-line @next/next/no-img-element -- admin thumbnails of our own photos
  return <img src={src} alt={alt} loading="lazy"/>;
}

/**
 * Admin → Gallery photos: upload from the computer or phone (JPG, PNG, HEIC, WebP… converted to
 * WebP on the server), choose what each photo is about, rename, hide or delete.
 */
export default function GalleryPanel() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [uploadTag, setUploadTag] = useState("shop");
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [report, setReport] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [show, setShow] = useState("");
  const [hiddenToo, setHiddenToo] = useState(false);
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    try { setPhotos((await secureApi<{ photos: Photo[] }>("G2l6S9wQ4mT8")).photos); setError(""); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not load the photos."); }
    finally { setLoaded(true); }
  }, []);
  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    const list = [...files];
    setReport([]); setNotice(""); setError("");
    const problems: string[] = [];
    let added = 0;
    for (let index = 0; index < list.length; index++) {
      setProgress({ done: index, total: list.length });
      try { await secureUpload("G5p8U2kV7nR3", list[index], { tag: uploadTag }); added++; }
      catch (reason) { problems.push(`${list[index].name}: ${reason instanceof Error ? reason.message : "failed"}`); }
    }
    setProgress(null);
    setReport(problems);
    setNotice(`${added} of ${list.length} photo${list.length === 1 ? "" : "s"} added to “${tagLabel(uploadTag)}”. They appear on the website within a few minutes.`);
    await load();
  }

  async function act(body: Record<string, unknown>, message: string) {
    setBusy(String(body.src)); setError("");
    try { await secureApi("G7l3A1xN5pK2", body); setNotice(message); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not save."); }
    finally { setBusy(""); }
  }

  const visible = photos.filter((photo) => (hiddenToo || !photo.hidden)
    && (!show || (show.startsWith("grp:") ? tagGroup(photo.tag) === show.slice(4) : photo.tag === show)));
  const paging = useShowMore(24, `${show}|${hiddenToo}`);
  const hiddenCount = photos.filter((photo) => photo.hidden).length;

  return <section className="panel gallery-admin">
    <div className="panel__head"><div><h2>Gallery photos</h2><p className="muted">Upload photos from this computer or phone. JPG, PNG, HEIC and WebP are turned into small WebP files automatically, with location data removed. Service photos also show on that service’s page.</p></div></div>

    <div className="gallery-admin__upload">
      <label className="field"><span className="field__label">These photos are about</span><TagSelect value={uploadTag} onChange={setUploadTag} label="Category for new photos"/></label>
      <label className={progress ? "btn btn--primary is-busy" : "btn btn--primary"}>
        {progress ? <><LoaderCircle size={17} className="spin"/>Uploading {progress.done + 1} of {progress.total}…</> : <><ImagePlus size={17}/>Choose photos</>}
        <input type="file" accept="image/*,.heic,.heif" multiple hidden disabled={Boolean(progress)} onChange={(event) => { void upload(event.target.files); event.target.value = ""; }}/>
      </label>
      <p className="field__hint">Not sure of the category? Choose “Our centre” and change it later below. Only upload photos you own; avoid customers’ faces or documents unless they agreed.</p>
    </div>
    {notice && <p className="alert alert--success" role="status">{notice}</p>}
    {report.length > 0 && <div className="alert alert--warn"><b>Not added:</b><ul>{report.map((line) => <li key={line}>{line}</li>)}</ul></div>}
    {error && <p className="alert alert--error" role="alert">{error}</p>}

    <div className="gallery-admin__filters">
      <label className="field"><span className="field__label">Show</span><TagSelect value={show} onChange={setShow} label="Filter photos" includeAll/></label>
      <label className="check"><input type="checkbox" checked={hiddenToo} onChange={(event) => setHiddenToo(event.target.checked)}/><span>Include hidden ({hiddenCount})</span></label>
      <span className="muted">{visible.length} photo{visible.length === 1 ? "" : "s"}</span>
    </div>

    {!loaded ? <p className="muted">Loading photos…</p> : <div className="gallery-admin__grid">
      {visible.slice(0, paging.count).map((photo) => <article key={photo.src} className={photo.hidden ? "gallery-admin__card is-hidden" : "gallery-admin__card"}>
        <a href={photo.src} target="_blank" rel="noopener noreferrer" className="gallery-admin__thumb"><Thumb src={photo.src} alt={photo.alt}/></a>
        <TagSelect value={photo.tag} label={`Category of ${photo.title}`} onChange={(tag) => void act({ action: "update", src: photo.src, tag }, `Moved to “${tagLabel(tag)}”.`)}/>
        <input aria-label="Title" defaultValue={photo.title} maxLength={140} onBlur={(event) => { const title = event.target.value.trim(); if (title && title !== photo.title) void act({ action: "update", src: photo.src, title }, "Title saved."); }}/>
        <div className="gallery-admin__actions">
          <small className="muted">{photo.hidden ? "Hidden" : photo.source === "upload" ? "Uploaded" : "Added from PC"} · {photo.addedOn}</small>
          <button type="button" className="icon-btn" disabled={busy === photo.src} title={photo.hidden ? "Show on the website" : "Hide from the website"} aria-label={photo.hidden ? "Show" : "Hide"} onClick={() => void act({ action: "update", src: photo.src, hidden: !photo.hidden }, photo.hidden ? "Photo is shown again." : "Photo hidden.")}>{photo.hidden ? <Eye size={16}/> : <EyeOff size={16}/>}</button>
          {photo.source === "upload" && <button type="button" className="icon-btn" disabled={busy === photo.src} title="Delete" aria-label="Delete" onClick={() => { if (window.confirm("Delete this photo for good?")) void act({ action: "delete", src: photo.src }, "Photo deleted."); }}><Trash2 size={16}/></button>}
        </div>
      </article>)}
    </div>}
    <ShowMore shown={Math.min(paging.count, visible.length)} total={visible.length} onMore={paging.more} label="photos"/>
  </section>;
}
