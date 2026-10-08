"use client";

import Link from "next/link";
import BrandWordmark from "@/components/brand-wordmark";
import LanguageMenu from "@/components/language-menu";
import OfferTicker from "@/components/offer-ticker";
import { WhatsAppIcon } from "@/components/icons";
import { ArrowRight, LogOut, Menu, Phone, UserRound, X } from "lucide-react";
import { useEffect, useState } from "react";
import OwnerSwitch from "@/components/owner-switch";
import { usePathname, useRouter } from "next/navigation";
import { secureApi } from "@/lib/secure-api-client";
import { dict } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";
import { PHONE_E164 as PHONE, whatsappHref } from "@/lib/public-contact";

type HeaderUser = { id: string; name: string; email: string; role: string };

const WHATSAPP = whatsappHref("Hi NISE COMPORT, I need help with a service.");

export default function SiteHeader() {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const locale = useLocale();
  const t = dict(locale).nav;
  const [user, setUser] = useState<HeaderUser | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPath, setMenuPath] = useState(pathname);

  // Close the mobile menu after navigation.
  if (menuPath !== pathname) { setMenuPath(pathname); setMenuOpen(false); }

  useEffect(() => {
    let active = true;
    secureApi<{ user: HeaderUser | null }>("C4w7G2hN6kP9")
      .then((result) => { if (active) setUser(result.user); })
      .catch(() => undefined)
      .finally(() => { if (active) setSessionLoaded(true); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setMenuOpen(false); };
    document.documentElement.classList.add("no-scroll");
    window.addEventListener("keydown", onKey);
    return () => { document.documentElement.classList.remove("no-scroll"); window.removeEventListener("keydown", onKey); };
  }, [menuOpen]);

  async function signOut() {
    setSigningOut(true);
    try { await secureApi("R6y0D3sJ8vM2"); } catch { /* the session may already be gone */ }
    setUser(null);
    setSigningOut(false);
    setMenuOpen(false);
    router.refresh();
  }

  const home = locale === "en" ? "/" : `/${locale}`;
  const links = [
    { href: "/services", label: t.services },
    { href: "/offers", label: t.offers, live: true },
    { href: "/gallery", label: t.gallery },
    { href: "/blog", label: t.guides },
    { href: "/contact", label: t.contact },
  ];
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const firstName = user?.name.trim().split(/\s+/)[0] ?? "";

  return <>
    <OfferTicker locale={locale}/>
    <header className="site-header">
      <div className="container nav-wrap">
        <Link className="brand" href={home} aria-label="NISE COMPORT home"><BrandWordmark/></Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          {links.map((link) => <Link key={link.href} href={link.href} className={isActive(link.href) ? "is-active" : undefined} aria-current={isActive(link.href) ? "page" : undefined}>{link.label}{link.live && <i className="live-dot" aria-hidden="true"/>}</Link>)}
        </nav>
        <div className="nav-actions">
          <LanguageMenu locale={locale} label={t.changeLanguage} compact/>
          {!sessionLoaded ? <span className="nav-placeholder" aria-hidden="true"/> : user
            ? <>
              <Link className="account-chip" href="/profile" title={t.myProfile}><span className="account-avatar">{firstName.slice(0, 1).toUpperCase() || <UserRound size={16}/>}</span><span className="account-name">{firstName || t.myProfile}</span></Link>
              {user.role === "admin" ? <OwnerSwitch/> : null}
              <button className="icon-btn nav-signout" type="button" onClick={() => void signOut()} disabled={signingOut} title={t.signOut} aria-label={t.signOut}><LogOut size={18}/></button>
            </>
            : <Link className="nav-signin" href="/login">{t.signIn}</Link>}
          <Link className="btn btn--primary btn--sm nav-cta" href="/request">{t.startRequest}<ArrowRight size={16}/></Link>
          <button className="menu-toggle" type="button" aria-expanded={menuOpen} aria-controls="mobile-sheet" onClick={() => setMenuOpen((value) => !value)}>
            {menuOpen ? <X size={22}/> : <Menu size={22}/>}<span className="sr-only">{menuOpen ? t.close : t.menu}</span>
          </button>
        </div>
      </div>
    </header>
    <div id="mobile-sheet" className={menuOpen ? "mobile-sheet is-open" : "mobile-sheet"} hidden={!menuOpen}>
      <div className="mobile-sheet__backdrop" onClick={() => setMenuOpen(false)}/>
      <nav className="mobile-sheet__panel" aria-label="Mobile navigation">
        <div className="mobile-sheet__top"><Link className="brand" href={home}><BrandWordmark/></Link><button className="icon-btn" type="button" onClick={() => setMenuOpen(false)} aria-label={t.close}><X size={22}/></button></div>
        <div className="mobile-sheet__links">
          {[{ href: home, label: t.home }, ...links, { href: "/about", label: t.about }, { href: "/areas-we-serve", label: t.areas }, { href: "/faq", label: t.faq }, { href: "/pan", label: t.pan }].map((link, index) => <Link key={link.href} href={link.href} style={{ animationDelay: `${index * 30}ms` }}>{link.label}<ArrowRight size={18}/></Link>)}
        </div>
        <div className="mobile-sheet__lang"><span>{t.changeLanguage}</span><LanguageMenu locale={locale} label={t.changeLanguage} inline/></div>
        <div className="mobile-sheet__actions">
          <Link className="btn btn--primary btn--block" href="/request">{t.startRequest}<ArrowRight size={18}/></Link>
          {sessionLoaded && user
            ? <div className="mobile-sheet__row"><Link className="btn btn--ghost" href="/profile"><UserRound size={18}/>{t.myProfile}</Link><button className="btn btn--ghost" type="button" onClick={() => void signOut()} disabled={signingOut}><LogOut size={18}/>{signingOut ? t.signingOut : t.signOut}</button></div>
            : <Link className="btn btn--ghost btn--block" href="/login">{t.signIn}</Link>}
          <div className="mobile-sheet__row"><a className="btn btn--wa" href={WHATSAPP} target="_blank" rel="noopener noreferrer"><WhatsAppIcon/>{t.whatsapp}</a><a className="btn btn--ghost" href={`tel:${PHONE}`}><Phone size={18}/>{t.call}</a></div>
        </div>
      </nav>
    </div>
  </>;
}
