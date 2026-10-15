import { Banknote, Check, Printer, ShieldCheck, Sparkles } from "lucide-react";
import type { Offer } from "@/lib/offers";

/**
 * Illustrated phone mock-up for the home hero: a request tracker with floating service cards.
 * Pure HTML/CSS (no image download), decorative only.
 */
export default function HeroVisual({ offer }: { offer?: Offer }) {
  return <div className="hero-art" aria-hidden="true">
    <span className="hero-art__ring hero-art__ring--1"/>
    <span className="hero-art__ring hero-art__ring--2"/>
    <div className="phone">
      <span className="phone__notch"/>
      <div className="phone__screen">
        <div className="phone__top"><span className="phone__logo">N</span><b>My requests</b><span className="phone__dot"/></div>
        <div className="req-card">
          <div className="req-card__head"><small>NC-24817</small><span className="status-pill status-pill--progress">In progress</span></div>
          <b>Income certificate</b>
          <ol className="mini-timeline">
            <li className="is-done"><i><Check size={10}/></i>Request received</li>
            <li className="is-done"><i><Check size={10}/></i>Documents checked</li>
            <li className="is-active"><i/>Filed on portal</li>
            <li><i/>Ready to collect</li>
          </ol>
        </div>
        <div className="req-card req-card--row"><span className="mini-icon tone-blue"><ShieldCheck size={15}/></span><div><b>Bike insurance</b><small>Renewal quote shared</small></div><span className="status-pill status-pill--done">Done</span></div>
        <div className="req-card req-card--row"><span className="mini-icon tone-violet"><Printer size={15}/></span><div><b>Print · 12 pages</b><small>Ready for pickup</small></div><span className="status-pill status-pill--done">Ready</span></div>
        <div className="phone__cta">+ New request</div>
      </div>
    </div>
    {offer && <div className="float-card float-card--offer"><span className="badge badge--live"><i/>LIVE</span><b>{offer.highlight.en}</b><small>{offer.title.en}</small></div>}
    <div className="float-card float-card--aeps"><span className="mini-icon tone-green"><Banknote size={16}/></span><div><b>AEPS withdrawal</b><small>At our banking point</small></div></div>
    <div className="float-card float-card--lang"><Sparkles size={15}/><span>English · हिन्दी · বাংলা</span></div>
  </div>;
}
