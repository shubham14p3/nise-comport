"use client";

import { useState } from "react";
import { Check, LoaderCircle, TicketPercent, X } from "lucide-react";
import { fill, type Locale } from "@/lib/i18n";
import { promoDict } from "@/lib/promo-i18n";
import { secureApi } from "@/lib/secure-api-client";

export type AppliedCode = { code: string; discount: number; exact: boolean; minimum: number; emoji?: string };
export type CodeSuggestion = { code: string; emoji?: string; label: string; personal?: boolean };

const rupees = (value: number) => `₹${Number.isInteger(value) ? value : value.toFixed(2)}`;

/**
 * Promo-code box for the last step of a flow: type a code or tap a live one. Signed-in customers
 * get an instant check; otherwise the code is checked when the request is sent.
 * `amount` (print orders) makes the check exact; without it the saving is taken off when billing.
 */
export default function PromoCodeField({ locale, value, applied, onChange, onApplied, suggestions, signedIn, amount }: {
  locale: Locale; value: string; applied: AppliedCode | null; signedIn: boolean; amount?: number;
  suggestions: CodeSuggestion[];
  onChange: (code: string) => void; onApplied: (info: AppliedCode | null) => void;
}) {
  const t = promoDict(locale);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function apply(raw = value) {
    const code = raw.trim().toUpperCase();
    if (!code) return;
    onChange(code); setError("");
    if (!signedIn) { onApplied(null); return; }
    setBusy(true);
    try {
      const result = await secureApi<{ code: string; discount: number; exact: boolean; minimum: number; emoji?: string }>("K2p9D5xN1hW7", { code, ...(amount !== undefined ? { amount } : {}) });
      onApplied({ code: result.code, discount: result.discount, exact: result.exact, minimum: result.minimum, emoji: result.emoji });
    } catch (reason) {
      onApplied(null);
      setError(reason instanceof Error ? reason.message : "Could not check the code.");
    } finally { setBusy(false); }
  }

  function clear() { onChange(""); onApplied(null); setError(""); }

  const shown = suggestions.filter((item) => item.code !== applied?.code).slice(0, 5);
  return <div className="promo-field">
    <span className="field__label">{t.promoLabel} <em>{t.promoOptional}</em></span>
    <div className={`coupon${applied ? " is-applied" : ""}`}>
      <TicketPercent size={20}/>
      <input value={value} onChange={(event) => { onChange(event.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 40)); onApplied(null); setError(""); }}
        onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void apply(); } }}
        placeholder={t.promoPlaceholder} aria-label={t.promoLabel} autoCapitalize="characters" spellCheck={false}/>
      {applied || (value && !signedIn && !error) ? <button type="button" className="btn btn--ghost btn--sm" onClick={clear}><X size={15}/>{t.remove}</button>
        : <button type="button" className="btn btn--ghost btn--sm" onClick={() => void apply()} disabled={!value.trim() || busy}>{busy ? <><LoaderCircle size={15} className="spin"/>{t.checking}</> : t.apply}</button>}
    </div>
    {applied && <p className="alert alert--success promo-field__ok"><Check size={16}/>{applied.exact
      ? fill(t.promoPrint, { code: applied.code, amount: rupees(applied.discount) })
      : fill(t.promoSaved, { code: applied.code, amount: rupees(applied.discount), min: applied.minimum })}</p>}
    {!applied && value && !signedIn && !error && <p className="field__hint">{t.promoLater}</p>}
    {error && <p className="field__error" role="alert">{error}</p>}
    {shown.length > 0 && !applied && <div className="promo-field__chips"><span>{t.promoSuggest}</span>{shown.map((item) => <button key={item.code} type="button" className={`code-chip${item.personal ? " code-chip--personal" : ""}`} onClick={() => void apply(item.code)} title={item.label}>
      {item.emoji && <span aria-hidden="true">{item.emoji}</span>}<b>{item.code}</b>{item.personal && <small>{t.yourCoupon}</small>}
    </button>)}</div>}
  </div>;
}
