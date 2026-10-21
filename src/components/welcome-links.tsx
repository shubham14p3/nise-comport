"use client";

import { useEffect, useState } from "react";
import { Mail, MessageCircle, Gift } from "lucide-react";

type Device = "ios" | "android" | "desktop";
type Props = { source?: string; email: string; subject: string; body: string; waHref: string; loginHref: string };

function detect(): Device {
  const ua = navigator.userAgent;
  // iPadOS and recent iPhones can report as a Mac, so touch support tells them apart from a real Mac.
  if (/iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

/** One page for every phone and computer: the right "email us" button is picked from the device, WhatsApp and sign-in are the same everywhere. */
export default function WelcomeLinks({ source = "qr", email, subject, body, waHref, loginHref }: Props) {
  const [device, setDevice] = useState<Device>("android");
  const count = (kind: Device, action?: string) => {
    try { navigator.sendBeacon("/api/qr-scan", new Blob([JSON.stringify({ source, device: kind, action })], { type: "application/json" })); } catch { /* counting is optional */ }
  };
  useEffect(() => {
    const kind = detect();
    setDevice(kind);
    try { if (sessionStorage.getItem("qr-counted")) return; sessionStorage.setItem("qr-counted", "1"); } catch { /* count anyway */ }
    count(kind);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const q = `subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  const mailto = `mailto:${email}?${q}`;
  const gmailWeb = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&${q}`;
  const gmailApp = `googlegmail:///co?to=${encodeURIComponent(email)}&${q}`;

  function openGmailApp(event: React.MouseEvent) {
    event.preventDefault();
    // If the Gmail app is not installed nothing happens, so fall back to the phone's own mail app.
    const timer = window.setTimeout(() => { window.location.href = mailto; }, 1200);
    document.addEventListener("visibilitychange", () => window.clearTimeout(timer), { once: true });
    window.location.href = gmailApp;
  }

  return <div className="welcome__actions">
    <a className="btn btn--primary" href={waHref} onClick={() => count(device, "whatsapp")} target="_blank" rel="noopener noreferrer"><MessageCircle size={18}/>WhatsApp us</a>
    {device === "ios" && <a className="btn btn--ghost" href={gmailApp} onClick={(event) => { count(device, "gmail"); openGmailApp(event); }}><Mail size={18}/>Email us in Gmail</a>}
    {device === "desktop" && <a className="btn btn--ghost" href={gmailWeb} onClick={() => count(device, "gmail")} target="_blank" rel="noopener noreferrer"><Mail size={18}/>Email us in Gmail</a>}
    <a className="btn btn--ghost" href={mailto} onClick={() => count(device, "email")}><Mail size={18}/>{device === "android" ? "Email us" : "Email us (Mail app)"}</a>
    <a className="btn btn--ghost" href={loginHref} onClick={() => count(device, "login")}><Gift size={18}/>Sign in · ₹50 welcome balance</a>
  </div>;
}
