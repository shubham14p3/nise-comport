"use client";

import { useEffect, useState } from "react";
import { secureApi } from "@/lib/secure-api-client";
import { serviceCatalog, publishedServiceDetails } from "@/lib/services";

type Price = { slug: string; amount: number | null; kind: "fixed" | "from"; note: string | null };
type Draft = { amount: string; kind: "fixed" | "from"; note: string };

/** Admin → Service prices: our service charge per service. Leave the amount empty and nothing is shown to customers. */
export default function PricesPanel() {
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    secureApi<{ prices: Price[] }>("N2v6Z9kQ4tH1").then((result) => {
      if (!active) return;
      setDrafts(Object.fromEntries(result.prices.map((p) => [p.slug, { amount: p.amount ? String(p.amount) : "", kind: p.kind, note: p.note ?? "" }])));
      setLoaded(true);
    }).catch((e) => { if (active) { setError(e instanceof Error ? e.message : "Could not load prices."); setLoaded(true); } });
    return () => { active = false; };
  }, []);

  const draft = (slug: string): Draft => drafts[slug] ?? { amount: "", kind: "fixed", note: "" };
  const change = (slug: string, patch: Partial<Draft>) => setDrafts((all) => ({ ...all, [slug]: { ...draft(slug), ...patch } }));

  async function save(slug: string) {
    setBusy(slug); setError(""); setMessage("");
    const d = draft(slug);
    try { await secureApi("E8c4R1pW7mL3", { slug, amount: d.amount, kind: d.kind, note: d.note || null }); setMessage(d.amount.trim() ? "Saved." : "Cleared. Nothing will be shown for this service."); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not save."); }
    finally { setBusy(""); }
  }

  return <section className="admin-card">
    <h2>Service prices</h2>
    <p className="muted">Our service charge for each service (government fees are separate). Leave the amount empty to show no price: customers are then told to contact you.</p>
    {message && <p role="status">{message}</p>}{error && <p role="alert" className="form-error">{error}</p>}
    {!loaded ? <p>Loading…</p> : serviceCatalog.map((group) => {
      const items = publishedServiceDetails.filter((s) => s.categorySlug === group.slug);
      if (!items.length) return null;
      return <div key={group.slug}><h3>{group.title}</h3><div className="table-scroll"><table className="price-table"><tbody>
        {items.map((service) => { const d = draft(service.slug); return <tr key={service.slug}>
          <th scope="row">{service.title}</th>
          <td><select value={d.kind} onChange={(e) => change(service.slug, { kind: e.target.value as "fixed" | "from" })} aria-label="Price type"><option value="fixed">Fixed</option><option value="from">From</option></select></td>
          <td><input inputMode="numeric" placeholder="₹ (empty = hidden)" value={d.amount} onChange={(e) => change(service.slug, { amount: e.target.value })} aria-label={`Charge for ${service.title}`}/></td>
          <td><input placeholder="Note (optional)" maxLength={160} value={d.note} onChange={(e) => change(service.slug, { note: e.target.value })}/></td>
          <td><button className="btn btn--primary btn--sm" disabled={busy === service.slug} onClick={() => void save(service.slug)}>{busy === service.slug ? "Saving…" : "Save"}</button></td>
        </tr>; })}
      </tbody></table></div></div>;
    })}
  </section>;
}
