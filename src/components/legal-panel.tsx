"use client";

import { useEffect, useState } from "react";
import { secureApi } from "@/lib/secure-api-client";

type Page = { slug: string; label: string; body: string; custom: boolean; updatedAt: string | null };

/** Admin → Legal pages: edit Terms and Conditions, Privacy Policy and Refund & Cancellation Policy. */
export default function LegalPanel() {
  const [pages, setPages] = useState<Page[]>([]);
  const [slug, setSlug] = useState("terms");
  const [text, setText] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load(keep?: string) {
    const result = await secureApi<{ pages: Page[] }>("L4g8P2nT6vK1");
    setPages(result.pages);
    const current = result.pages.find((page) => page.slug === (keep ?? slug)) ?? result.pages[0];
    setSlug(current.slug); setText(current.body); setLoaded(true);
  }
  useEffect(() => { void load().catch((e) => { setError(e instanceof Error ? e.message : "Could not load pages."); setLoaded(true); }); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const page = pages.find((item) => item.slug === slug);
  const pick = (next: string) => { const target = pages.find((item) => item.slug === next); setSlug(next); setText(target?.body ?? ""); setMessage(""); setError(""); };

  async function save(body: string | null) {
    if (body === null && !window.confirm("Put the original text back? Your edits to this page will be lost.")) return;
    setBusy(true); setError(""); setMessage("");
    try { await secureApi("S7r3Q9mB5xD2", { slug, body }); await load(slug); setMessage(body === null ? "Original text restored." : "Saved. The public page now shows this text and the current month as its effective date."); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not save."); }
    finally { setBusy(false); }
  }

  return <section className="admin-card">
    <h2>Legal pages</h2>
    <p className="muted">Edit the Terms and Conditions, Privacy Policy and Refund &amp; Cancellation Policy. The effective date on the public page is the month you last saved. Please have a lawyer check important changes.</p>
    {message && <p role="status">{message}</p>}{error && <p role="alert" className="form-error">{error}</p>}
    {!loaded ? <p>Loading…</p> : <>
      <div className="legal-admin__tabs" role="tablist">{pages.map((item) => <button key={item.slug} role="tab" aria-selected={item.slug === slug} className={`btn btn--sm ${item.slug === slug ? "btn--primary" : "btn--ghost"}`} onClick={() => pick(item.slug)}>{item.label}{item.custom ? " (edited)" : ""}</button>)}</div>
      <textarea className="legal-admin__text" rows={26} value={text} onChange={(event) => setText(event.target.value)} spellCheck aria-label={`${page?.label ?? "Page"} text`}/>
      <details className="legal-admin__help"><summary>How to write</summary>
        <ul>
          <li><code>## Heading</code> starts a numbered section. Text before the first heading is the box at the top. <code>### Sub heading</code> for smaller headings.</li>
          <li><code>- item</code> makes a bullet list. A blank line starts a new paragraph.</li>
          <li><code>**bold**</code> and <code>[link text](/pricing)</code> for links (use /page for this site or https://… for others).</li>
          <li>Fill-ins that update everywhere: <code>{"{{site}}"}</code> business name, <code>{"{{domain}}"}</code> website, <code>{"{{email}}"}</code>, <code>{"{{phone}}"}</code>, <code>{"{{address}}"}</code>, <code>{"{{date}}"}</code> effective month.</li>
        </ul></details>
      <div className="legal-admin__actions">
        <button className="btn btn--primary" disabled={busy || text.trim() === page?.body.trim()} onClick={() => void save(text)}>{busy ? "Saving…" : "Save page"}</button>
        <a className="btn btn--ghost" href={`/${slug}`} target="_blank" rel="noreferrer">View public page</a>
        {page?.custom && <button className="btn btn--ghost" disabled={busy} onClick={() => void save(null)}>Restore original</button>}
      </div>
    </>}
  </section>;
}
