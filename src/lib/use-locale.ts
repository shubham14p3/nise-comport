"use client";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { isAppPath, isLocale, LANG_COOKIE, localeFromPath, type Locale } from "@/lib/i18n";

const EVENT = "nc-lang-change";

function readCookie(): Locale | null {
  try {
    const match = document.cookie.split("; ").find((part) => part.startsWith(`${LANG_COOKIE}=`));
    const value = match?.slice(LANG_COOKIE.length + 1);
    return isLocale(value) ? value : null;
  } catch { return null; }
}

function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback);
  return () => window.removeEventListener(EVENT, callback);
}

/** Remembers the visitor's language for a year (a preference cookie, not tracking). */
export function setPreferredLocale(locale: Locale) {
  try { document.cookie = `${LANG_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`; } catch { /* cookies blocked: ignore */ }
  window.dispatchEvent(new Event(EVENT));
}

/**
 * Current interface language. Content pages follow their URL (/, /hi, /bn) so text and page
 * content always match; app screens (sign-in, profile, request flows) follow the saved choice.
 */
export function useLocale(): Locale {
  const pathname = usePathname() ?? "/";
  const preferred = useSyncExternalStore(subscribe, readCookie, () => null);
  const fromPath = localeFromPath(pathname);
  if (fromPath !== "en") return fromPath;
  if (isAppPath(pathname) && preferred) return preferred;
  return "en";
}
