"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Eye, EyeOff, Star, Trash2 } from "lucide-react";
import { secureApi } from "@/lib/secure-api-client";
import { publishedServiceDetails } from "@/lib/services";

type Testimonial = {
  id: string; authorName: string; rating: number; body: string; category: string;
  serviceSlug: string | null; source: string; reviewedOn: string | null; featured: boolean; visible: boolean;
  createdAt: string; updatedAt: string;
};

const emptyDraft = { authorName: "", rating: 5, body: "", category: "general", serviceSlug: "", reviewedOn: "" };

/**
 * Admin → Testimonials: paste in reviews copied by hand from the Google Business Profile (the
 * public Places API only ever returns up to 5 "most relevant" ones, nowhere near our full count),
 * tag each as general praise or about one service, and choose which show on the site.
 */
export default function TestimonialsPanel() {
  const [rows, setRows] = useState<Testimonial[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");
  const [draft, setDraft] = useState(emptyDraft);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    try { setRows((await secureApi<{ testimonials: Testimonial[] }>("F2q6N9vK3xT5")).testimonials); setError(""); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not load testimonials."); }
    finally { setLoaded(true); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function add(event: FormEvent) {
    event.preventDefault();
    if (!draft.authorName.trim() || !draft.body.trim()) { setError("Name and review text are required."); return; }
    setAdding(true); setError(""); setNotice("");
    try {
      await secureApi("R8m4P1wD7zL2", {
        action: "create", authorName: draft.authorName.trim(), rating: draft.rating, body: draft.body.trim(),
        category: draft.serviceSlug ? "service" : "general", serviceSlug: draft.serviceSlug || null,
        source: "google", reviewedOn: draft.reviewedOn || null,
      });
      setDraft(emptyDraft); setNotice("Review added."); await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not add this review."); }
    finally { setAdding(false); }
  }

  async function patch(id: string, body: Record<string, unknown>, message: string) {
    setBusy(id); setError("");
    try { await secureApi("R8m4P1wD7zL2", { action: "update", id, ...body }); setNotice(message); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not save."); }
    finally { setBusy(""); }
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this review for good?")) return;
    setBusy(id); setError("");
    try { await secureApi("R8m4P1wD7zL2", { action: "delete", id }); setNotice("Review deleted."); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not delete."); }
    finally { setBusy(""); }
  }

  const stars = (n: number) => "★".repeat(n) + "☆".repeat(5 - n);

  return <section className="panel">
    <div className="panel__head"><div>
      <h2>Testimonials</h2>
      <p className="muted">Paste in reviews copied from your Google Business Profile — Google's public API only ever exposes up to 5 of your reviews, so this is how the rest get on the site. Tag a review to a service to also show it on that service's page; leave it general for the homepage mix.</p>
    </div></div>

    <form className="admin-filters" onSubmit={add}>
      <label>Reviewer name<input value={draft.authorName} onChange={(event) => setDraft((value) => ({ ...value, authorName: event.target.value }))} maxLength={120} placeholder="As shown on Google"/></label>
      <label>Rating<select value={draft.rating} onChange={(event) => setDraft((value) => ({ ...value, rating: Number(event.target.value) }))}>{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n === 1 ? "" : "s"}</option>)}</select></label>
      <label>About which service (optional)<select value={draft.serviceSlug} onChange={(event) => setDraft((value) => ({ ...value, serviceSlug: event.target.value }))}>
        <option value="">General / not service-specific</option>
        {publishedServiceDetails.map((service) => <option key={service.slug} value={service.slug}>{service.title}</option>)}
      </select></label>
      <label>Date on Google (optional)<input type="date" value={draft.reviewedOn} onChange={(event) => setDraft((value) => ({ ...value, reviewedOn: event.target.value }))}/></label>
      <label style={{ gridColumn: "1 / -1" }}>Review text<textarea rows={3} maxLength={1000} value={draft.body} onChange={(event) => setDraft((value) => ({ ...value, body: event.target.value }))} placeholder="Paste the exact review text"/></label>
      <button className="btn btn--primary btn--sm" disabled={adding}>{adding ? "Adding…" : "Add review"}</button>
    </form>

    {error && <div className="form-alert error-alert" role="alert">{error}</div>}
    {notice && <div className="form-alert success-alert" role="status">{notice}</div>}
    {!loaded && <p className="muted">Loading testimonials…</p>}

    <div className="record-list">
      {rows.map((row) => <article key={row.id} className={row.visible ? "admin-row" : "admin-row is-hidden"}>
        <div>
          <b>{row.authorName} · {stars(row.rating)}</b>
          <small>{row.category === "general" ? "General" : publishedServiceDetails.find((service) => service.slug === row.serviceSlug)?.title ?? row.serviceSlug}{row.reviewedOn ? ` · ${row.reviewedOn}` : ""}{row.featured ? " · Featured" : ""}{!row.visible ? " · Hidden" : ""}</small>
          <p>“{row.body}”</p>
        </div>
        <div className="gallery-admin__actions">
          <button type="button" className="icon-btn" disabled={busy === row.id} title={row.visible ? "Hide from the website" : "Show on the website"} aria-label={row.visible ? "Hide" : "Show"} onClick={() => void patch(row.id, { visible: !row.visible }, row.visible ? "Hidden from the site." : "Shown on the site.")}>{row.visible ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
          <button type="button" className="icon-btn" disabled={busy === row.id} title={row.featured ? "Unfeature" : "Feature on homepage"} aria-label={row.featured ? "Unfeature" : "Feature"} onClick={() => void patch(row.id, { featured: !row.featured }, row.featured ? "Unfeatured." : "Featured.")}><Star size={16} fill={row.featured ? "#f5a623" : "none"}/></button>
          <button type="button" className="icon-btn" disabled={busy === row.id} title="Delete" aria-label="Delete" onClick={() => void remove(row.id)}><Trash2 size={16}/></button>
        </div>
      </article>)}
      {loaded && !rows.length && <p className="admin-empty">No testimonials added yet.</p>}
    </div>
  </section>;
}
