"use client";

import { useState } from "react";
import { CITIES_BY_STATE, CITY_NOT_LISTED, INDIA_STATES } from "@/lib/india-geo";

/**
 * State dropdown (all 28 states + 8 UTs) + a City dropdown that filters to that state's major
 * cities, with an "Other — type it myself" option so nobody is blocked if their town isn't
 * listed. Shared by the profile page, saved addresses and the PAN form so all three behave the
 * same way.
 */
export function StateSelect({ id, value, onChange, required }: { id?: string; value: string; onChange: (next: string) => void; required?: boolean }) {
  return <select id={id} value={value} onChange={(event) => onChange(event.target.value)} autoComplete="address-level1" required={required}>
    <option value="">Select state</option>
    {INDIA_STATES.map((state) => <option key={state} value={state}>{state}</option>)}
    {value && !INDIA_STATES.includes(value as never) && <option value={value}>{value}</option>}
  </select>;
}

export function CitySelect({ id, state, value, onChange, required }: { id?: string; state: string; value: string; onChange: (next: string) => void; required?: boolean }) {
  const options = state ? CITIES_BY_STATE[state] ?? [] : [];
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
