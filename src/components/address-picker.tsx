"use client";

import { useEffect, useRef, useState } from "react";
import { LoaderCircle, LocateFixed, MapPin, PencilLine, Search } from "lucide-react";
import { secureApi } from "@/lib/secure-api-client";

export type AddressValue = {
  line1: string; line2: string; landmark: string; city: string; state: string; postalCode: string;
  latitude: number | null; longitude: number | null; placeId: string | null;
};
type Suggestion = { placeId: string; main: string; secondary: string };

export const EMPTY_ADDRESS: AddressValue = { line1: "", line2: "", landmark: "", city: "Jamshedpur", state: "Jharkhand", postalCode: "", latitude: null, longitude: null, placeId: null };

function newToken() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

export function formatAddress(value: AddressValue) {
  return [value.line1, value.line2, value.landmark ? `Near ${value.landmark}` : "", value.city, value.state, value.postalCode].filter(Boolean).join(", ");
}

export function addressProblem(value: AddressValue) {
  if (value.line1.trim().length < 3) return "Add the house / building and street.";
  if (value.city.trim().length < 2) return "Add the city.";
  if (value.state.trim().length < 2) return "Add the state.";
  if (!/^[1-9]\d{5}$/.test(value.postalCode)) return "Enter a 6-digit PIN code.";
  return "";
}

/**
 * Address entry with Google Places suggestions and "use my current location".
 * All Google calls go through the encrypted API; the key stays on the server. If Google isn't
 * configured, the form simply shows the manual fields.
 */
export default function AddressPicker({ value, onChange, compact = false }: { value: AddressValue; onChange: (next: AddressValue) => void; compact?: boolean }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [available, setAvailable] = useState(true);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [message, setMessage] = useState("");
  const [manual, setManual] = useState(Boolean(value.line1));
  const [open, setOpen] = useState(false);
  const token = useRef<string>("");
  const requestId = useRef(0);

  useEffect(() => {
    const text = query.trim();
    if (text.length < 3 || !available) return;
    const id = ++requestId.current;
    const timer = window.setTimeout(() => {
      if (!token.current) token.current = newToken();
      setLoading(true);
      secureApi<{ available: boolean; suggestions: Suggestion[] }>("W3k8P1zN6qT2", { input: text, sessionToken: token.current })
        .then((result) => {
          if (id !== requestId.current) return;
          if (!result.available) { setAvailable(false); setManual(true); return; }
          setSuggestions(result.suggestions); setOpen(true);
        })
        .catch(() => { if (id === requestId.current) setSuggestions([]); })
        .finally(() => { if (id === requestId.current) setLoading(false); });
    }, 320);
    return () => window.clearTimeout(timer);
  }, [query, available]);

  async function choose(suggestion: Suggestion) {
    setOpen(false); setQuery(suggestion.main); setLoading(true); setMessage("");
    try {
      const result = await secureApi<{ available: boolean; address: Omit<AddressValue, "landmark"> | null }>("Q9v4H2mX7rB5", { placeId: suggestion.placeId, sessionToken: token.current });
      token.current = "";
      if (result.address) { onChange({ ...value, ...result.address, landmark: value.landmark }); setManual(true); }
      else setMessage("We couldn’t read that address. Please fill it in below.");
    } catch { setMessage("We couldn’t load that address. Please fill it in below."); setManual(true); }
    finally { setLoading(false); }
  }

  function locate() {
    if (!("geolocation" in navigator)) { setMessage("Location isn’t available on this device. Please type your address."); setManual(true); return; }
    setLocating(true); setMessage("");
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const result = await secureApi<{ available: boolean; address: Omit<AddressValue, "landmark"> | null }>("E7t2Y9cK4nM1", { latitude: position.coords.latitude, longitude: position.coords.longitude });
        if (!result.available) { setAvailable(false); setMessage("Address lookup isn’t set up yet. Please type your address."); }
        else if (result.address) { onChange({ ...value, ...result.address, landmark: value.landmark }); setMessage("Location found. Please check the house number and add a landmark."); }
        else setMessage("We couldn’t find an address here. Please type it below.");
      } catch { setMessage("We couldn’t look up your location. Please type your address."); }
      finally { setLocating(false); setManual(true); }
    }, () => { setLocating(false); setManual(true); setMessage("Location permission was denied. You can type the address instead."); }, { enableHighAccuracy: true, timeout: 12_000, maximumAge: 60_000 });
  }

  const set = (key: keyof AddressValue) => (event: React.ChangeEvent<HTMLInputElement>) => onChange({ ...value, [key]: key === "postalCode" ? event.target.value.replace(/\D/g, "").slice(0, 6) : event.target.value });

  return <div className={compact ? "address-picker address-picker--compact" : "address-picker"}>
    {available && <div className="address-picker__search">
      <label className="field">
        <span className="field__label">Search your address</span>
        <span className="input-wrap">
          <Search size={18} aria-hidden="true"/>
          <input type="search" value={query} onChange={(event) => { setQuery(event.target.value); if (event.target.value.trim().length < 3) { setSuggestions([]); setOpen(false); } }} onFocus={() => suggestions.length && setOpen(true)} placeholder="Building, street or area in Jamshedpur" autoComplete="off" role="combobox" aria-expanded={open} aria-controls="address-suggestions" aria-autocomplete="list"/>
          {loading && <LoaderCircle className="spin" size={18} aria-hidden="true"/>}
        </span>
      </label>
      {open && suggestions.length > 0 && <ul className="suggestions" id="address-suggestions" role="listbox">
        {suggestions.map((item) => <li key={item.placeId} role="option" aria-selected="false"><button type="button" onClick={() => void choose(item)}><MapPin size={17}/><span><b>{item.main}</b><small>{item.secondary}</small></span></button></li>)}
        <li className="suggestions__credit">Suggestions by Google</li>
      </ul>}
      <div className="address-picker__actions">
        <button type="button" className="chip-btn" onClick={locate} disabled={locating}>{locating ? <LoaderCircle className="spin" size={16}/> : <LocateFixed size={16}/>}Use my current location</button>
        {!manual && <button type="button" className="chip-btn" onClick={() => setManual(true)}><PencilLine size={16}/>Type it myself</button>}
      </div>
    </div>}
    {message && <p className="field__hint" role="status">{message}</p>}
    {(manual || !available) && <div className="form-grid">
      <label className="field field--full"><span className="field__label">House / flat, building &amp; street</span><input value={value.line1} onChange={set("line1")} maxLength={160} autoComplete="address-line1" required/></label>
      <label className="field"><span className="field__label">Area / locality</span><input value={value.line2} onChange={set("line2")} maxLength={160} autoComplete="address-line2" placeholder="e.g. Kharangajhar"/></label>
      <label className="field"><span className="field__label">Landmark <em>optional</em></span><input value={value.landmark} onChange={set("landmark")} maxLength={120} placeholder="e.g. near Hanuman Mandir"/></label>
      <label className="field"><span className="field__label">City</span><input value={value.city} onChange={set("city")} maxLength={80} autoComplete="address-level2" required/></label>
      <label className="field"><span className="field__label">State</span><input value={value.state} onChange={set("state")} maxLength={80} autoComplete="address-level1" required/></label>
      <label className="field"><span className="field__label">PIN code</span><input value={value.postalCode} onChange={set("postalCode")} inputMode="numeric" maxLength={6} autoComplete="postal-code" required placeholder="831004"/></label>
    </div>}
  </div>;
}
