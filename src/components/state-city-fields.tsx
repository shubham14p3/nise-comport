"use client";

import { useState } from "react";
import { CITY_NOT_LISTED, citiesFor, statesFor } from "@/lib/india-geo";

/**
 * State dropdown (all 28 states + 8 UTs) + a City dropdown that filters to that state's major
 * cities, with an "Other — type it myself" option so nobody is blocked if their town isn't
 * listed. Shared by the profile page, saved addresses and the PAN form so all three behave the
 * same way.
 */
export function StateSelect({ id, value, onChange, required, country = "India" }: { id?: string; value: string; onChange: (next: string) => void; required?: boolean; country?: string }) {
  const states = statesFor(country);
  if (!states.length) return <input id={id} value={value} onChange={(event) => onChange(event.target.value)} maxLength={100} autoComplete="address-level1" required={required} placeholder="State / province"/>;
  return <select id={id} value={value} onChange={(event) => onChange(event.target.value)} autoComplete="address-level1" required={required}>
    <option value="">Select state</option>
    {states.map((state) => <option key={state} value={state}>{state}</option>)}
    {value && !states.includes(value) && <option value={value}>{value}</option>}
  </select>;
}

export function CitySelect({ id, state, value, onChange, required, country = "India" }: { id?: string; state: string; value: string; onChange: (next: string) => void; required?: boolean; country?: string }) {
  const options = citiesFor(country, state);
  const knownCity = options.includes(value);
  const [typing, setTyping] = useState(Boolean(value) && !knownCity);

  if (typing || !options.length) {
    return <input id={id} value={value} onChange={(event) => onChange(event.target.value)} maxLength={100} autoComplete="address-level2" required={required} placeholder={options.length ? "Type your city/town" : "Select a state first, or type your city"}/>;
  }

  return <select id={id} value={knownCity ? value : ""} onChange={(event) => {
    if (event.target.value === CITY_NOT_LISTED) { setTyping(true); onChange(""); return; }
    onChange(event.target.value);
  }} autoComplete="address-level2" required={required}>
    <option value="">Select city</option>
    {options.map((city) => <option key={city} value={city}>{city}</option>)}
    <option value={CITY_NOT_LISTED}>Other — type it myself</option>
  </select>;
}
