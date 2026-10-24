"use client";

import { useEffect, useState } from "react";
import { secureApi } from "@/lib/secure-api-client";
import { sanitizeLoyalty, type LoyaltyRule, type LoyaltySettings } from "@/lib/loyalty-core";

type Sync = { enabled: boolean; applied: boolean; credits: number; customers: number; total: number; alreadyRewarded: number; sample: { who: string; reference: string; label: string; amount: number }[] };

/** Admin → Loyalty credit: edit the thank-you rules and give credit for orders finished earlier. */
export default function LoyaltyPanel() {
  const [settings, setSettings] = useState<LoyaltySettings | null>(null);
  const [history, setHistory] = useState({ count: 0, total: 0 });
  const [sync, setSync] = useState<Sync | null>(null);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState(""); const [error, setError] = useState("");

  async function load() {
    const result = await secureApi<{ settings: LoyaltySettings; history: { count: number; total: number } }>("J5w2D8kM3zT7");
    setSettings(result.settings); setHistory(result.history);
  }
  useEffect(() => { void Promise.resolve().then(load).catch((e) => setError(e instanceof Error ? e.message : "Could not load.")); }, []);

  const change = (index: number, patch: Partial<LoyaltyRule> & { keywordText?: string }) => setSettings((current) => {
    if (!current) return current;
    const rules = current.rules.map((rule, i) => {
      if (i !== index) return rule;
      const { keywordText, ...rest } = patch;
      return { ...rule, ...rest, ...(keywordText !== undefined ? { keywords: keywordText.split(",").map((word) => word.toLowerCase().trim()).filter(Boolean) } : {}) };
    });
    return { ...current, rules };
  });

  async function run(action: "save" | "preview" | "apply") {
    if (!settings) return;
    if (action === "apply" && !window.confirm("Give this credit to customers' wallets now? This cannot be undone from here.")) return;
    setBusy(action); setError(""); setMessage("");
    try {
      if (action === "save") { await secureApi("V9n4X1rQ6bH3", { action, settings: sanitizeLoyalty(settings) }); await load(); setSync(null); setMessage("Saved. New completed orders use these rules."); }
      else {
        if (action === "preview" || action === "apply") await secureApi("V9n4X1rQ6bH3", { action: "save", settings: sanitizeLoyalty(settings) });
        const result = await secureApi<{ result: Sync }>("V9n4X1rQ6bH3", { action });
        setSync(result.result); await load();
        setMessage(action === "apply" ? `Done. ₹${result.result.total.toFixed(2)} credited to ${result.result.customers} customers.` : "This is only a preview. Nothing has been given yet.");
      }
    } catch (e) { setError(e instanceof Error ? e.message : "Something went wrong."); }
    finally { setBusy(""); }
  }

  if (!settings) return <section className="admin-card"><h2>Loyalty credit</h2>{error ? <p role="alert" className="form-error">{error}</p> : <p>Loading…</p>}</section>;
  return <section className="admin-card">
    <h2>Loyalty credit</h2>
    <p className="muted">A thank-you credit goes to the customer&rsquo;s wallet when you mark their order <b>Completed</b>. The first rule whose words match the service is used. Credit given so far: <b>₹{history.total.toFixed(2)}</b> in {history.count} credits.</p>
    {message && <p role="status">{message}</p>}{error && <p role="alert" className="form-error">{error}</p>}
    <label className="loyalty-switch"><input type="checkbox" checked={settings.enabled} onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}/> Give credit for completed orders</label>
    <div className="loyalty-rules">{settings.rules.map((rule, index) => <fieldset key={rule.id} className="loyalty-rule" disabled={Boolean(busy)}>
      <label className="loyalty-switch"><input type="checkbox" checked={rule.enabled} onChange={(e) => change(index, { enabled: e.target.checked })}/> <input aria-label="Rule name" value={rule.label} maxLength={80} onChange={(e) => change(index, { label: e.target.value })}/></label>
      <label>Words that match the service <small>(comma separated)</small><input value={rule.keywords.join(", ")} onChange={(e) => change(index, { keywordText: e.target.value })}/></label>
      <div className="loyalty-rule__row">
        <label>Credit type<select value={rule.type} onChange={(e) => change(index, { type: e.target.value as "flat" | "percent" })}><option value="flat">Fixed ₹ amount</option><option value="percent">Percent of the order</option></select></label>
        <label>{rule.type === "flat" ? "Amount (₹)" : "Percent (%)"}<input inputMode="decimal" value={rule.value} onChange={(e) => change(index, { value: Number(e.target.value) || 0 })}/></label>
        {rule.type === "percent" && <><label>Lowest order (₹)<input inputMode="decimal" value={rule.minOrder} onChange={(e) => change(index, { minOrder: Number(e.target.value) || 0 })}/></label>
        <label>Highest credit (₹) <small>empty = no limit</small><input inputMode="decimal" value={rule.cap ?? ""} onChange={(e) => change(index, { cap: e.target.value === "" ? null : Number(e.target.value) || null })}/></label></>}
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => setSettings({ ...settings, rules: settings.rules.filter((_, i) => i !== index) })}>Remove</button>
      </div>
    </fieldset>)}</div>
    <div className="loyalty-actions">
      <button type="button" className="btn btn--ghost" onClick={() => setSettings({ ...settings, rules: [...settings.rules, { id: `rule-${settings.rules.length + 1}`, label: "New rule", enabled: true, keywords: ["keyword"], type: "flat", value: 10, cap: null, minOrder: 0 }] })}>Add a rule</button>
      <button type="button" className="btn btn--primary" disabled={Boolean(busy)} onClick={() => void run("save")}>{busy === "save" ? "Saving…" : "Save rules"}</button>
    </div>
    <h3>Sync up: credit for orders finished earlier</h3>
    <p className="muted">Looks through all completed orders and credits the ones that were never rewarded. Safe to run again: nothing is paid twice. Preview first.</p>
    <div className="loyalty-actions">
      <button type="button" className="btn btn--ghost" disabled={Boolean(busy)} onClick={() => void run("preview")}>{busy === "preview" ? "Checking…" : "Preview"}</button>
      <button type="button" className="btn btn--primary" disabled={Boolean(busy) || !sync || sync.applied || sync.credits === 0} onClick={() => void run("apply")}>{busy === "apply" ? "Giving credit…" : "Give this credit"}</button>
    </div>
    {sync && <div className="loyalty-result"><p><b>{sync.credits}</b> credits · <b>₹{sync.total.toFixed(2)}</b> · {sync.customers} customers{sync.alreadyRewarded ? ` · ${sync.alreadyRewarded} already rewarded` : ""}{!sync.enabled ? " · credit is switched off" : ""}</p>
      {sync.sample.length > 0 && <div className="table-scroll"><table className="price-table"><tbody>{sync.sample.map((row) => <tr key={row.reference}><th scope="row">{row.who}</th><td>{row.reference}</td><td>{row.label}</td><td>₹{row.amount.toFixed(2)}</td></tr>)}</tbody></table></div>}</div>}
  </section>;
}
