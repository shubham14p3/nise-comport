import { test } from "node:test";
import assert from "node:assert/strict";
import { indiaClock, openState, parseOpeningHours, summarizeHours, toOpeningHoursSpecification, weeklyTable } from "../src/lib/hours.ts";

const rules = parseOpeningHours("Mo-Sa 10:00-19:00; Su 10:00-13:00");

test("opening hours text is parsed and summarised", () => {
  assert.deepEqual(rules[0].days, ["Mo", "Tu", "We", "Th", "Fr", "Sa"]);
  assert.deepEqual(summarizeHours(rules), ["Mon–Sat: 10 am – 7 pm", "Sun: 10 am – 1 pm"]);
  assert.deepEqual(summarizeHours(parseOpeningHours("Mo-Fr 09:30-18:00")), ["Mon–Fri: 9:30 am – 6 pm", "Sat–Sun: closed"]);
  assert.equal(weeklyTable(rules).length, 7);
  assert.equal(toOpeningHoursSpecification(rules)[0].dayOfWeek.length, 6);
  assert.deepEqual(parseOpeningHours("Sa-Mo 10:00-12:00")[0].days, ["Sa", "Su", "Mo"]);
});

test("bad hours text is rejected instead of guessed", () => {
  for (const bad of ["Monday 10-7", "Mo-Sa 19:00-10:00", "Xx 10:00-12:00", "Mo 25:00-26:00"]) assert.throws(() => parseOpeningHours(bad), bad);
});

test("open/closed is calculated in India time", () => {
  assert.deepEqual(indiaClock(new Date("2026-09-30T04:30:00Z")), { day: "We", time: "10:00" });
  assert.deepEqual(openState(rules, new Date("2026-09-30T05:00:00Z")), { open: true, closesAt: "19:00" });
  const evening = openState(rules, new Date("2026-09-30T14:00:00Z"));
  assert.equal(evening.open, false);
  assert.equal(evening.open === false && evening.nextOpen?.dayName, "tomorrow");
  const early = openState(rules, new Date("2026-09-30T02:00:00Z"));
  assert.equal(early.open === false && early.nextOpen?.dayName, "today");
  const sundayNight = openState(rules, new Date("2026-10-04T10:00:00Z"));
  assert.equal(sundayNight.open === false && sundayNight.nextOpen?.day, "Mo");
  assert.deepEqual(openState([], new Date()), { open: false, nextOpen: null });
});
