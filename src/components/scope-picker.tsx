"use client";

import { useState } from "react";
import { publishedServiceDetails, serviceCatalog } from "@/lib/services";
import { SPECIAL_SCOPES } from "@/lib/promo-scope";

export type Scope = { categories: string[]; services: string[] };

/**
 * "Where can this code be used?" — everything, or chosen categories / single services / print
 * orders / PAN. Used by the promotion and personal-code editors.
 */
export default function ScopePicker({ value, onChange }: { value: Scope | null; onChange: (next: Scope | null) => void }) {
  const [open, setOpen] = useState<string | null>(null);
  const scope = value ?? { categories: [], services: [] };
  const restricted = Boolean(value && (value.categories.length || value.services.length));
  const toggle = (list: "categories" | "services", slug: string) => {
    const next = { ...scope, [list]: scope[list].includes(slug) ? scope[list].filter((item) => item !== slug) : [...scope[list], slug] };
    onChange(next.categories.length || next.services.length ? next : null);
  };
  return <div className="scope-picker">
    <div className="seg" role="radiogroup" aria-label="Where the code works">
      <button type="button" role="radio" aria-checked={!restricted} className={!restricted ? "is-active" : undefined} onClick={() => onChange(null)}>All services</button>
      <button type="button" role="radio" aria-checked={restricted} className={restricted ? "is-active" : undefined} onClick={() => { if (!restricted) onChange({ categories: [], services: ["print"] }); }}>Only some services</button>
    </div>
    {restricted && <div className="scope-picker__lists">
      <div className="scope-picker__row">{Object.entries(SPECIAL_SCOPES).map(([slug, label]) => <label key={slug} className={scope.services.includes(slug) ? "scope-chip is-on" : "scope-chip"}><input type="checkbox" checked={scope.services.includes(slug)} onChange={() => toggle("services", slug)}/>{label}</label>)}</div>
      {serviceCatalog.map((group) => {
        const items = publishedServiceDetails.filter((service) => service.categorySlug === group.slug);
        const picked = items.filter((service) => scope.services.includes(service.slug)).length;
        return <div key={group.slug} className="scope-picker__group">
          <div className="scope-picker__row">
            <label className={scope.categories.includes(group.slug) ? "scope-chip is-on" : "scope-chip"}><input type="checkbox" checked={scope.categories.includes(group.slug)} onChange={() => toggle("categories", group.slug)}/>{group.title} <em>(all)</em></label>
            {items.length > 0 && !scope.categories.includes(group.slug) && <button type="button" className="profile-text-button" onClick={() => setOpen(open === group.slug ? null : group.slug)}>{open === group.slug ? "Hide" : "Pick services"}{picked ? ` · ${picked}` : ""}</button>}
          </div>
          {open === group.slug && !scope.categories.includes(group.slug) && <div className="scope-picker__row scope-picker__services">{items.map((service) => <label key={service.slug} className={scope.services.includes(service.slug) ? "scope-chip is-on" : "scope-chip"}><input type="checkbox" checked={scope.services.includes(service.slug)} onChange={() => toggle("services", service.slug)}/>{service.title}</label>)}</div>}
        </div>;
      })}
    </div>}
  </div>;
}
