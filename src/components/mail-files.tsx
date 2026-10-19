"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Download, FileImage, FileSpreadsheet, FileText, Printer, X } from "lucide-react";
import { secureFile, secureUpload } from "@/lib/secure-api-client";
import { allowedAttachmentType, formatBytes, isImageType, MAX_ATTACHMENT_BYTES, MAX_ATTACHMENTS_PER_MESSAGE, PREVIEWABLE, type MailAttachmentInfo } from "@/lib/mail-core";

/** Anything the viewer can open: a mail attachment or a file of the linked request. */
export type FileSource = { key: string; name: string; mimeType: string; sizeBytes: number; load: () => Promise<Blob> };

const blobCache = new Map<string, Promise<Blob>>();
export function cachedBlob(source: FileSource) {
  let hit = blobCache.get(source.key);
  if (!hit) { hit = source.load(); blobCache.set(source.key, hit); hit.catch(() => blobCache.delete(source.key)); }
  return hit;
}

export const mailFileSource = (file: MailAttachmentInfo): FileSource => ({ key: `m:${file.id}`, ...file, load: async () => (await secureFile("N4c8V1bH6qY3", { id: file.id })).blob });
export const linkedFileSource = (file: MailAttachmentInfo, ticketId: string): FileSource => ({ key: `l:${ticketId}:${file.id}`, ...file, load: async () => (await secureFile("B7p3L9zF2nR6", { id: file.id, t: ticketId })).blob });

export function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url; link.download = name; document.body.appendChild(link); link.click(); link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

/** Prints a picture or PDF through a hidden frame so the page behind stays as it is. */
export function printBlob(blob: Blob, type: string) {
  const url = URL.createObjectURL(blob);
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
  const done = () => window.setTimeout(() => { frame.remove(); URL.revokeObjectURL(url); }, 60_000);
  if (isImageType(type)) {
    frame.srcdoc = `<!doctype html><html><head><style>@page{margin:10mm}html,body{margin:0}img{display:block;max-width:100%;max-height:100vh;margin:0 auto}</style></head><body><img src="${url}" alt=""></body></html>`;
    frame.onload = () => { const image = frame.contentDocument?.querySelector("img"); const go = () => { frame.contentWindow?.focus(); frame.contentWindow?.print(); done(); }; if (image && !image.complete) image.onload = go; else go(); };
  } else {
    frame.src = url;
    frame.onload = () => { window.setTimeout(() => { frame.contentWindow?.focus(); frame.contentWindow?.print(); done(); }, 400); };
  }
  document.body.appendChild(frame);
}

export function FileGlyph({ type, size = 20 }: { type: string; size?: number }) {
  if (isImageType(type)) return <FileImage size={size} aria-hidden="true"/>;
  if (/sheet|excel|csv/.test(type)) return <FileSpreadsheet size={size} aria-hidden="true"/>;
  return <FileText size={size} aria-hidden="true"/>;
}

/** A small picture preview for image attachments; other types show their icon. */
export function Thumb({ source }: { source: FileSource }) {
  const [url, setUrl] = useState<string | null>(null);
  const image = isImageType(source.mimeType) && source.sizeBytes <= 6 * 1024 * 1024;
  useEffect(() => {
    if (!image) return;
    let live = true; let made: string | null = null;
    void cachedBlob(source).then((blob) => { if (!live) return; made = URL.createObjectURL(blob); setUrl(made); }).catch(() => undefined);
    return () => { live = false; if (made) URL.revokeObjectURL(made); };
  }, [source, image]);
  // eslint-disable-next-line @next/next/no-img-element
  return <span className="mbx-thumb">{url ? <img src={url} alt=""/> : <FileGlyph type={source.mimeType}/>}</span>;
}

/** Full-screen viewer with previous/next, download and print. */
export function FileViewer({ items, index, onIndex, onClose }: { items: FileSource[]; index: number; onIndex: (next: number) => void; onClose: () => void }) {
  const source = items[index];
  const [state, setState] = useState<{ key: string; url?: string; blob?: Blob; error?: string }>({ key: "" });
  const dialog = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let live = true; let made: string | null = null;
    void cachedBlob(source).then((blob) => {
      if (!live) return;
      made = PREVIEWABLE.has(source.mimeType) ? URL.createObjectURL(blob) : null;
      setState({ key: source.key, blob, url: made ?? undefined });
    }).catch(() => { if (live) setState({ key: source.key, error: "This file could not be opened." }); });
    return () => { live = false; if (made) URL.revokeObjectURL(made); };
  }, [source]);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.focus();
    return () => previous?.focus?.();
  }, []);
  const go = useCallback((step: number) => onIndex((index + step + items.length) % items.length), [index, items.length, onIndex]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (items.length > 1 && event.key === "ArrowLeft") go(-1);
      if (items.length > 1 && event.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, items.length, onClose]);
  const ready = state.key === source.key ? state : { key: "" };
  return <div className="mbx-viewer" role="dialog" aria-modal="true" aria-label={`Preview of ${source.name}`} ref={dialog} tabIndex={-1} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="mbx-viewer__bar">
      <div className="mbx-viewer__title"><b>{source.name}</b><small>{formatBytes(source.sizeBytes)}{items.length > 1 ? ` · ${index + 1} of ${items.length}` : ""}</small></div>
      <div className="mbx-viewer__actions">
        <button type="button" className="mbx-btn mbx-btn--ghost" disabled={!ready.blob} onClick={() => ready.blob && saveBlob(ready.blob, source.name)}><Download size={16}/> Download</button>
        {PREVIEWABLE.has(source.mimeType) && <button type="button" className="mbx-btn mbx-btn--ghost" disabled={!ready.blob} onClick={() => ready.blob && printBlob(ready.blob, source.mimeType)}><Printer size={16}/> Print</button>}
        <button type="button" className="mbx-icon-btn" aria-label="Close preview" onClick={onClose}><X size={18}/></button>
      </div>
    </div>
    <div className="mbx-viewer__stage">
      {items.length > 1 && <button type="button" className="mbx-viewer__nav mbx-viewer__nav--prev" aria-label="Previous file" onClick={() => go(-1)}><ChevronLeft size={22}/></button>}
      {ready.error ? <p className="mbx-viewer__note">{ready.error}</p>
        : !ready.blob ? <p className="mbx-viewer__note">Opening…</p>
        : !ready.url ? <div className="mbx-viewer__note"><FileGlyph type={source.mimeType} size={36}/><p>This type of file cannot be shown here.</p><button type="button" className="mbx-btn mbx-btn--primary" onClick={() => saveBlob(ready.blob!, source.name)}><Download size={16}/> Download file</button></div>
        : isImageType(source.mimeType)
          // eslint-disable-next-line @next/next/no-img-element
          ? <img className="mbx-viewer__image" src={ready.url} alt={source.name}/>
          : <iframe className="mbx-viewer__pdf" src={ready.url} title={source.name}/>}
      {items.length > 1 && <button type="button" className="mbx-viewer__nav mbx-viewer__nav--next" aria-label="Next file" onClick={() => go(1)}><ChevronRight size={22}/></button>}
    </div>
  </div>;
}

/* ---------------------------------------------------------------- picking and uploading files for a message */

export type Pending = { key: string; file: File; state: "uploading" | "done" | "error"; info?: MailAttachmentInfo; error?: string };

export function useAttachments() {
  const [items, setItems] = useState<Pending[]>([]);
  const [notice, setNotice] = useState("");
  const itemsRef = useRef<Pending[]>([]);
  useEffect(() => { itemsRef.current = items; }, [items]);

  const upload = useCallback(async (entry: Pending) => {
    try {
      const result = await secureUpload<{ file: MailAttachmentInfo }>("A9d5W3tL7mX2", entry.file);
      setItems((list) => list.map((item) => item.key === entry.key ? { ...item, state: "done", info: result.file } : item));
    } catch (error) {
      setItems((list) => list.map((item) => item.key === entry.key ? { ...item, state: "error", error: error instanceof Error ? error.message : "Could not attach this file." } : item));
    }
  }, []);

  const add = useCallback((files: FileList | File[]) => {
    const chosen = Array.from(files);
    const room = MAX_ATTACHMENTS_PER_MESSAGE - itemsRef.current.length;
    const messages: string[] = [];
    const accepted: Pending[] = [];
    for (const file of chosen) {
      if (accepted.length >= room) { messages.push(`Up to ${MAX_ATTACHMENTS_PER_MESSAGE} files per message.`); break; }
      if (file.size > MAX_ATTACHMENT_BYTES) { messages.push(`${file.name} is over 15 MB.`); continue; }
      if (!allowedAttachmentType(file.name, file.type)) { messages.push(`${file.name}: attach a picture, PDF, Word, Excel, CSV or text file.`); continue; }
      accepted.push({ key: `${Date.now()}-${Math.random().toString(36).slice(2)}`, file, state: "uploading" });
    }
    setNotice(messages.join(" "));
    if (!accepted.length) return;
    setItems((list) => [...list, ...accepted]);
    // Two at a time keeps a slow connection from stalling.
    void (async () => { const queue = [...accepted]; const worker = async () => { for (let next = queue.shift(); next; next = queue.shift()) await upload(next); }; await Promise.all([worker(), worker()]); })();
  }, [upload]);

  const remove = useCallback((key: string) => setItems((list) => list.filter((item) => item.key !== key)), []);
  const reset = useCallback(() => { setItems([]); setNotice(""); }, []);
  return { items, notice, add, remove, reset, busy: items.some((item) => item.state === "uploading"), failed: items.some((item) => item.state === "error"), ids: items.flatMap((item) => (item.info ? [item.info.id] : [])) };
}

export function PendingList({ items, onRemove }: { items: Pending[]; onRemove: (key: string) => void }) {
  if (!items.length) return null;
  return <ul className="mbx-pending" aria-label="Attached files">{items.map((item) => <li key={item.key} className={`mbx-pending__item is-${item.state}`}>
    <FileGlyph type={item.file.type || "application/octet-stream"} size={16}/>
    <span className="mbx-pending__name" title={item.file.name}>{item.file.name}</span>
    <small>{item.state === "uploading" ? "Uploading…" : item.state === "error" ? item.error : formatBytes(item.file.size)}</small>
    <button type="button" className="mbx-icon-btn mbx-icon-btn--sm" aria-label={`Remove ${item.file.name}`} onClick={() => onRemove(item.key)}><X size={14}/></button>
  </li>)}</ul>;
}
