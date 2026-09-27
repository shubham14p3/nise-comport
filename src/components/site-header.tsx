import Link from "next/link";
import BrandWordmark from "@/components/brand-wordmark";
import { ArrowUpRight, Menu } from "lucide-react";

export default function SiteHeader() {
  return <header className="site-header"><div className="container nav-wrap"><Link className="brand" href="/" aria-label="NISE COMPORT home"><BrandWordmark/></Link><nav className="desktop-nav" aria-label="Main navigation"><Link href="/services">Services</Link><Link href="/gallery">Gallery</Link><Link href="/offers">Offers</Link><Link href="/blog">Guides</Link><Link href="/social">Social</Link><Link href="/contact">Contact</Link></nav><div className="nav-actions"><Link className="login-link" href="/login">Sign in</Link><Link className="button button-dark nav-cta" href="/profile">My profile <ArrowUpRight size={16}/></Link><details className="mobile-nav-menu"><summary className="mobile-menu" aria-label="Open menu"><Menu size={21}/><span>Menu</span></summary><nav aria-label="Mobile navigation"><Link href="/services">Services</Link><Link href="/gallery">Gallery</Link><Link href="/offers">Offers &amp; vouchers</Link><Link href="/blog">Local guides</Link><Link href="/social">Social updates</Link><Link href="/team">Our team</Link><Link href="/contact">Contact</Link><Link href="/profile">My profile</Link><Link href="/faq">FAQs</Link></nav></details></div></div></header>;
}
