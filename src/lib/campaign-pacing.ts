/**
 * How fast a WhatsApp campaign goes out.
 *
 * - A "round" sends at most `batchSize` messages (never more than 10), spaced 25–90 seconds apart.
 * - After a round, the next one starts after a random gap between `gapMinMinutes` and
 *   `gapMaxMinutes` (default 10–30), plus up to a minute of extra variation.
 * - No more than `dailyLimit` messages per India-time day, and only between `windowStart` and
 *   `windowEnd` (default 09:00–20:00 IST). Outside the window the next round waits for the
 *   next morning (plus a random 0–20 minutes).
 *
 * Plain module (no imports) so it can be unit-tested and used by the dry-run script.
 */
export type Pacing = { batchSize: number; gapMinMinutes: number; gapMaxMinutes: number; dailyLimit: number; windowStart: number; windowEnd: number };

export const MAX_BATCH = 10;
export const DEFAULT_PACING: Pacing = { batchSize: 10, gapMinMinutes: 10, gapMaxMinutes: 30, dailyLimit: 10, windowStart: 9, windowEnd: 20 };

const MINUTE = 60_000;
const IST_OFFSET = 5.5 * 60 * MINUTE;
const clampInt = (value: unknown, min: number, max: number, fallback: number) => {
  const number = Math.round(Number(value));
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
};

/** Keeps settings inside safe limits (batch ≤ 10, gaps 1–480 min, window inside the day). */
export function clampPacing(input: Partial<Pacing>): Pacing {
  const batchSize = clampInt(input.batchSize, 1, MAX_BATCH, DEFAULT_PACING.batchSize);
  const gapMinMinutes = clampInt(input.gapMinMinutes, 1, 480, DEFAULT_PACING.gapMinMinutes);
  const gapMaxMinutes = Math.max(gapMinMinutes, clampInt(input.gapMaxMinutes, 1, 480, DEFAULT_PACING.gapMaxMinutes));
  const dailyLimit = clampInt(input.dailyLimit, 1, 500, DEFAULT_PACING.dailyLimit);
  let windowStart = clampInt(input.windowStart, 0, 23, DEFAULT_PACING.windowStart);
  let windowEnd = clampInt(input.windowEnd, 1, 24, DEFAULT_PACING.windowEnd);
  if (windowEnd <= windowStart) { windowStart = DEFAULT_PACING.windowStart; windowEnd = DEFAULT_PACING.windowEnd; }
  return { batchSize, gapMinMinutes, gapMaxMinutes, dailyLimit, windowStart, windowEnd };
}

/** Hour of the day in India (fractional, e.g. 9.5 = 09:30). */
export function istHour(moment: Date) {
  const shifted = new Date(moment.getTime() + IST_OFFSET);
  return shifted.getUTCHours() + shifted.getUTCMinutes() / 60;
}

/** Midnight India time at the start of `moment`'s India-time day. */
export function istDayStartOf(moment: Date) {
  const shifted = new Date(moment.getTime() + IST_OFFSET);
  return new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()) - IST_OFFSET);
}

export function inSendingWindow(moment: Date, pacing: Pacing) {
  const hour = istHour(moment);
  return hour >= pacing.windowStart && hour < pacing.windowEnd;
}

/** The next time the sending window opens (today if it hasn't opened yet, else tomorrow), plus 0–20 min. */
export function nextWindowOpen(moment: Date, pacing: Pacing, random: () => number = Math.random) {
  const dayStart = istDayStartOf(moment);
  let open = new Date(dayStart.getTime() + pacing.windowStart * 60 * MINUTE);
  if (open.getTime() <= moment.getTime()) open = new Date(open.getTime() + 24 * 60 * MINUTE);
  return new Date(open.getTime() + Math.floor(random() * 20 * MINUTE));
}

/** Random wait before the next round: gapMin–gapMax minutes plus 0–59 seconds. */
export function nextGapMs(pacing: Pacing, random: () => number = Math.random) {
  const minutes = pacing.gapMinMinutes + random() * (pacing.gapMaxMinutes - pacing.gapMinMinutes);
  return Math.round(minutes * MINUTE + Math.floor(random() * 60) * 1000);
}

/** Spacing between two messages of the same round: 25–90 seconds. */
export function messageSpacingMs(random: () => number = Math.random) {
  return Math.round((25 + random() * 65) * 1000);
}

export type RoundPlan =
  | { kind: "send"; times: Date[]; nextRoundAt: Date }
  | { kind: "wait"; nextRoundAt: Date; reason: "outside-window" | "daily-limit" }
  | { kind: "done" };

/**
 * Decides what a campaign does now. `pending` = messages still waiting; `sentToday` = messages
 * already scheduled or sent since midnight India time.
 */
export function planRound(input: { now: Date; pacing: Pacing; pending: number; sentToday: number; random?: () => number }): RoundPlan {
  const { now, pacing, pending, sentToday } = input;
  const random = input.random ?? Math.random;
  if (pending <= 0) return { kind: "done" };
  if (!inSendingWindow(now, pacing)) return { kind: "wait", nextRoundAt: nextWindowOpen(now, pacing, random), reason: "outside-window" };
  const allowance = pacing.dailyLimit - sentToday;
  if (allowance <= 0) return { kind: "wait", nextRoundAt: nextWindowOpen(new Date(istDayStartOf(now).getTime() + 24 * 60 * MINUTE - 1), pacing, random), reason: "daily-limit" };
  const count = Math.min(pacing.batchSize, allowance, pending);
  const times: Date[] = [];
  let cursor = now.getTime();
  const windowClose = istDayStartOf(now).getTime() + pacing.windowEnd * 60 * MINUTE;
  for (let index = 0; index < count; index++) {
    if (index > 0) cursor += messageSpacingMs(random);
    if (cursor >= windowClose) break;
    times.push(new Date(cursor));
  }
  return { kind: "send", times, nextRoundAt: new Date(cursor + nextGapMs(pacing, random)) };
}

/** Simulates a whole campaign (for the dry-run script and tests). */
export function simulateCampaign(total: number, start: Date, pacing: Pacing, random: () => number = Math.random) {
  const sends: { at: Date; round: number }[] = [];
  let now = start;
  let round = 0;
  for (let guard = 0; guard < 10_000 && sends.length < total; guard++) {
    const dayStart = istDayStartOf(now).getTime();
    const sentToday = sends.filter((send) => send.at.getTime() >= dayStart && send.at.getTime() < dayStart + 24 * 60 * MINUTE).length;
    const plan = planRound({ now, pacing, pending: total - sends.length, sentToday, random });
    if (plan.kind === "done") break;
    if (plan.kind === "send") { round++; for (const at of plan.times) sends.push({ at, round }); }
    now = plan.nextRoundAt;
  }
  return sends;
}
