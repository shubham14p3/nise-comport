"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowRight, CircleCheck, FileText, MapPin, MessageCircle, Phone, PhoneCall, RotateCcw, Send, Sparkles, X } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons";
import OpenStatus from "@/components/open-status";
import type { OpeningHoursRule } from "@/lib/hours";
import { dict, type Dictionary, type Locale } from "@/lib/i18n";
import { useLiveCodes } from "@/components/offers-provider";
import { liveOffers } from "@/lib/offers";
import { useLocale } from "@/lib/use-locale";
import { findGuide, findVariant, HELP_GUIDES, type HelpGuide } from "@/lib/help-docs";
import { secureApi } from "@/lib/secure-api-client";

export type ChatService = { slug: string; title: string; category: string; keywords: string[] };
type TopicId = keyof Dictionary["chat"]["topics"];
type Action = { label: string; href: string; kind: "link" | "wa" | "tel" | "external" };
type Message = { id: number; from: "bot" | "user"; text: string; actions?: Action[]; chips?: boolean; services?: ChatService[]; visit?: boolean; guide?: { id: string; variant: string }; guideList?: boolean; callback?: boolean };

/** What each quick topic links to. */
const TOPIC_LINKS: Record<TopicId, { details?: string; request?: string }> = {
  pan: { details: "/pan", request: "/pan/request" },
  aadhaar: { details: "/services/aadhaar-assistance-jamshedpur", request: "/request?service=aadhaar-assistance-jamshedpur" },
  certificates: { details: "/services/jharkhand-certificates-jamshedpur", request: "/request?service=jharkhand-certificates-jamshedpur" },
  banking: { details: "/services/banking", request: "/request?category=banking" },
  offers: { details: "/offers" },
  insurance: { details: "/services/insurance", request: "/request?category=insurance" },
  print: { details: "/services/printing-scanning-jamshedpur", request: "/print" },
  bills: { details: "/services/fee-bill-recharge-jamshedpur", request: "/request?service=fee-bill-recharge-jamshedpur" },
  forms: { details: "/services/education", request: "/request?category=education" },
  track: { details: "/profile#requests" },
  visit: {},
  human: {},
};

/** Words (English, Hindi, Bengali, common spellings) that point to a topic. */
const TOPIC_WORDS: Record<TopicId, string[]> = {
  pan: ["pan", "pan card", "पैन", "প্যান"],
  aadhaar: ["aadhaar", "aadhar", "adhar", "uidai", "आधार", "আধার"],
  certificates: ["certificate", "income", "caste", "residence", "ews", "domicile", "birth", "death", "प्रमाण", "जाति", "आय", "निवास", "সার্টিফিকেট", "শংসাপত্র", "জাতি", "আয়"],
  banking: ["bank", "aeps", "withdraw", "cash", "transfer", "money", "account", "बैंक", "पैसा", "ব্যাংক", "টাকা"],
  offers: ["offer", "offers", "coupon", "promo", "discount", "deal", "festival", "diwali", "ऑफ़र", "ऑफर", "छूट", "कूपन", "অফার", "ছাড়", "কুপন"],
  insurance: ["insurance", "bima", "policy", "bike", "car", "health", "life", "lic", "बीमा", "বিমা"],
  print: ["print", "xerox", "photocopy", "scan", "प्रिंट", "फोटोकॉपी", "প্রিন্ট", "জেরক্স"],
  bills: ["bill", "recharge", "electricity", "dth", "fee", "बिल", "रिचार्ज", "বিল", "রিচার্জ"],
  forms: ["exam", "form", "job", "scholarship", "admission", "recruitment", "परीक्षा", "फॉर्म", "फ़ॉर्म", "नौकरी", "পরীক্ষা", "ফর্ম", "চাকরি"],
  track: ["track", "status", "reference", "my request", "ट्रैक", "स्टेटस", "ট্র্যাক"],
  visit: ["where", "address", "location", "timing", "time", "open", "close", "directions", "map", "कहाँ", "पता", "समय", "কোথায়", "ঠিকানা", "সময়"],
  human: ["human", "person", "agent", "talk", "call", "whatsapp", "बात", "কথা"],
};

const TOPICS = Object.keys(TOPIC_WORDS) as TopicId[];

function waLink(number: string, text: string) {
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

function normalise(text: string) {
  return text.toLowerCase().normalize("NFC").replace(/[^\p{L}\p{M}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
}

function matchTopic(text: string): TopicId | null {
  const clean = ` ${normalise(text)} `;
  let best: TopicId | null = null; let bestScore = 0;
  for (const topic of TOPICS) {
    const score = TOPIC_WORDS[topic].reduce((total, word) => total + (clean.includes(` ${word} `) || (word.length > 3 && clean.includes(word)) ? word.length : 0), 0);
    if (score > bestScore) { best = topic; bestScore = score; }
  }
  return best;
}

function matchServices(text: string, services: ChatService[]) {
  const words = normalise(text).split(" ").filter((word) => word.length > 2);
  if (!words.length) return [];
  return services
    .map((service) => {
      const haystack = normalise(`${service.title} ${service.keywords.join(" ")}`);
      return { service, score: words.reduce((total, word) => total + (haystack.includes(word) ? 1 : 0), 0) };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((item) => item.service);
}

/** A mobile number typed into the chat ("call me on 98765 43210"). */
function phoneIn(text: string) {
  const match = text.match(/(?:\+?91[\s-]?|0)?([6-9]\d{4})[\s-]?(\d{5})(?!\d)/);
  return match ? `${match[1]}${match[2]}` : null;
}

let messageSeq = 0;
const newId = () => ++messageSeq;

type PanelProps = { locale: Locale; whatsapp: string; phone: string; mapsUrl: string; hours: OpeningHoursRule[]; services: ChatService[]; onClose: () => void };

export default function ChatWidget({ whatsapp, phone, mapsUrl, hours, services }: { whatsapp: string; phone: string; mapsUrl: string; hours: OpeningHoursRule[]; services: ChatService[] }) {
  const pathname = usePathname() ?? "/";
  const locale = useLocale();
  const t = dict(locale).chat;
  const [open, setOpen] = useState(false);
  const [teaser, setTeaser] = useState(false);

  useEffect(() => {
    let seen = false;
    try { seen = sessionStorage.getItem("nc-chat-teaser") === "1"; } catch { /* storage blocked */ }
    if (seen) return;
    const timer = window.setTimeout(() => setTeaser(true), 6000);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (pathname.startsWith("/admin")) return null;

  function dismissTeaser() {
    setTeaser(false);
    try { sessionStorage.setItem("nc-chat-teaser", "1"); } catch { /* storage blocked */ }
  }

  function toggle() {
    setOpen((value) => !value);
    dismissTeaser();
  }

  return <div className={open ? "chat is-open" : "chat"}>
    {teaser && !open && <div className="chat__teaser" role="status"><button type="button" className="chat__teaser-close" onClick={dismissTeaser} aria-label={t.close}><X size={14}/></button><button type="button" className="chat__teaser-body" onClick={toggle}><Sparkles size={16}/> {t.greeting}</button></div>}
    {open && <ChatPanel key={locale} locale={locale} whatsapp={whatsapp} phone={phone} mapsUrl={mapsUrl} hours={hours} services={services} onClose={() => setOpen(false)}/>}
    <button type="button" className="chat__launcher" onClick={toggle} aria-expanded={open} aria-label={open ? t.close : t.open}>
      {open ? <X size={26}/> : <MessageCircle size={26}/>}
      {!open && <i className="chat__ping" aria-hidden="true"/>}
    </button>
  </div>;
}

function greeting(t: Dictionary["chat"]): Message[] {
  return [{ id: newId(), from: "bot", text: t.greeting }, { id: newId(), from: "bot", text: t.pick, chips: true }];
}

/** The conversation. Keyed by language, so switching language restarts it in that language. */
function ChatPanel({ locale, whatsapp, phone, mapsUrl, hours, services, onClose }: PanelProps) {
  const t = dict(locale).chat;
  const codes = useLiveCodes();
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const [context, setContext] = useState("");
  const [messages, setMessages] = useState<Message[]>(() => greeting(t));
  const scroller = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  useEffect(() => {
    const pending = timers.current;
    return () => { pending.forEach((timer) => window.clearTimeout(timer)); };
  }, []);

  function botSay(message: Omit<Message, "id" | "from">) {
    setTyping(true);
    const timer = window.setTimeout(() => {
      setTyping(false);
      setMessages((list) => [...list, { id: newId(), from: "bot", ...message }]);
    }, 550);
    timers.current.push(timer);
  }

  function answerTopic(topic: TopicId, userText?: string) {
    const info = t.topics[topic];
    const links = TOPIC_LINKS[topic];
    setMessages((list) => [...list, { id: newId(), from: "user", text: userText ?? info.label }]);
    setContext(userText ?? info.label);
    const actions: Action[] = [];
    if (links.details) actions.push({ label: topic === "track" ? dict(locale).nav.track : t.viewDetails, href: links.details, kind: "link" });
    if (links.request) actions.push({ label: t.startRequest, href: links.request, kind: "link" });
    if (topic === "visit") { actions.push({ label: t.directions, href: mapsUrl, kind: "external" }); actions.push({ label: t.callUs, href: `tel:${phone}`, kind: "tel" }); }
    actions.push({ label: t.continueWa, href: waLink(whatsapp, `${t.waPrefix} ${userText ?? info.label}`), kind: "wa" });
    let text = info.answer;
    if (topic === "insurance") {
      const offer = liveOffers(undefined, codes).find((item) => item.categories !== "all" && item.categories.includes("insurance"));
      if (offer) text += ` 🎉 ${offer.highlight[locale]}: ${offer.ticker[locale]}.`;
    }
    if (topic === "offers") {
      text += codes.length ? `\n${codes.slice(0, 5).map((item) => `${item.emoji ?? "🎉"} ${item.code} · ${item.title[locale]}`).join("\n")}` : " —";
    }
    botSay({ text, actions, visit: topic === "visit" });
  }

  function guideActions(guide: HelpGuide, label: string): Action[] {
    const actions: Action[] = [];
    if (guide.service) actions.push({ label: t.startRequest, href: `/request?service=${guide.service}`, kind: "link" });
    actions.push({ label: t.continueWa, href: waLink(whatsapp, `${t.waPrefix} ${label}`), kind: "wa" });
    actions.push({ label: t.callUs, href: `tel:${phone}`, kind: "tel" });
    return actions;
  }

  function showGuide(guide: HelpGuide, variantId: string, userText?: string) {
    const variant = guide.variants.find((item) => item.id === variantId) ?? guide.variants[0];
    const label = guide.variants.length > 1 ? `${guide.title[locale]} · ${variant.label[locale]}` : guide.title[locale];
    setMessages((list) => [...list, { id: newId(), from: "user", text: userText ?? label }]);
    setContext(label);
    botSay({ text: `${t.docsFor} ${label}`, guide: { id: guide.id, variant: variant.id }, actions: guideActions(guide, label) });
  }

  function askDocs() {
    setMessages((list) => [...list, { id: newId(), from: "user", text: t.docsLabel }]);
    botSay({ text: t.docsPick, guideList: true });
  }

  function askCallback() {
    setMessages((list) => [...list, { id: newId(), from: "user", text: t.callbackLabel }]);
    botSay({ text: t.callbackAsk, callback: true });
  }

  async function sendLead(details: { name?: string; phone: string; message?: string }) {
    try {
      await secureApi("Q3n7B1xK5vR8", { name: details.name ?? "", phone: details.phone, topic: context || "Chat enquiry", message: details.message ?? "", page: window.location.pathname, locale, source: "chat" });
      const pretty = details.phone.replace(/^(\d{5})(\d{5})$/, "$1 $2");
      botSay({ text: t.callbackThanks.replace("{name}", details.name ? `, ${details.name}` : "").replace("{phone}", pretty), actions: [{ label: t.continueWa, href: waLink(whatsapp, `${t.waPrefix} ${context || "…"}`), kind: "wa" }] });
      return true;
    } catch (reason) {
      botSay({ text: reason instanceof Error && reason.message ? reason.message : t.callbackError });
      return false;
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const text = input.trim().slice(0, 400);
    if (!text) return;
    setInput("");
    const number = phoneIn(text);
    if (number) {
      setMessages((list) => [...list, { id: newId(), from: "user", text }]);
      void sendLead({ phone: number, message: text });
      return;
    }
    const guide = findGuide(text);
    if (guide) { showGuide(guide, findVariant(guide, text).id, text); return; }
    const topic = matchTopic(text);
    if (topic) { answerTopic(topic, text); return; }
    setMessages((list) => [...list, { id: newId(), from: "user", text }]);
    setContext(text);
    const found = matchServices(text, services);
    if (found.length) botSay({ text: t.matches, services: found, actions: [{ label: t.continueWa, href: waLink(whatsapp, `${t.waPrefix} ${text}`), kind: "wa" }] });
    else botSay({ text: t.noMatch, callback: true, actions: [{ label: t.continueWa, href: waLink(whatsapp, `${t.waPrefix} ${text}`), kind: "wa" }, { label: t.callUs, href: `tel:${phone}`, kind: "tel" }] });
  }

  function restart() {
    setMessages(greeting(t));
    setContext("");
  }

  return <section className="chat__panel" role="dialog" aria-label={t.title}>
    <header className="chat__head">
      <span className="chat__avatar" aria-hidden="true"><Sparkles size={20}/></span>
      <div><strong>{t.title}</strong><small><i className="live-dot"/> {t.status}</small></div>
      <button type="button" className="icon-btn" onClick={restart} aria-label={t.restart} title={t.restart}><RotateCcw size={18}/></button>
      <button type="button" className="icon-btn" onClick={onClose} aria-label={t.close}><X size={20}/></button>
    </header>
    <div className="chat__body" ref={scroller} aria-live="polite">
      {messages.map((message) => <div key={message.id} className={`chat__msg chat__msg--${message.from}`}>
        <p>{message.text}</p>
        {message.visit && <div className="chat__visit"><MapPin size={15}/><OpenStatus rules={hours} language={locale}/></div>}
        {message.services && <div className="chat__services">{message.services.map((service) => <Link key={service.slug} href={`/services/${service.slug}`} onClick={onClose}><span>{service.title}</span><ArrowRight size={15}/></Link>)}</div>}
        {message.chips && <div className="chat__chips">
          <button type="button" className="chat__chip--main" onClick={askDocs}><FileText size={14}/>{t.docsLabel}</button>
          <button type="button" className="chat__chip--main" onClick={askCallback}><PhoneCall size={14}/>{t.callbackLabel}</button>
          {TOPICS.map((topic) => <button key={topic} type="button" onClick={() => answerTopic(topic)}>{t.topics[topic].label}</button>)}
        </div>}
        {message.guideList && <div className="chat__chips">{HELP_GUIDES.map((guide) => <button key={guide.id} type="button" onClick={() => showGuide(guide, guide.variants[0].id)}>{guide.title[locale]}</button>)}</div>}
        {message.guide && <GuideCard guideId={message.guide.id} variantId={message.guide.variant} locale={locale} t={t} onVariant={(guide, variant) => showGuide(guide, variant)}/>}
        {message.callback && <CallbackForm t={t} onSend={sendLead}/>}
        {message.actions && <div className="chat__actions">{message.actions.map((action) => action.kind === "link"
          ? <Link key={action.label} href={action.href} className="chat__action" onClick={onClose}>{action.label}<ArrowRight size={14}/></Link>
          : <a key={action.label} href={action.href} className={action.kind === "wa" ? "chat__action chat__action--wa" : "chat__action"} {...(action.kind === "tel" ? {} : { target: "_blank", rel: "noopener noreferrer" })}>{action.kind === "wa" ? <WhatsAppIcon size={15}/> : action.kind === "tel" ? <Phone size={14}/> : <MapPin size={14}/>}{action.label}</a>)}</div>}
      </div>)}
      {typing && <div className="chat__msg chat__msg--bot chat__typing" aria-label="…"><i/><i/><i/></div>}
    </div>
    <form className="chat__input" onSubmit={submit}>
      <input value={input} onChange={(event) => setInput(event.target.value)} placeholder={t.placeholder} maxLength={400} aria-label={t.placeholder}/>
      <button type="submit" className="icon-btn icon-btn--primary" aria-label={t.send} disabled={!input.trim()}><Send size={18}/></button>
    </form>
    <a className="chat__wa" href={waLink(whatsapp, context ? `${t.waPrefix} ${context}` : `${t.waPrefix} …`)} target="_blank" rel="noopener noreferrer"><WhatsAppIcon size={18}/>{t.continueWa}</a>
  </section>;
}

function GuideCard({ guideId, variantId, locale, t, onVariant }: { guideId: string; variantId: string; locale: Locale; t: Dictionary["chat"]; onVariant: (guide: HelpGuide, variant: string) => void }) {
  const guide = HELP_GUIDES.find((item) => item.id === guideId);
  if (!guide) return null;
  const variant = guide.variants.find((item) => item.id === variantId) ?? guide.variants[0];
  const others = guide.variants.filter((item) => item.id !== variant.id);
  return <div className="chat__guide">
    <p className="chat__guide-intro">{guide.intro}</p>
    {variant.sections.map((section) => <div key={section.heading} className="chat__guide-section">
      <b>{section.heading}</b>
      <ul>{section.items.map((item) => <li key={item}><CircleCheck size={13}/>{item}</li>)}</ul>
      {section.note && <small>{section.note}</small>}
    </div>)}
    <small className="chat__guide-note">{t.bringNote}</small>
    {others.length > 0 && <div className="chat__guide-more"><span>{t.otherCases}</span>{others.map((item) => <button key={item.id} type="button" onClick={() => onVariant(guide, item.id)}>{item.label[locale]}</button>)}</div>}
  </div>;
}

function CallbackForm({ t, onSend }: { t: Dictionary["chat"]; onSend: (details: { name?: string; phone: string }) => Promise<boolean> }) {
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "sent" | "bad">("idle");
  if (state === "sent") return null;
  async function send(event: FormEvent) {
    event.preventDefault();
    const digits = phoneIn(number);
    if (!digits) { setState("bad"); return; }
    setState("busy");
    setState(await onSend({ name: name.trim(), phone: digits }) ? "sent" : "idle");
  }
  return <form className="chat__callback" onSubmit={send}>
    <input value={name} onChange={(event) => setName(event.target.value)} placeholder={t.namePlaceholder} maxLength={60} aria-label={t.namePlaceholder} autoComplete="name"/>
    <input value={number} onChange={(event) => { setNumber(event.target.value); if (state === "bad") setState("idle"); }} placeholder={t.phonePlaceholder} inputMode="tel" maxLength={16} aria-label={t.phonePlaceholder} autoComplete="tel" required/>
    {state === "bad" && <small role="alert">{t.callbackError}</small>}
    <button type="submit" className="chat__action chat__action--wa" disabled={state === "busy"}><Phone size={14}/>{t.callbackSend}</button>
  </form>;
}
