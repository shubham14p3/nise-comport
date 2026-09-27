"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BrandWordmark from "@/components/brand-wordmark";
import { ArrowRight, Check, Clock3, LogOut, ShieldCheck } from "lucide-react";

export default function DemoProfile() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function signOut() {
    setBusy(true);
    await fetch("/api/auth/session", { method: "DELETE" });
    router.push("/");
    router.refresh();
  }
  return <main className="profile-page"><div className="container profile-container"><header className="demo-profile-header"><Link className="brand" href="/"><BrandWordmark/></Link><button className="profile-logout" onClick={signOut} disabled={busy}><LogOut size={15}/>{busy ? "Signing out…" : "Sign out"}</button></header><div className="demo-mode-banner"><ShieldCheck size={16}/><span><b>Local demo account</b><small>Preview data only. Requests, uploads and profile edits are not saved.</small></span></div><div className="profile-greeting"><div><span className="eyebrow eyebrow-muted">CUSTOMER ACCOUNT · DEMO</span><h1>Good to see you, <em>Shubham.</em></h1><p>This sample profile shows where customer activity will appear.</p></div></div><section className="demo-request-card"><div className="request-icon"><Clock3 size={18}/></div><div><span className="eyebrow eyebrow-muted">SAMPLE REQUEST · NC-DEMO-001</span><h2>PAN application assistance</h2><p>Submitted today · The service team will review your details.</p></div><span className="request-status status-submitted"><i/>In review</span></section><div className="demo-profile-actions"><Link className="button button-green" href="/services">Browse services <ArrowRight size={15}/></Link><Link className="button button-dark" href="/print">Explore print options <ArrowRight size={15}/></Link></div><p className="profile-footnote"><Check size={14}/> Real sign-up, OTP, file upload and request tracking require PostgreSQL and SMTP configuration.</p></div></main>;
}
