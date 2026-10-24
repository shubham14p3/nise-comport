"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Check, Copy, X } from "lucide-react";
import { dateLabel } from "@/lib/outreach-core";
import { secureApi } from "@/lib/secure-api-client";
import { getSessionUser, SESSION_CHANGED } from "@/lib/session-client";
import { lp, tr } from "@/lib/tr";
import { useLocale } from "@/lib/use-locale";

type Greeting = { name: string; birthday: string; coupon: { code: string; percent: number; until: string } | null };

const skip = (path: string) => /^\/(api|desk|mail-x7q2|_next)(\/|$)/.test(path);

/**
 * Pop-up for a signed-in customer on their birthday (and the six days after): a greeting and, when the
 * gift is on, their personal coupon. Shown once per birthday in each browser.
 */
export default function BirthdayGreeting() {
  const locale = useLocale();
  const t = tr(locale);
  const path = usePathname();
  const [greeting, setGreeting] = useState<Greeting | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (skip(path)) return;
    let live = true;
    const check = async () => {
      try {
        if (sessionStorage.getItem("nc-bday-checked") === "1") return;
      } catch { /* storage unavailable */ }

      try {
        // Previously this hit the birthday endpoint on every anonymous visit
        // (after a 30-second cooldown). Share the navbar's session lookup.
        const user = await getSessionUser();
        if (!live || !user) return;
        const data = await secureApi<{ signedIn?: boolean; greeting?: Greeting | null }>("M5q9B2nT7wR3");
        if (!live || !data?.signedIn) return;
        try { sessionStorage.setItem("nc-bday-checked", "1"); } catch { /* ignore */ }
        const found = data.greeting;
        if (!found) return;
        try { if (localStorage.getItem(`nc-bday-${found.birthday}`) === "1") return; } catch { /* ignore */ }
        setGreeting(found);
      } catch { /* birthday notification is optional */ }
    };
    void check();
    // The root layout persists after login, so retry when auth changes.
    window.addEventListener(SESSION_CHANGED, check);
    return () => { live = false; window.removeEventListener(SESSION_CHANGED, check); };
  }, [path]);

  const close = useCallback(() => {
    if (greeting) { try { localStorage.setItem(`nc-bday-${greeting.birthday}`, "1"); } catch { /* ignore */ } }
    setGreeting(null);
  }, [greeting]);

  useEffect(() => {
    if (!greeting) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [greeting, close]);

  if (!greeting) return null;
  const { coupon } = greeting;
  const copy = async () => {
    if (!coupon) return;
    try { await navigator.clipboard.writeText(coupon.code); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* the code is on screen to read out */ }
  };
  const lang = locale === "hi" || locale === "bn" ? locale : "en";
  return <div className="help-dialog" role="dialog" aria-modal="true" aria-labelledby="birthday-title" onClick={close}>
    <div className="help-dialog__card birthday-card" onClick={(event) => event.stopPropagation()}>
      <button type="button" className="icon-btn help-dialog__close" aria-label={t("Close", "बंद करें", "বন্ধ করুন")} onClick={close}><X size={20}/></button>
      <div className="birthday-card__emoji" aria-hidden="true">🎂🎉</div>
      <h2 id="birthday-title">{t("Happy Birthday", "जन्मदिन मुबारक", "শুভ জন্মদিন")}{greeting.name ? `, ${greeting.name}!` : "!"}</h2>
      <p>{t("Everyone at NISE COMPORT wishes you a wonderful year ahead.", "NISE COMPORT की पूरी टीम की ओर से आपको आने वाले साल की ढेर सारी शुभकामनाएँ।", "NISE COMPORT-এর সবার পক্ষ থেকে আপনাকে আগামী বছরের অনেক শুভেচ্ছা।")}</p>
      {coupon ? <>
        <div className="birthday-card__gift">
          <span>{t(`Your gift: ${coupon.percent}% off our service charge`, `आपका तोहफ़ा: हमारे सेवा शुल्क पर ${coupon.percent}% छूट`, `আপনার উপহার: আমাদের সার্ভিস চার্জে ${coupon.percent}% ছাড়`)}</span>
          <button type="button" className="birthday-card__code" onClick={() => void copy()} aria-label={t("Copy coupon code", "कूपन कोड कॉपी करें", "কুপন কোড কপি করুন")}><b>{coupon.code}</b>{copied ? <Check size={16}/> : <Copy size={16}/>}</button>
          <small>{t(`Valid until ${dateLabel(coupon.until, "en")}. Use it once, on any service. It does not cover government fees or insurance premium.`, `${dateLabel(coupon.until, "hi")} तक मान्य। किसी भी सेवा पर एक बार इस्तेमाल करें। सरकारी शुल्क और बीमा प्रीमियम पर लागू नहीं।`, `${dateLabel(coupon.until, "bn")} পর্যন্ত বৈধ। যেকোনও পরিষেবায় একবার ব্যবহার করুন। সরকারি ফি ও বিমার প্রিমিয়ামে প্রযোজ্য নয়।`)}</small>
        </div>
        <div className="form-actions">
          <Link className="btn btn--primary" href={`${lp(lang, "/services")}`} onClick={close}>{t("Use it on a service", "किसी सेवा पर इस्तेमाल करें", "একটি পরিষেবায় ব্যবহার করুন")}</Link>
          <button type="button" className="btn btn--ghost" onClick={close}>{t("Maybe later", "बाद में", "পরে")}</button>
        </div>
      </> : <div className="form-actions"><button type="button" className="btn btn--primary" onClick={close}>{t("Thank you", "धन्यवाद", "ধন্যবাদ")}</button></div>}
    </div>
  </div>;
}
