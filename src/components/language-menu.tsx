"use client";

import { Check, ChevronDown, Globe } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LOCALE_META, LOCALES, localizedHref, type Locale } from "@/lib/i18n";
import { translatedSlugs } from "@/lib/translated-slugs";
import { setPreferredLocale } from "@/lib/use-locale";

/**
 * "Change language" control: English, हिन्दी, বাংলা.
 * - `compact`: globe button with a dropdown (header).
 * - `inline`: three pills side by side (mobile menu, sign-in card).
 */
export default function LanguageMenu({ locale, label, compact = false, inline = false }: { locale: Locale; label: string; compact?: boolean; inline?: boolean }) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  function choose(target: Locale) {
    setOpen(false);
    setPreferredLocale(target);
    const href = localizedHref(pathname, target, translatedSlugs);
    if (href && href !== pathname) router.push(href);
  }

  if (inline) {
    return <div className="lang-pills" role="group" aria-label={label}>
      {LOCALES.map((item) => <button key={item} type="button" lang={LOCALE_META[item].htmlLang} className={item === locale ? "is-active" : undefined} aria-pressed={item === locale} onClick={() => choose(item)}>{LOCALE_META[item].label}</button>)}
    </div>;
  }

  return <div className={compact ? "lang-menu lang-menu--compact" : "lang-menu"} ref={root}>
    <button type="button" className="lang-menu__button" aria-haspopup="listbox" aria-expanded={open} aria-controls={menuId} onClick={() => setOpen((value) => !value)} title={label}>
      <Globe size={18} aria-hidden="true"/><span className="lang-menu__current" lang={LOCALE_META[locale].htmlLang}>{LOCALE_META[locale].short}</span><ChevronDown size={14} aria-hidden="true"/>
      <span className="sr-only">{label}</span>
    </button>
    {open && <ul className="lang-menu__list" id={menuId} role="listbox" aria-label={label}>
      {LOCALES.map((item) => <li key={item} role="option" aria-selected={item === locale}>
        <button type="button" lang={LOCALE_META[item].htmlLang} onClick={() => choose(item)}><span><b>{LOCALE_META[item].label}</b><small>{LOCALE_META[item].english}</small></span>{item === locale && <Check size={16}/>}</button>
      </li>)}
    </ul>}
  </div>;
}
