"use client";
import { FormEvent, useEffect, useState } from "react";
import { MapPin, Plus, Trash2 } from "lucide-react";
import { secureApi, SecureApiError } from "@/lib/secure-api-client";

type Address = { id: string; label: string; line1: string; line2: string | null; city: string; state: string; postalCode: string; isDefault: boolean };
export default function AddressManager() {
  const [rows, setRows] = useState<Address[]>([]); const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function refresh() {
    const result = await secureApi<{ addresses: Address[] }>("P3v8F1qL6sM4");
    setRows(result.addresses);
  }
  useEffect(() => { let active = true; secureApi<{ addresses: Address[] }>("P3v8F1qL6sM4").then(result => { if (active) setRows(result.addresses); }).catch(() => undefined); return () => { active = false; }; }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      await secureApi("D6k0N9yR2tH5", { ...Object.fromEntries(form), isDefault: form.get("isDefault") === "on" });
      formElement.reset(); setOpen(false); await refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not save the address."); }
    finally { setBusy(false); }
  }
  async function remove(id: string) {
    setError(""); try { await secureApi("X1m7C4pV8qB3", { id }); await refresh(); } catch (reason) { setError(reason instanceof SecureApiError ? reason.message : "Could not remove the address."); }
  }
  return <section className="address-card"><div className="address-heading"><div className="request-icon"><MapPin size={17}/></div><div><h2>Saved addresses</h2><p>Choose an address when you request delivery.</p></div><button type="button" onClick={() => setOpen(value => !value)}><Plus size={14}/>{open ? "Close" : "Add address"}</button></div>
    {error && <div className="form-alert error-alert">{error}</div>}
    {rows.length ? <div className="address-list">{rows.map(row => <article key={row.id}><span><b>{row.label}</b>{row.isDefault && <small>DEFAULT</small>}</span><p>{row.line1}{row.line2 ? `, ${row.line2}` : ""}, {row.city}, {row.state} {row.postalCode}</p><button type="button" aria-label={`Remove ${row.label} address`} onClick={() => void remove(row.id)}><Trash2 size={14}/></button></article>)}</div> : <p className="address-empty">No saved addresses yet.</p>}
    {open && <form onSubmit={submit} className="address-form"><label>Label<input name="label" defaultValue="Home" required maxLength={40}/></label><label>Address line 1<input name="line1" required maxLength={160} placeholder="House, building, street"/></label><label>Address line 2 <span>OPTIONAL</span><input name="line2" maxLength={160}/></label><label>City<input name="city" required defaultValue="Jamshedpur"/></label><label>State<input name="state" required defaultValue="Jharkhand"/></label><label>PIN code<input name="postalCode" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required/></label><label className="address-default"><input type="checkbox" name="isDefault"/> Set as default address</label><button className="button button-green" disabled={busy}>{busy ? "Saving…" : "Save address"}</button></form>}
  </section>;
}
