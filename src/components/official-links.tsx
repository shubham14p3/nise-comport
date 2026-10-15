"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ExternalLink, PhoneCall, ShieldCheck, X } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons";
import { fillText, OFFICIAL_TEXT as T } from "@/lib/i18n-forms";
import { WHATSAPP_NUMBER } from "@/lib/public-contact";
import { secureApi } from "@/lib/secure-api-client";
import { useLocale } from "@/lib/use-locale";

type Link = { label: string; href: string };
type Service = { slug: string; title: string; documents: string[] };

const validPhone = (value: string) => /^(\+?91[\s-]?|0)?[6-9]\d{4}[\s-]?\d{5}$/.test(value.trim());

/**
 * Official links with a choice: clicking one first offers "get it done by us" (documents needed
 * + name and number → call-back in Admin → Inbox), with a plain "No thanks, open the site" option.
 * The box above the links opens the same form without leaving.
 */
export default function OfficialLinks({ links, service, variant = "cards" }: { links: Link[]; service: Service; variant?: "cards" | "list" }) {
  const locale = useLocale();
  const L = (text: Record<"en" | "hi" | "bn", string>) => text[locale];
  const [open, setOpen] = useState<{ link: Link | null } | null>(null);

  const show = (link: Link | null) => (event?: { preventDefault(): void }) => { event?.preventDefault(); setOpen({ link }); };

  return <>
    <div className="do-it-for-you">
      <ShieldCheck size={22}/>
      <div><b>{L(T.boxTitle)}</b><p>{L(T.boxText)}</p></div>
      <button type="button" className="btn btn--primary btn--sm" onClick={show(null)}><PhoneCall size={16}/>{L(T.boxButton)}</button>
    </div>
    {variant === "cards"
      ? <div className="link-list">{links.map((link) => <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer external" onClick={show(link)}><span>{link.label}</span><ExternalLink size={18}/></a>)}</div>
      : <ul className="official-link-list">{links.map((link) => <li key={link.href}><a href={link.href} target="_blank" rel="noopener noreferrer external" onClick={show(link)}>{link.label} <ExternalLink size={13}/></a></li>)}</ul>}
    {open && <HelpDialog service={service} link={open.link} onClose={() => setOpen(null)} L={L}/>}
  </>;
}

function HelpDialog({ service, link, onClose, L }: { service: Service; link: Link | null; onClose: () => void; L: (text: Record<"en" | "hi" | "bn", string>) => string }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const nameBad = tried && name.trim().length < 2;
  const phoneBad = tried && !validPhone(phone);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.documentElement.classList.add("no-scroll");
    window.addEventListener("keydown", onKey);
    return () => { document.documentElement.classList.remove("no-scroll"); window.removeEventListener("keydown", onKey); };
  }, [onClose]);

  async function send(event: FormEvent) {
    event.preventDefault(); setTried(true); setError("");
    if (name.trim().length < 2 || !validPhone(phone)) return;
    setBusy(true);
    try {
      // Sent in English for the shop; the customer's own note is kept as typed.
      await secureApi("Q3n7B1xK5vR8", {
        name: name.trim(), phone: phone.trim(), topic: `Get it done: ${service.title}`.slice(0, 120),
        message: [note.trim(), link ? `(Was opening the official site: ${link.label})` : ""].filter(Boolean).join(" ").slice(0, 800) || undefined,
        page: typeof window === "undefined" ? undefined : window.location.pathname, source: "form",
      });
      setDone(true);
    } catch { setError(L(T.errSend)); } finally { setBusy(false); }
  }

  const wa = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hi NISE COMPORT, please help me with ${service.title}.${name.trim() ? ` My name is ${name.trim()}.` : ""}`)}`;
  return <div className="help-dialog" role="dialog" aria-modal="true" aria-labelledby="help-dialog-title" onClick={onClose}>
    <div className="help-dialog__card" onClick={(event) => event.stopPropagation()}>
      <button type="button" className="icon-btn help-dialog__close" aria-label={L(T.close)} onClick={onClose}><X size={20}/></button>
      <h2 id="help-dialog-title">{fillText(L(T.dialogTitle), { service: service.title })}</h2>
      {link && <p className="muted">{fillText(L(T.leaving), { site: link.label })}</p>}
      {service.documents.length > 0 && <div className="help-dialog__docs"><b>{L(T.docs)}</b><ol>{service.documents.map((item) => <li key={item}>{item}</li>)}</ol></div>}
      {done ? <p className="alert alert--success" role="status">{fillText(L(T.thanks), { name: name.trim().split(/\s+/)[0], phone: phone.trim() })}</p>
        : <form className="help-dialog__form" onSubmit={send} noValidate>
          <label className="field"><span className="field__label">{L(T.name)}</span><input value={name} onChange={(event) => setName(event.target.value.replace(/[^\p{L}\p{M}\s.'-]/gu, ""))} autoComplete="name" maxLength={80} aria-invalid={nameBad}/>{nameBad && <span className="field__error">{L(T.errName)}</span>}</label>
          <label className="field"><span className="field__label">{L(T.phone)}</span><input value={phone} onChange={(event) => setPhone(event.target.value.replace(/[^\d\s+-]/g, "").slice(0, 16))} inputMode="tel" autoComplete="tel" placeholder="98765 43210" aria-invalid={phoneBad}/>{phoneBad && <span className="field__error">{L(T.errPhone)}</span>}</label>
          <label className="field"><span className="field__label">{L(T.note)}</span><input value={note} onChange={(event) => setNote(event.target.value)} maxLength={300}/></label>
          <p className="field__hint">{L(T.privacy)}</p>
          {error && <p className="alert alert--error" role="alert">{error}</p>}
          <button className="btn btn--primary btn--block" disabled={busy}><PhoneCall size={17}/>{busy ? L(T.sending) : L(T.send)}</button>
        </form>}
      <div className="help-dialog__more">
        <a className="btn btn--wa btn--sm" href={wa} target="_blank" rel="noopener noreferrer"><WhatsAppIcon size={16}/>{L(T.whatsapp)}</a>
        {link && <a className="text-link" href={link.href} target="_blank" rel="noopener noreferrer external" onClick={onClose}>{fillText(L(T.continue), { site: link.label })} ↗</a>}
      </div>
    </div>
  </div>;
}
