"use client";

import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import CopyCode from "@/components/copy-code";
import { useCode } from "@/components/offers-provider";
import type { Locale } from "@/lib/i18n";

const UNLOCK = { en: "Sign in to unlock", hi: "देखने के लिए साइन इन करें", bn: "দেখতে সাইন ইন করুন" };

/** The code itself (or XXXXXX) with Copy, or an unlock button for visitors. */
export function CodeValue({ code, masked, locale, copyClass }: { code: string; masked?: boolean; locale: Locale; copyClass: string }) {
  const shown = useCode(code, masked);
  return <>
    <b className={shown.locked ? "code-locked" : undefined}>{shown.text}</b>
    {shown.locked
      ? <button type="button" className={`${copyClass} code-unlock`} onClick={shown.openGate}><Lock size={13} aria-hidden="true"/> {UNLOCK[locale]}</button>
      : <CopyCode text={shown.text} locale={locale} className={copyClass}/>}
  </>;
}

/** Just the text, for lists. */
export function CodeText({ code, masked }: { code: string; masked?: boolean }) {
  return <>{useCode(code, masked).text}</>;
}

/** "Use now": goes to the request flow with the real code, or opens the sign-in pop-up for visitors. */
export function UseNowButton({ code, masked, className, label }: { code: string; masked?: boolean; className: string; label: string }) {
  const shown = useCode(code, masked);
  if (shown.locked) return <button type="button" className={className} onClick={shown.openGate}>{label}<ArrowRight size={16}/></button>;
  return <Link className={className} href={`/request?coupon=${encodeURIComponent(shown.text)}`}>{label}<ArrowRight size={16}/></Link>;
}
