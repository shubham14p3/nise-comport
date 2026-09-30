"use client";

import Link from "next/link";
import BrandWordmark from "@/components/brand-wordmark";
import { ArrowUpRight, LogOut, Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type HeaderUser = { id: string; name: string; email: string; role: string };

export default function SiteHeader() {
  const router = useRouter();
  const [user, setUser] = useState<HeaderUser | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/session", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json();
        if (active && response.ok) setUser(result.user);
      })
      .catch(() => undefined)
      .finally(() => { if (active) setSessionLoaded(true); });
    return () => { active = false; };
  }, []);

  async function signOut() {
    setSigningOut(true);
    await fetch("/api/auth/session", { method: "DELETE" });
    setUser(null);
    setSigningOut(false);
    router.refresh();
  }

  const accountLinks = sessionLoaded ? user ? <>
    <Link className="button button-dark nav-cta" href="/profile">My profile <ArrowUpRight size={16}/></Link>
    <button className="header-signout" type="button" onClick={signOut} disabled={signingOut}><LogOut size={15}/>{signingOut ? "Signing out…" : "Sign out"}</button>
  </> : <Link className="login-link" href="/login">Sign in</Link> : <span className="header-session-placeholder" aria-hidden="true"/>;

  return <header className="site-header"><div className="container nav-wrap">
    <Link className="brand" href="/" aria-label="NISE COMPORT home"><BrandWordmark/></Link>
    <nav className="desktop-nav" aria-label="Main navigation"><Link href="/services">Services</Link><Link href="/pan">PAN help</Link><Link href="/blog">Guides</Link><Link href="/print">Print</Link><Link href="/offers">Offers</Link><Link href="/contact">Contact</Link><Link href="/hi" hrefLang="hi-IN" lang="hi">हिन्दी</Link></nav>
    <div className="nav-actions">{accountLinks}<details className="mobile-nav-menu"><summary className="mobile-menu" aria-label="Open menu"><Menu size={21}/><span>Menu</span></summary><nav aria-label="Mobile navigation"><Link href="/services">All services</Link><Link href="/print">Print &amp; scan</Link><Link href="/offers">Offers &amp; vouchers</Link><Link href="/blog">Local guides</Link><Link href="/areas-we-serve">Areas we serve</Link><Link href="/gallery">Gallery</Link><Link href="/social">Social updates</Link><Link href="/team">Our team</Link><Link href="/contact">Contact</Link><Link href="/hi" hrefLang="hi-IN" lang="hi">हिन्दी</Link>{sessionLoaded && user ? <><Link href="/profile">My profile</Link><button type="button" onClick={signOut} disabled={signingOut}>Sign out</button></> : sessionLoaded ? <Link href="/login">Sign in</Link> : null}<Link href="/faq">FAQs</Link></nav></details></div>
  </div></header>;
}
