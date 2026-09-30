"use client";
import Link from "next/link";
import { useEffect } from "react";

/** Shown when a page fails to render. The customer can retry; nothing technical is displayed. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("[page error]", error.digest ?? error.message); }, [error]);
  return <main className="content-page"><section className="content-hero"><div className="container">
    <span className="eyebrow eyebrow-muted">SOMETHING WENT WRONG</span>
    <h1>This page didn’t load.<br/><em>Please try again.</em></h1>
    <p>It’s usually temporary. If it keeps happening, call +91 97712 19893 or WhatsApp us.{error.digest ? ` Reference: ${error.digest}` : ""}</p>
    <div className="service-hero-actions"><button type="button" className="button button-green" onClick={() => reset()}>Try again</button><Link className="button button-outline" href="/">Go to the home page</Link></div>
  </div></section></main>;
}
