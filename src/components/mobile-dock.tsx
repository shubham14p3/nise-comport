"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BadgePercent, House, LayoutGrid, Plus, UserRound } from "lucide-react";
import { dict } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/** Screens with their own bottom action bar (step flows) or no need for the dock. */
const HIDDEN = ["/login", "/signup", "/forgot-password", "/admin", "/request", "/print", "/pan/request"];

/** Thumb-friendly bottom navigation on phones. */
export default function MobileDock() {
  const pathname = usePathname() ?? "/";
  const locale = useLocale();
  const t = dict(locale).nav;
  if (HIDDEN.some((path) => pathname === path || pathname.startsWith(`${path}/`))) return null;
  const home = locale === "en" ? "/" : `/${locale}`;
  const active = (href: string) => (href === home ? pathname === href : pathname.startsWith(href));
  return <nav className="mobile-dock" aria-label="Quick navigation">
    <Link href={home} className={active(home) ? "is-active" : undefined}><House size={21}/><span>{t.home}</span></Link>
    <Link href="/services" className={active("/services") ? "is-active" : undefined}><LayoutGrid size={21}/><span>{t.services}</span></Link>
    <Link href="/request" className="mobile-dock__fab" aria-label={t.startRequest}><span className="mobile-dock__fab-circle"><Plus size={26}/></span><span>{t.request}</span></Link>
    <Link href="/offers" className={active("/offers") ? "is-active" : undefined}><BadgePercent size={21}/><span>{t.offers}</span><i className="live-dot" aria-hidden="true"/></Link>
    <Link href="/profile" className={active("/profile") ? "is-active" : undefined}><UserRound size={21}/><span>{t.account}</span></Link>
  </nav>;
}
