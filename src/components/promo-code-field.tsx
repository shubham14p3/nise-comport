"use client";

import Portal from "@/components/portal";
import { useEffect, useState } from "react";
import { Check, ChevronRight, LoaderCircle, TicketPercent, X } from "lucide-react";
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
export default function PromoCodeField({ locale, value, applied, onChange, onApplied, suggestions, signedIn, amount, service }: {
  locale: Locale; value: string; applied: AppliedCode | null; signedIn: boolean; amount?: number;
  /** "print", "pan" or the service slug: codes meant for other services are refused. */
  service?: string;
  suggestions: CodeSuggestion[];
  onChange: (code: string) => void; onApplied: (info: AppliedCode | null) => void;
}) {
  const t = promoDict(locale);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [picking, setPicking] = useState(false);
  useEffect(() => {
    if (!picking) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setPicking(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [picking]);

  async function apply(raw = value) {
    const code = raw.trim().toUpperCase();
    if (!code) return;
    onChange(code); setError("");
    if (!signedIn) { onApplied(null); return; }
    setBusy(true);
    try {
      const result = await secureApi<{ code: string; discount: number; exact: boolean; minimum: number; emoji?: string }>("K2p9D5xN1hW7", { code, ...(amount !== undefined ? { amount } : {}), ...(service ? { service } : {}) });
      onApplied({ code: result.code, discount: result.discount, exact: result.exact, minimum: result.minimum, emoji: result.emoji });
    } catch (reason) {
      onApplied(null);
      setError(reason instanceof Error ? reason.message : "Could not check the code.");
    } finally { setBusy(false); }
  }

  function clear() { onChange(""); onApplied(null); setError(""); }

  const shown = suggestions.filter((item) => item.code !== applied?.code);
  return <div className="promo-field">
    <div className="promo-field__head">
      <span className="field__label">{t.promoLabel} <em>{t.promoOptional}</em></span>
      {shown.length > 0 && !applied && <button type="button" className="promo-field__see" onClick={() => setPicking(true)}>{fill(t.seeCodes, { n: String(shown.length) })}<ChevronRight size={15}/></button>}
    </div>
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
    {picking && <Portal><div className="promo-modal" role="dialog" aria-modal="true" aria-labelledby="promo-modal-title" onMouseDown={(event) => { if (event.target === event.currentTarget) setPicking(false); }}>
      <div className="promo-modal__card">
        <header><div><h3 id="promo-modal-title">{t.pickTitle}</h3><p>{t.pickHint}</p></div><button type="button" className="promo-modal__close" aria-label={t.closeLabel} onClick={() => setPicking(false)}><X size={18}/></button></header>
        <ul>{shown.map((item) => <li key={item.code}>
          <button type="button" className={`promo-modal__item${item.personal ? " is-personal" : ""}`} onClick={() => { setPicking(false); void apply(item.code); }}>
            <span className="promo-modal__icon" aria-hidden="true"><TicketPercent size={18}/></span>
            <span className="promo-modal__text"><b>{item.code}</b><small>{item.label}{item.personal ? ` · ${t.yourCoupon}` : ""}</small></span>
            <span className="promo-modal__apply">{t.useCode}</span>
          </button>
        </li>)}</ul>
      </div>
    </div></Portal>}
  </div>;
}
