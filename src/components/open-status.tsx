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
export default function OpenStatus({ rules, language = "en" }: { rules: OpeningHoursRule[]; language?: "en" | "hi" }) {
  const minute = useSyncExternalStore(subscribe, minuteSnapshot, serverSnapshot);
  if (minute === null || !rules.length) return null;
  const state = openState(rules, new Date(minute * 60_000));
  const hi = language === "hi";
  const text = state.open
    ? hi ? `अभी खुला है · ${formatTime12h(state.closesAt)} बजे बंद होगा` : `Open now · closes ${formatTime12h(state.closesAt)}`
    : state.nextOpen
      ? hi ? `अभी बंद है · ${formatTime12h(state.nextOpen.time)} बजे खुलेगा` : `Closed now · opens ${state.nextOpen.dayName} at ${formatTime12h(state.nextOpen.time)}`
      : hi ? "अभी बंद है" : "Closed now";
  return <span className={`open-status ${state.open ? "is-open" : "is-closed"}`} role="status"><i aria-hidden="true"/>{text}</span>;
}
