"use client";

import VerifyPrompt from "@/components/verify-prompt";
import Link from "next/link";
import BrandWordmark from "@/components/brand-wordmark";
import LanguageMenu from "@/components/language-menu";
import OfferTicker from "@/components/offer-ticker";
import dynamic from "next/dynamic";
const ServicesMegaDesktop = dynamic(() => import("@/components/services-mega-menu").then((mod) => mod.ServicesMegaDesktop));
const ServicesMegaMobile = dynamic(() => import("@/components/services-mega-menu").then((mod) => mod.ServicesMegaMobile));
import { WhatsAppIcon } from "@/components/icons";
import { ArrowRight, LayoutDashboard, LogOut, Menu, Phone, Search, ShieldCheck, UserRound, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { secureApi } from "@/lib/secure-api-client";
import { getSessionUser, invalidateSessionCache, SESSION_CHANGED, type SessionUser } from "@/lib/session-client";
import { dict } from "@/lib/i18n";
import { lp, tr } from "@/lib/tr";
import { useLocale } from "@/lib/use-locale";
import { PHONE_E164 as PHONE, whatsappHref } from "@/lib/public-contact";
import { isStaffRole, STAFF_HOME } from "@/lib/staff-routes";

type HeaderUser = SessionUser;

// Only the name and role are remembered in this browser (never the email or id), so the account button can appear
// straight away on the next visit while the real sign-in check runs. The server decides whether it is still valid.
const REMEMBER_KEY = "nc-header-user";
const rememberListeners = new Set<() => void>();
function subscribeRemembered(callback: () => void) {
  rememberListeners.add(callback);
  window.addEventListener("storage", callback);
  return () => { rememberListeners.delete(callback); window.removeEventListener("storage", callback); };
}
function rememberedSnapshot() { try { return window.localStorage.getItem(REMEMBER_KEY); } catch { return null; } }
function parseRemembered(raw: string | null): HeaderUser | null {
  try {
    const value = JSON.parse(raw ?? "null") as { name?: unknown; role?: unknown } | null;
    return value && typeof value.name === "string" && typeof value.role === "string" ? { id: "", email: "", name: value.name.slice(0, 80), role: value.role.slice(0, 20) } : null;
  } catch { return null; }
}
function remember(user: HeaderUser | null) {
  const next = user ? JSON.stringify({ name: user.name, role: user.role }) : null;
  try {
    if (window.localStorage.getItem(REMEMBER_KEY) === next) return;
    if (next) window.localStorage.setItem(REMEMBER_KEY, next);
    else window.localStorage.removeItem(REMEMBER_KEY);
  } catch { /* storage can be blocked */ }
  rememberListeners.forEach((callback) => callback());
}

const WHATSAPP = whatsappHref("Hi NISE COMPORT, I need help with a service.");

export default function SiteHeader() {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const locale = useLocale();
  const t = dict(locale).nav;
  const [user, setUser] = useState<HeaderUser | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [verifying, setVerifying] = useState(true);
  // The remembered account (null on the server and during hydration, so nothing mismatches), shown until the server confirms.
  const rememberedRaw = useSyncExternalStore(subscribeRemembered, rememberedSnapshot, () => null);
  const remembered = useMemo(() => parseRemembered(rememberedRaw), [rememberedRaw]);
  const [signingOut, setSigningOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPath, setMenuPath] = useState(pathname);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const [mobileQuery, setMobileQuery] = useState("");

  function submitMobileSearch(event: FormEvent) {
    event.preventDefault();
    const value = mobileQuery.trim();
    setMenuOpen(false);
    router.push(value ? `${lp(locale, "/services")}?q=${encodeURIComponent(value)}` : lp(locale, "/services"));
  }

  // Close the mobile menu after navigation.
  if (menuPath !== pathname) { setMenuPath(pathname); setMenuOpen(false); }

  useEffect(() => {
    let active = true;
    const load = () => {
      getSessionUser()
        .then((next) => { if (active) { setUser(next); remember(next); } })
        .catch(() => undefined)
        .finally(() => { if (active) { setSessionLoaded(true); setVerifying(false); } });
    };
    load();

    // Login/logout changes the session explicitly. Ordinary navigation uses
    // the in-memory cache, avoiding a fresh network request on every page.
    window.addEventListener(SESSION_CHANGED, load);
    const onOtherTab = (event: StorageEvent) => {
      if (event.key !== REMEMBER_KEY) return;
      invalidateSessionCache(false);
      load();
    };
    window.addEventListener("storage", onOtherTab);
    return () => {
      active = false;
      window.removeEventListener(SESSION_CHANGED, load);
      window.removeEventListener("storage", onOtherTab);
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setMenuOpen(false); };
    document.documentElement.classList.add("no-scroll");
    window.addEventListener("keydown", onKey);
    return () => { document.documentElement.classList.remove("no-scroll"); window.removeEventListener("keydown", onKey); };
  }, [menuOpen]);

  // Close the account menu on outside click or Escape, and after navigation.
  useEffect(() => { queueMicrotask(() => setAccountOpen(false)); }, [pathname]);
  useEffect(() => {
    if (!accountOpen) return;
    const onPointer = (event: MouseEvent) => { if (!accountRef.current?.contains(event.target as Node)) setAccountOpen(false); };
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setAccountOpen(false); };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onPointer); document.removeEventListener("keydown", onKey); };
  }, [accountOpen]);

  async function signOut() {
    setSigningOut(true);
    try { await secureApi("R6y0D3sJ8vM2"); } catch { /* the session may already be gone */ }
    invalidateSessionCache();
    setUser(null);
    remember(null);
    setSigningOut(false);
    setMenuOpen(false);
    router.refresh();
  }

  const home = locale === "en" ? "/" : `/${locale}`;
  const tt = tr(locale);
  const links = [
    { href: lp(locale, "/services"), label: t.services },
    { href: "/offers", label: t.offers, live: true },
    { href: lp(locale, "/gallery"), label: t.gallery },
    { href: lp(locale, "/blog"), label: t.guides },
    { href: lp(locale, "/contact"), label: t.contact },
  ];
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const isServicesLink = (href: string) => href === lp(locale, "/services");
  // Until the server answers, the remembered account (if any) is shown, so the button doesn't flash from empty to a name.
  const account = user ?? (verifying ? remembered : null);
  const loaded = sessionLoaded || (verifying && remembered !== null);
  const firstName = account?.name.trim().split(/\s+/)[0] ?? "";

  return <>
    <VerifyPrompt signedIn={user?.role === "customer"}/>
    <OfferTicker locale={locale}/>
    <header className="site-header">
      <div className="container nav-wrap">
        <Link prefetch={false} className="brand" href={home} aria-label="NISE COMPORT home"><BrandWordmark/></Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          {links.map((link) => isServicesLink(link.href)
            ? <ServicesMegaDesktop key={link.href} label={link.label} active={isActive(link.href)}/>
            : <Link prefetch={false} key={link.href} href={link.href} className={isActive(link.href) ? "is-active" : undefined} aria-current={isActive(link.href) ? "page" : undefined}>{link.label}{link.live && <i className="live-dot" aria-hidden="true"/>}</Link>)}
        </nav>
        <div className="nav-actions">
          <LanguageMenu locale={locale} label={t.changeLanguage} compact/>
          {!loaded ? <span className="nav-skeleton" role="status" aria-label={tt("Checking sign-in…", "साइन-इन जाँच रहे हैं…", "সাইন-ইন যাচাই হচ্ছে…")}><span className="nav-skeleton__dot"/><span className="nav-skeleton__bar"/></span> : account
            ? <>
              <div className="account-menu" ref={accountRef}>
                <button className={`account-chip${verifying ? " is-verifying" : ""}`} aria-busy={verifying} type="button" aria-haspopup="menu" aria-expanded={accountOpen} onClick={() => setAccountOpen((open) => !open)} title={t.myProfile}>
                  <span className="account-avatar">{firstName.slice(0, 1).toUpperCase() || <UserRound size={16}/>}</span><span className="account-name">{firstName || t.myProfile}</span>
                </button>
                {accountOpen && <div className="account-dropdown" role="menu">
                  <Link prefetch={false} role="menuitem" href="/profile"><UserRound size={16}/>{tt("Normal view", "सामान्य व्यू", "সাধারণ ভিউ")}</Link>
                  {isStaffRole(account.role) && <Link prefetch={false} role="menuitem" href={account.role === "admin" ? `${STAFF_HOME}?view=staff` : STAFF_HOME}><LayoutDashboard size={16}/>{tt("Staff view", "स्टाफ़ व्यू", "স্টাফ ভিউ")}</Link>}
                  {account.role === "admin" && <Link prefetch={false} role="menuitem" href={STAFF_HOME}><ShieldCheck size={16}/>{tt("Admin view", "एडमिन व्यू", "অ্যাডমিন ভিউ")}</Link>}
                </div>}
              </div>
              <button className="icon-btn nav-signout" type="button" onClick={() => void signOut()} disabled={signingOut} title={t.signOut} aria-label={t.signOut}><LogOut size={18}/></button>
            </>
            : <Link prefetch={false} className="nav-signin" href="/login">{t.signIn}</Link>}
          <Link prefetch={false} className="btn btn--primary btn--sm nav-cta" href="/request">{t.startRequest}<ArrowRight size={16}/></Link>
          <button className="menu-toggle" type="button" aria-expanded={menuOpen} aria-controls="mobile-sheet" onClick={() => setMenuOpen((value) => !value)}>
            {menuOpen ? <X size={22}/> : <Menu size={22}/>}<span className="sr-only">{menuOpen ? t.close : t.menu}</span>
          </button>
        </div>
      </div>
    </header>
    <div id="mobile-sheet" className={menuOpen ? "mobile-sheet is-open" : "mobile-sheet"} hidden={!menuOpen}>
      <div className="mobile-sheet__backdrop" onClick={() => setMenuOpen(false)}/>
      <nav className="mobile-sheet__panel" aria-label="Mobile navigation">
        <div className="mobile-sheet__top"><Link prefetch={false} className="brand" href={home}><BrandWordmark/></Link><button className="icon-btn" type="button" onClick={() => setMenuOpen(false)} aria-label={t.close}><X size={22}/></button></div>
        <form role="search" className="mobile-sheet__search" onSubmit={submitMobileSearch}>
          <Search size={18} aria-hidden="true"/>
          <label className="sr-only" htmlFor="mobile-search">{tt("Search services", "सेवाएँ खोजें", "পরিষেবা খুঁজুন")}</label>
          <input id="mobile-search" type="search" value={mobileQuery} onChange={(event) => setMobileQuery(event.target.value)} placeholder={tt("Search services…", "सेवाएँ खोजें…", "পরিষেবা খুঁজুন…")} autoComplete="off" enterKeyHint="search"/>
        </form>
        <div className="mobile-sheet__links">
          {[{ href: home, label: t.home }, ...links, { href: lp(locale, "/about"), label: t.about }, { href: lp(locale, "/areas-we-serve"), label: t.areas }, { href: lp(locale, "/faq"), label: t.faq }, { href: "/track", label: tt("Track a request", "अनुरोध ट्रैक करें", "অনুরোধ ট্র্যাক করুন") }].map((link, index) => isServicesLink(link.href) ? <ServicesMegaMobile key={link.href} label={link.label}/> : <Link prefetch={false} key={link.href} href={link.href} style={{ animationDelay: `${index * 30}ms` }}>{link.label}<ArrowRight size={18}/></Link>)}
        </div>
        <div className="mobile-sheet__lang"><span>{t.changeLanguage}</span><LanguageMenu locale={locale} label={t.changeLanguage} inline/></div>
        <div className="mobile-sheet__actions">
          <Link prefetch={false} className="btn btn--primary btn--block" href="/request">{t.startRequest}<ArrowRight size={18}/></Link>
          {loaded && account && isStaffRole(account.role) && <Link prefetch={false} className="btn btn--ghost btn--block" href={account.role === "admin" ? `${STAFF_HOME}?view=staff` : STAFF_HOME}><LayoutDashboard size={18}/>{tt("Staff view", "स्टाफ़ व्यू", "স্টাফ ভিউ")}</Link>}
          {loaded && account && account.role === "admin" && <Link prefetch={false} className="btn btn--ghost btn--block" href={STAFF_HOME}><ShieldCheck size={18}/>{tt("Admin view", "एडमिन व्यू", "অ্যাডমিন ভিউ")}</Link>}
          {loaded && account
            ? <div className="mobile-sheet__row"><Link prefetch={false} className="btn btn--ghost" href="/profile"><UserRound size={18}/>{t.myProfile}</Link><button className="btn btn--ghost" type="button" onClick={() => void signOut()} disabled={signingOut}><LogOut size={18}/>{signingOut ? t.signingOut : t.signOut}</button></div>
            : <Link prefetch={false} className="btn btn--ghost btn--block" href="/login">{t.signIn}</Link>}
          <div className="mobile-sheet__row"><a className="btn btn--wa" href={WHATSAPP} target="_blank" rel="noopener noreferrer"><WhatsAppIcon/>{t.whatsapp}</a><a className="btn btn--ghost" href={`tel:${PHONE}`}><Phone size={18}/>{t.call}</a></div>
        </div>
      </nav>
    </div>
  </>;
}
