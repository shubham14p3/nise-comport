"use client";
import { useSyncExternalStore } from "react";
import { formatTime12h, openState, type OpeningHoursRule } from "@/lib/hours";

function subscribe(callback: () => void) {
  const timer = window.setInterval(callback, 60_000);
  return () => window.clearInterval(timer);
}
/** Current minute; stable within a minute so React doesn't re-render needlessly. */
const minuteSnapshot = () => Math.floor(Date.now() / 60_000);
const serverSnapshot = () => null;

/** "Open now · closes 7 pm" badge, calculated in India time in the visitor's browser. */
export default function OpenStatus({ rules, language = "en" }: { rules: OpeningHoursRule[]; language?: "en" | "hi" | "bn" }) {
  const minute = useSyncExternalStore(subscribe, minuteSnapshot, serverSnapshot);
  if (minute === null || !rules.length) return null;
  const state = openState(rules, new Date(minute * 60_000));
  const time = (value: string) => formatTime12h(value);
  const text = language === "hi"
    ? state.open ? `अभी खुला है · ${time(state.closesAt)} बजे बंद होगा` : state.nextOpen ? `अभी बंद है · ${time(state.nextOpen.time)} बजे खुलेगा` : "अभी बंद है"
    : language === "bn"
      ? state.open ? `এখন খোলা · ${time(state.closesAt)}-এ বন্ধ হবে` : state.nextOpen ? `এখন বন্ধ · ${time(state.nextOpen.time)}-এ খুলবে` : "এখন বন্ধ"
      : state.open ? `Open now · closes ${time(state.closesAt)}` : state.nextOpen ? `Closed now · opens ${state.nextOpen.dayName} at ${time(state.nextOpen.time)}` : "Closed now";
  return <span className={`open-status ${state.open ? "is-open" : "is-closed"}`} role="status"><i aria-hidden="true"/>{text}</span>;
}
