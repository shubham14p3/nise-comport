"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, Check, Gift, Printer } from "lucide-react";
import CopyCode from "@/components/copy-code";
import PromoCard from "@/components/promo-card";
import { todayIst } from "@/lib/festivals";
import { fill } from "@/lib/i18n";
import { promoDict, shortDate } from "@/lib/promo-i18n";
import { discountLabel, promoText, type CustomerVoucher } from "@/lib/promo-view";
import { useLocale } from "@/lib/use-locale";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.nisecomport.com").replace(/\/$/, "");

/** Profile → Vouchers: the customer's own coupons (welcome ₹50) as tickets, then today's live codes. */
export default function VoucherBoard({ vouchers }: { vouchers: CustomerVoucher[] }) {
  const locale = useLocale();
  const t = promoDict(locale);
  const today = todayIst();
  const personal = vouchers.filter((voucher) => voucher.personal);
  const live = vouchers.filter((voucher) => !voucher.personal && voucher.live && (voucher.kind === "festival" || voucher.kind === "sport"));
  const other = vouchers.filter((voucher) => !voucher.personal && voucher.live && voucher.kind === "public");

  return <div className="voucher-board">
    {personal.length > 0 && <div className="voucher-board__personal">{personal.map((voucher) => <article key={voucher.code} className={`big-ticket${voucher.used ? " is-used" : ""}`}>
      <div className="big-ticket__left">
        <span className="big-ticket__kicker"><Gift size={15}/>{t.personal}</span>
        <strong>{discountLabel(voucher, locale)}</strong>
        <small>{fill(t.minOrder, { min: voucher.minimum })} · {fill(t.expires, { date: shortDate(voucher.endsOn, locale, true) })}</small>
      </div>
      <div className="big-ticket__right">
        <span className="promo-card__code-label">{t.code}</span>
        <b className="big-ticket__code">{voucher.code}</b>
        {voucher.used ? <span className="big-ticket__used"><Check size={15}/>{t.used}</span> : <div className="big-ticket__actions">
          <CopyCode text={voucher.code} locale={locale} className="copy-btn copy-btn--light"/>
          <Link className="btn btn--light btn--sm" href={`/request?coupon=${encodeURIComponent(voucher.code)}`}>{t.useNow}<ArrowRight size={15}/></Link>
          <Link className="btn btn--glass btn--sm" href="/print"><Printer size={15}/>{t.useOnPrint}</Link>
        </div>}
      </div>
      <i className="big-ticket__notch big-ticket__notch--t" aria-hidden="true"/><i className="big-ticket__notch big-ticket__notch--b" aria-hidden="true"/>
    </article>)}</div>}

    <div className="voucher-board__head"><h3>{t.liveCodes}</h3><Link className="text-link" href="/offers#calendar"><CalendarDays size={15}/>{t.seeCalendar}<ArrowRight size={15}/></Link></div>
    {live.length ? <div className="promo-grid promo-grid--compact">{live.map((voucher) => <div key={voucher.code} className={voucher.used ? "is-used-wrap" : undefined}>
      <PromoCard view={voucher} locale={locale} today={today} siteUrl={SITE_URL} variant="compact"/>
      {voucher.used && <span className="used-flag"><Check size={14}/>{t.used}</span>}
    </div>)}</div> : <div className="empty-state"><span className="empty-state__icon"><Gift size={22}/></span><h3>{t.noVouchers}</h3><p>{t.noVouchersText}</p></div>}

    {other.length > 0 && <div className="voucher-grid">{other.map((voucher) => <article className="voucher" key={voucher.code}>
      <span className="badge badge--live"><i/>{t.live}</span><h3>{voucher.code}</h3>
      <p>{promoText(voucher, locale).highlight} · {fill(t.minOrder, { min: voucher.minimum })}</p>
      <small>{voucher.endsOn < "2099-01-01" ? fill(t.expires, { date: shortDate(voucher.endsOn, locale, true) }) : ""}</small>
      {voucher.used ? <span className="big-ticket__used"><Check size={14}/>{t.used}</span> : <CopyCode text={voucher.code} locale={locale} className="copy-btn copy-btn--sm"/>}
    </article>)}</div>}
  </div>;
}
