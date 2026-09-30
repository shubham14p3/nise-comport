/**
 * Opening hours in the schema.org "openingHours" text format, e.g.
 *   "Mo-Sa 10:00-19:00"            (Monday to Saturday)
 *   "Mo-Fr 10:00-19:00; Sa 10:00-14:00"
 *   "Mo,We,Fr 09:30-18:00"
 * Days not listed are closed. All times are India Standard Time (Asia/Kolkata).
 * This file has no imports so it can be unit-tested with plain Node.
 */
export const DAY_CODES = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"] as const;
export type DayCode = (typeof DAY_CODES)[number];
export type OpeningHoursRule = { days: DayCode[]; opens: string; closes: string };

const SCHEMA_DAY: Record<DayCode, string> = { Mo: "Monday", Tu: "Tuesday", We: "Wednesday", Th: "Thursday", Fr: "Friday", Sa: "Saturday", Su: "Sunday" };
const HINDI_DAY: Record<DayCode, string> = { Mo: "सोमवार", Tu: "मंगलवार", We: "बुधवार", Th: "गुरुवार", Fr: "शुक्रवार", Sa: "शनिवार", Su: "रविवार" };

function expandDays(token: string): DayCode[] {
  const days: DayCode[] = [];
  for (const part of token.split(",")) {
    const [start, end] = part.split("-").map((value) => value.trim()) as [string, string | undefined];
    const from = DAY_CODES.indexOf(start as DayCode);
    if (from < 0) throw new Error(`Unknown day "${start}" in opening hours.`);
    if (!end) { days.push(DAY_CODES[from]); continue; }
    const to = DAY_CODES.indexOf(end as DayCode);
    if (to < 0) throw new Error(`Unknown day "${end}" in opening hours.`);
    for (let index = from; ; index = (index + 1) % 7) {
      days.push(DAY_CODES[index]);
      if (index === to) break;
    }
  }
  return [...new Set(days)];
}

function validTime(value: string) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  return Boolean(match);
}

export function parseOpeningHours(text: string): OpeningHoursRule[] {
  const rules: OpeningHoursRule[] = [];
  for (const chunk of text.split(";").map((value) => value.trim()).filter(Boolean)) {
    const match = /^([A-Za-z,\- ]+?)\s+(\d{2}:\d{2})-(\d{2}:\d{2})$/.exec(chunk);
    if (!match) throw new Error(`Could not read opening hours "${chunk}". Use a format like "Mo-Sa 10:00-19:00".`);
    const [, dayToken, opens, closes] = match;
    if (!validTime(opens) || !validTime(closes)) throw new Error(`Invalid time in "${chunk}".`);
    if (opens >= closes) throw new Error(`Opening time must be before closing time in "${chunk}".`);
    rules.push({ days: expandDays(dayToken.replace(/\s+/g, "")), opens, closes });
  }
  return rules;
}

export function hoursForDay(rules: OpeningHoursRule[], day: DayCode) {
  return rules.filter((rule) => rule.days.includes(day)).map(({ opens, closes }) => ({ opens, closes })).sort((a, b) => a.opens.localeCompare(b.opens));
}

/** One row per weekday, for a visible hours table. */
export function weeklyTable(rules: OpeningHoursRule[]) {
  return DAY_CODES.map((day) => ({ day, english: SCHEMA_DAY[day], hindi: HINDI_DAY[day], slots: hoursForDay(rules, day) }));
}

/** schema.org OpeningHoursSpecification entries for LocalBusiness structured data. */
export function toOpeningHoursSpecification(rules: OpeningHoursRule[]) {
  return rules.map((rule) => ({
    "@type": "OpeningHoursSpecification",
    dayOfWeek: rule.days.map((day) => `https://schema.org/${SCHEMA_DAY[day]}`),
    opens: rule.opens,
    closes: rule.closes,
  }));
}

/** Day code and "HH:MM" for a moment in India Standard Time (UTC+05:30, no daylight saving). */
export function indiaClock(date: Date) {
  const shifted = new Date(date.getTime() + 330 * 60_000);
  const jsDay = shifted.getUTCDay(); // 0 = Sunday
  const day = DAY_CODES[(jsDay + 6) % 7];
  const time = `${String(shifted.getUTCHours()).padStart(2, "0")}:${String(shifted.getUTCMinutes()).padStart(2, "0")}`;
  return { day, time };
}

export type OpenState = { open: true; closesAt: string } | { open: false; nextOpen: { day: DayCode; time: string; dayName: string } | null };

export function openState(rules: OpeningHoursRule[], now: Date): OpenState {
  const { day, time } = indiaClock(now);
  const today = hoursForDay(rules, day);
  const current = today.find((slot) => slot.opens <= time && time < slot.closes);
  if (current) return { open: true, closesAt: current.closes };
  const laterToday = today.find((slot) => slot.opens > time);
  if (laterToday) return { open: false, nextOpen: { day, time: laterToday.opens, dayName: "today" } };
  const start = DAY_CODES.indexOf(day);
  for (let offset = 1; offset <= 7; offset++) {
    const next = DAY_CODES[(start + offset) % 7];
    const slots = hoursForDay(rules, next);
    if (slots.length) return { open: false, nextOpen: { day: next, time: slots[0].opens, dayName: offset === 1 ? "tomorrow" : SCHEMA_DAY[next] } };
  }
  return { open: false, nextOpen: null };
}

export function formatTime12h(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  const suffix = hours >= 12 ? "pm" : "am";
  const hour = hours % 12 === 0 ? 12 : hours % 12;
  return minutes ? `${hour}:${String(minutes).padStart(2, "0")} ${suffix}` : `${hour} ${suffix}`;
}

const SHORT_EN: Record<DayCode, string> = { Mo: "Mon", Tu: "Tue", We: "Wed", Th: "Thu", Fr: "Fri", Sa: "Sat", Su: "Sun" };
const SHORT_HI: Record<DayCode, string> = { Mo: "सोम", Tu: "मंगल", We: "बुध", Th: "गुरु", Fr: "शुक्र", Sa: "शनि", Su: "रवि" };

/** Groups consecutive days with identical hours: ["Mon–Sat: 10 am – 7 pm", "Sun: closed"]. */
export function summarizeHours(rules: OpeningHoursRule[], language: "en" | "hi" = "en") {
  const names = language === "hi" ? SHORT_HI : SHORT_EN;
  const closed = language === "hi" ? "बंद" : "closed";
  const rows = DAY_CODES.map((day) => ({ day, text: hoursForDay(rules, day).map((slot) => `${formatTime12h(slot.opens)} – ${formatTime12h(slot.closes)}`).join(", ") || closed }));
  const groups: { from: DayCode; to: DayCode; text: string }[] = [];
  for (const row of rows) {
    const last = groups[groups.length - 1];
    if (last && last.text === row.text) last.to = row.day;
    else groups.push({ from: row.day, to: row.day, text: row.text });
  }
  return groups.map((group) => `${names[group.from]}${group.from === group.to ? "" : `–${names[group.to]}`}: ${group.text}`);
}
