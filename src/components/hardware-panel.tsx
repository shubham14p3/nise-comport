"use client";

import { useEffect, useState } from "react";
import { secureApi } from "@/lib/secure-api-client";
import { AdminPager, paged } from "@/components/admin-pager";
import { Boxes, EyeOff, Eye } from "lucide-react";

type Data = {
  groups: { slug: string; title: string }[];
  builtIn: { groupSlug: string; name: string; note: string; hidden: boolean }[];
  added: { id: string; groupSlug: string; name: string; note: string; image: string | null; published: boolean; sortOrder: number }[];
};
type Draft = { id?: string; groupSlug: string; name: string; note: string; image: string; published: boolean };

/** Admin → Hardware parts: switch built-in parts on or off, and add, edit or delete your own. Changes show on /hardware within a few minutes. */
export default function HardwarePanel() {
  const [data, setData] = useState<Data | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [groupPages, setGroupPages] = useState<Record<string, number>>({});
  const [groupSizes, setGroupSizes] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    try { setData(await secureApi<Data>("G5t2Y8mK3rX6")); } catch (e) { setError(e instanceof Error ? e.message : "Could not load parts."); }
  }
  useEffect(() => { void Promise.resolve().then(load); }, []);

  async function act(body: Record<string, unknown>, done: string) {
    setBusy(true); setError(""); setMessage("");
    try { await secureApi("S7h4B1nW9cZ2", body); setMessage(done); setDraft(null); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not save."); }
    finally { setBusy(false); }
  }

  if (!data) return <section className="admin-card"><h2>Hardware parts</h2>{error ? <p role="alert" className="form-error">{error}</p> : <p>Loading…</p>}</section>;
  const title = (slug: string) => data.groups.find((group) => group.slug === slug)?.title ?? slug;

  return <section className="admin-card">
    <h2><Boxes size={19}/> Hardware catalogue</h2>
    <p className="muted">The parts list on the Hardware page. Hide a built-in part, or add your own (new laptops, MacBooks, used parts, accessories). No prices here: customers are told the latest price on request.</p>
    {message && <p role="status">{message}</p>}{error && <p role="alert" className="form-error">{error}</p>}

    <p><button className="btn btn--primary btn--sm" onClick={() => setDraft({ groupSlug: data.groups[0]?.slug ?? "", name: "", note: "", image: "", published: true })}>Add a part</button></p>
    {draft && <div className="admin-form">
      <label className="field"><span className="field__label">Group</span>
        <select value={draft.groupSlug} onChange={(e) => setDraft({ ...draft, groupSlug: e.target.value })}>{data.groups.map((group) => <option key={group.slug} value={group.slug}>{group.title}</option>)}</select></label>
      <label className="field"><span className="field__label">Part name</span><input value={draft.name} maxLength={90} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. Kids laptop 11.6 inch"/></label>
      <label className="field"><span className="field__label">Short note</span><input value={draft.note} maxLength={160} onChange={(e) => setDraft({ ...draft, note: e.target.value })} placeholder="e.g. Light, good for online classes"/></label>
      <label className="field"><span className="field__label">Photo (optional)</span><input value={draft.image} maxLength={200} onChange={(e) => setDraft({ ...draft, image: e.target.value })} placeholder="/images/hardware/photo.webp"/></label>
      <label className="check"><input type="checkbox" checked={draft.published} onChange={(e) => setDraft({ ...draft, published: e.target.checked })}/> Show on the website</label>
      <p><button className="btn btn--primary btn--sm" disabled={busy} onClick={() => void act({ action: "save", ...draft }, "Saved.")}>{busy ? "Saving…" : "Save part"}</button> <button className="btn btn--ghost btn--sm" onClick={() => setDraft(null)}>Cancel</button></p>
    </div>}

    <div className="admin-hardware__groups">{data.groups.map((group) => {
      const mine = data.added.filter((item) => item.groupSlug === group.slug);
      const built = data.builtIn.filter((item) => item.groupSlug === group.slug);
      const all = [...mine.map((item) => ({ type: "added" as const, item })), ...built.map((item) => ({ type: "built" as const, item }))];
      const size = groupSizes[group.slug] ?? 20;
      const page = Math.min(groupPages[group.slug] ?? 0, Math.max(0, Math.ceil(all.length / size) - 1));
      const changePage = (next: number) => setGroupPages((v) => ({ ...v, [group.slug]: next }));
      const changeSize = (next: number) => { setGroupSizes((v) => ({ ...v, [group.slug]: next })); changePage(0); };
      return <details key={group.slug} className="admin-accordion admin-hardware__group">
        <summary><span>{group.title}</span><span className="status-pill">{all.length} parts</span></summary>
        <AdminPager page={page} total={all.length} pageSize={size} onPage={changePage} onPageSize={changeSize} label={group.title}/>
        <div className="admin-hardware__items">{paged(all, page, size).map((record) => record.type === "added" ?
          <article className="admin-hardware__item" key={record.item.id}>
            <div><b>{record.item.name}</b><small>{record.item.note}</small></div>
            <span className={record.item.published ? "status-pill status-pill--done" : "status-pill"}>{record.item.published ? "Published" : "Hidden"}</span>
            <div className="admin-hardware__actions">
              <button className="btn btn--ghost btn--sm" type="button" onClick={() => setDraft({ id: record.item.id, groupSlug: record.item.groupSlug, name: record.item.name, note: record.item.note, image: record.item.image ?? "", published: record.item.published })}>Edit</button>
              <button className="btn btn--ghost btn--sm" type="button" disabled={busy} onClick={() => { if (window.confirm(`Delete “${record.item.name}”?`)) void act({ action: "delete", id: record.item.id }, "Deleted."); }}>Delete</button>
            </div>
          </article> :
          <article className="admin-hardware__item" key={record.item.name}>
            <div><b>{record.item.name}</b><small>{record.item.note}</small></div>
            <span className={record.item.hidden ? "status-pill" : "status-pill status-pill--done"}>{record.item.hidden ? "Hidden" : "Published"}</span>
            <button type="button" className="btn btn--ghost btn--sm" disabled={busy} onClick={() => void act({ action: record.item.hidden ? "show" : "hide", groupSlug: record.item.groupSlug, name: record.item.name }, record.item.hidden ? "Showing again." : "Hidden.")}>{record.item.hidden ? <Eye size={14}/> : <EyeOff size={14}/>} {record.item.hidden ? "Show" : "Hide"}</button>
          </article>
        )}</div>
        {all.length > size && <AdminPager page={page} total={all.length} pageSize={size} onPage={changePage} label={group.title}/>}
      </details>;
    })}</div>
    <p className="muted">Group names: {data.groups.map((group) => title(group.slug)).join(", ")}.</p>
  </section>;
}
