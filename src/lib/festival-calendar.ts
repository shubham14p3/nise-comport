/**
 * Reads Google's public "Holidays in India" calendar and finds our festivals in it.
 *
 * The feed is plain iCalendar (RFC 5545). It is fetched on the server by the daily offers sync
 * (/api/cron/offers); visitors' browsers never contact Google for it.
 *
 * This file only imports from other plain modules so it can be unit-tested with Node.
 */
import { FESTIVALS, type FestivalDef } from "./festivals.ts";

export const GOOGLE_HOLIDAYS_ICS = "https://calendar.google.com/calendar/ical/en.indian%23holiday%40group.v.calendar.google.com/public/basic.ics";

export type IcsEvent = { uid: string; summary: string; date: string; description: string };

/** Undoes RFC 5545 text escaping. */
function unescapeText(value: string) {
  return value.replace(/\\([\\;,nN])/g, (_, char: string) => (char === "n" || char === "N" ? "\n" : char)).trim();
}

/**
 * Parses VEVENTs from an iCalendar file. Handles folded lines, all-day dates
 * (DTSTART;VALUE=DATE:20261108) and date-times (DTSTART:20261108T000000Z → 2026-11-08).
 */
export function parseIcs(text: string): IcsEvent[] {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const unfolded: string[] = [];
  for (const line of lines) {
    if ((line.startsWith(" ") || line.startsWith("\t")) && unfolded.length) unfolded[unfolded.length - 1] += line.slice(1);
    else unfolded.push(line);
  }
  const events: IcsEvent[] = [];
  let current: Partial<IcsEvent> | null = null;
  for (const line of unfolded) {
    if (line === "BEGIN:VEVENT") { current = {}; continue; }
    if (line === "END:VEVENT") {
      if (current?.date && current.summary) events.push({ uid: current.uid ?? "", summary: current.summary, date: current.date, description: current.description ?? "" });
      current = null;
      continue;
    }
    if (!current) continue;
    const colon = line.indexOf(":");
    if (colon < 0) continue;
    const name = line.slice(0, colon).split(";")[0].toUpperCase();
    const value = line.slice(colon + 1);
    if (name === "DTSTART") {
      const match = /^(\d{4})(\d{2})(\d{2})/.exec(value);
      if (match) current.date = `${match[1]}-${match[2]}-${match[3]}`;
    } else if (name === "SUMMARY") current.summary = unescapeText(value);
    else if (name === "DESCRIPTION") current.description = unescapeText(value);
    else if (name === "UID") current.uid = value.trim();
  }
  return events;
}

/** Festival keys and dates found in the feed. One event can match more than one festival. */
export function matchFestivals(events: IcsEvent[], defs: FestivalDef[] = FESTIVALS) {
  const found: { key: string; date: string; title: string }[] = [];
  for (const event of events) {
    const month = Number(event.date.slice(5, 7));
    for (const def of defs) {
      if (def.months && !def.months.includes(month)) continue;
      if (def.match.some((pattern) => pattern.test(event.summary))) found.push({ key: def.key, date: event.date, title: event.summary });
    }
  }
  return found;
}

type FetchLike = (url: string, init?: { signal?: AbortSignal; headers?: Record<string, string>; cache?: "no-store" }) => Promise<{ ok: boolean; status: number; text(): Promise<string> }>;

/**
 * Downloads and parses the Google holiday feed. Returns an empty list (never throws) when the
 * feed can't be reached, so the fallback dates in festivals.ts are used instead.
 */
export async function fetchHolidayFeed(fetchImpl: FetchLike = fetch as unknown as FetchLike, url = GOOGLE_HOLIDAYS_ICS, timeoutMs = 10_000) {
  try {
    const response = await fetchImpl(url, { signal: AbortSignal.timeout(timeoutMs), headers: { accept: "text/calendar" }, cache: "no-store" });
    if (!response.ok) return { ok: false as const, status: response.status, events: [] as IcsEvent[] };
    const text = await response.text();
    if (!text.includes("BEGIN:VCALENDAR")) return { ok: false as const, status: response.status, events: [] as IcsEvent[] };
    return { ok: true as const, status: response.status, events: parseIcs(text) };
  } catch {
    return { ok: false as const, status: 0, events: [] as IcsEvent[] };
  }
}
