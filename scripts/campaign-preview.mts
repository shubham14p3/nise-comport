#!/usr/bin/env node
/**
 * Shows when a WhatsApp campaign's messages would go out, without sending anything.
 *   npm run campaign:preview                       25 messages, default pacing (10 per round, 10–30 min, 10/day)
 *   npm run campaign:preview -- 40 --daily 40      40 messages, up to 40 a day
 *   npm run campaign:preview -- 12 --batch 5 --gap 15-45 --window 10-19
 */
import { clampPacing, DEFAULT_PACING, simulateCampaign } from "../src/lib/campaign-pacing.ts";

const args = process.argv.slice(2);
const flag = (name: string) => { const index = args.indexOf(`--${name}`); return index >= 0 ? args[index + 1] : undefined; };
const total = Number(args.find((arg) => /^\d+$/.test(arg)) ?? 25);
const [gapMin, gapMax] = (flag("gap") ?? "").split("-").map(Number);
const [windowStart, windowEnd] = (flag("window") ?? "").split("-").map(Number);
const pacing = clampPacing({
  ...DEFAULT_PACING,
  ...(flag("batch") ? { batchSize: Number(flag("batch")) } : {}),
  ...(gapMin ? { gapMinMinutes: gapMin, gapMaxMinutes: gapMax || gapMin } : {}),
  ...(flag("daily") ? { dailyLimit: Number(flag("daily")) } : {}),
  ...(windowStart ? { windowStart, windowEnd: windowEnd || DEFAULT_PACING.windowEnd } : {}),
});
const sends = simulateCampaign(total, new Date(), pacing);
const ist = (date: Date) => date.toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Asia/Kolkata" });
console.log(`Pacing: up to ${pacing.batchSize} per round, ${pacing.gapMinMinutes}–${pacing.gapMaxMinutes} min between rounds (+0–59 s), max ${pacing.dailyLimit}/day, ${pacing.windowStart}:00–${pacing.windowEnd}:00 IST\n`);
let round = 0;
let previous: Date | null = null;
for (const send of sends) {
  if (send.round !== round) {
    round = send.round;
    const gap = previous ? ` (after a ${Math.round((send.at.getTime() - previous.getTime()) / 60_000)} min gap)` : "";
    console.log(`Round ${round}${gap}`);
  }
  console.log(`  ${ist(send.at)}`);
  previous = send.at;
}
console.log(`\n${sends.length} messages in ${round} rounds; last one ${sends.length ? ist(sends[sends.length - 1].at) : "-"}.`);
