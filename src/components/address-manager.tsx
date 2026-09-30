"use client";
import { FormEvent, useEffect, useState } from "react";
import { MapPin, Plus, Star, Trash2, X } from "lucide-react";
import AddressPicker, { addressProblem, EMPTY_ADDRESS, type AddressValue } from "@/components/address-picker";
import { secureApi, SecureApiError } from "@/lib/secure-api-client";

type Address = { id: string; label: string; line1: string; line2: string | null; landmark?: string | null; city: string; state: string; postalCode: string; isDefault: boolean };
const LABELS = ["Home", "Work", "Other"];

/** Saved addresses with Google search / current location, plus manual entry. */
export default function AddressManager() {
  const [rows, setRows] = useState<Address[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("Home");
  const [value, setValue] = useState<AddressValue>(EMPTY_ADDRESS);
  const [isDefault, setIsDefault] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function refresh() {
    const result = await secureApi<{ addresses: Address[] }>("P3v8F1qL6sM4");
    setRows(result.addresses);
  }

  useEffect(() => {
    let active = true;
    secureApi<{ addresses: Address[] }>("P3v8F1qL6sM4")
      .then((result) => { if (active) setRows(result.addresses); })
      .catch(() => undefined)
      .finally(() => { if (active) setLoaded(true); });
    return () => { active = false; };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const problem = addressProblem(value);
    if (problem) { setError(problem); return; }
    setBusy(true); setError("");
    try {
      await secureApi("D6k0N9yR2tH5", {
        label, line1: value.line1, line2: value.line2, landmark: value.landmark || undefined, city: value.city, state: value.state, postalCode: value.postalCode,
        latitude: value.latitude ?? undefined, longitude: value.longitude ?? undefined, placeId: value.placeId ?? undefined, isDefault,
      });
      setValue(EMPTY_ADDRESS); setIsDefault(false); setOpen(false); await refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not save the address."); }
    finally { setBusy(false); }
  }

  async function remove(id: string) {
    setError("");
    try { await secureApi("X1m7C4pV8qB3", { id }); await refresh(); }
    catch (reason) { setError(reason instanceof SecureApiError ? reason.message : "Could not remove the address."); }
  }

  return <div className="addresses">
    {error && <div className="alert alert--error" role="alert">{error}</div>}
    {rows.length ? <div className="address-list">{rows.map((row) => <article key={row.id} className={row.isDefault ? "address is-default" : "address"}>
      <span className="address__icon"><MapPin size={20}/></span>
      <div><b>{row.label}{row.isDefault && <span className="chip chip--soft"><Star size={12}/> Default</span>}</b><p>{row.line1}{row.line2 ? `, ${row.line2}` : ""}{row.landmark ? ` (near ${row.landmark})` : ""}, {row.city}, {row.state} {row.postalCode}</p></div>
      <button type="button" className="icon-btn" aria-label={`Remove ${row.label} address`} onClick={() => void remove(row.id)}><Trash2 size={18}/></button>
    </article>)}</div> : loaded && !open ? <div className="empty-state empty-state--sm"><span className="empty-state__icon"><MapPin size={22}/></span><h3>No saved addresses yet</h3><p>Add one for print delivery or doorstep help.</p></div> : null}
    {open ? <form onSubmit={submit} className="inline-panel" noValidate>
      <div className="inline-panel__head"><b>New address</b><button type="button" className="icon-btn" onClick={() => setOpen(false)} aria-label="Close"><X size={18}/></button></div>
      <div className="seg">{LABELS.map((item) => <button key={item} type="button" className={label === item ? "is-active" : undefined} aria-pressed={label === item} onClick={() => setLabel(item)}>{item}</button>)}</div>
      <AddressPicker value={value} onChange={setValue}/>
      <label className="check"><input type="checkbox" checked={isDefault} onChange={(event) => setIsDefault(event.target.checked)}/><span>Set as my default address</span></label>
      <div className="form-actions"><button className="btn btn--primary" disabled={busy}>{busy ? "Saving…" : "Save address"}</button><button type="button" className="btn btn--ghost" onClick={() => setOpen(false)}>Cancel</button></div>
    </form> : <button type="button" className="btn btn--ghost" onClick={() => setOpen(true)}><Plus size={18}/>Add an address</button>}
  </div>;
}
