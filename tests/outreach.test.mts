import assert from "node:assert/strict";
import test from "node:test";
import {
  addDays, birthdayEmail, birthFromFields, birthFromText, daysBetween, daysUntilBirthday, DEFAULT_BIRTHDAY_TEMPLATES, DEFAULT_RENEWAL_TEMPLATES, fillText, instagramCaption, mayMessage,
  pickBirthdayTemplate, renewalEmail, renewalWhatsApp, sanitizeBirthdayTemplates, sanitizeRenewalTemplates, sanitizeSettings, vehicleFrom,
} from "../src/lib/outreach-core.ts";
import { parseWorkbook } from "../src/lib/record-import.ts";
import { consentAllows, renderMessage } from "../src/lib/campaign-text.ts";

test("dates of birth are read from common register formats and the year is dropped", () => {
  assert.deepEqual(birthFromText("12-03-1985"), { month: 3, day: 12 });
  assert.deepEqual(birthFromText("1985-03-12"), { month: 3, day: 12 });
  assert.deepEqual(birthFromText("5 Mar 1990"), { month: 3, day: 5 });
  assert.deepEqual(birthFromText("31/12/79"), { month: 12, day: 31 });
  assert.equal(birthFromText("31-02-1990"), null);
  assert.equal(birthFromText("not a date"), null);
  assert.deepEqual(birthFromFields({ Name: "A", "D.O.B": "01/02/80" }), { month: 2, day: 1 });
  assert.deepEqual(birthFromFields({ "Date of Birth": "2-7-1991" }), { month: 7, day: 2 });
  assert.equal(birthFromFields({ "Policy date": "01/02/80" }), null);
});

test("bike and car are told apart from a vehicle column, the sheet name or the row", () => {
  assert.equal(vehicleFrom({ "Vehicle Type": "Two Wheeler" }), "bike");
  assert.equal(vehicleFrom({ Make: "Maruti Swift" }), "car");
  assert.equal(vehicleFrom({ Note: "x" }, "reg.xlsx › Bike Insurance"), "bike");
  assert.equal(vehicleFrom({ Vehicle: "Splendor" }), "bike");
  assert.equal(vehicleFrom({ Name: "Ravi" }), null);
});

test("days until a birthday, including 29 February", () => {
  assert.equal(daysUntilBirthday({ month: 10, day: 19 }, "2026-10-19"), 0);
  assert.equal(daysUntilBirthday({ month: 10, day: 20 }, "2026-10-19"), 1);
  assert.equal(daysUntilBirthday({ month: 10, day: 18 }, "2026-10-19"), 364);
  assert.equal(daysUntilBirthday({ month: 2, day: 29 }, "2026-02-27"), 1);
  assert.equal(daysUntilBirthday({ month: 2, day: 29 }, "2028-02-27"), 2);
  assert.equal(addDays("2026-10-25", 7), "2026-11-01");
  assert.equal(daysBetween("2026-10-19", "2026-10-26"), 7);
});

test("birthday wishes need a YES; renewal reminders only need that nobody said STOP", () => {
  const person = (consent: string, emailConsent: string, email: string | null = "a@b.co") => ({ consent, emailConsent, email });
  assert.ok(mayMessage("birthday", "email", person("unknown", "opted_in")));
  assert.ok(!mayMessage("birthday", "email", person("opted_in", "unknown")));
  assert.ok(!mayMessage("birthday", "email", person("unknown", "opted_in", null)));
  assert.ok(mayMessage("birthday", "whatsapp", person("opted_in", "unknown")));
  assert.ok(!mayMessage("birthday", "whatsapp", person("unknown", "opted_in")));
  assert.ok(mayMessage("renewal", "whatsapp", person("unknown", "unknown")));
  assert.ok(!mayMessage("renewal", "whatsapp", person("opted_out", "opted_in")));
  assert.ok(!mayMessage("renewal", "email", person("opted_in", "opted_out")));
  assert.ok(consentAllows("birthday", "opted_in") && !consentAllows("birthday", "unknown") && !consentAllows("birthday", "opted_out"));
});

test("card and reminder templates can be added, edited and removed and are always cleaned", () => {
  assert.equal(sanitizeBirthdayTemplates(undefined).length, 6);
  assert.equal(sanitizeBirthdayTemplates([]).length, 6, "never left without a card");
  const list = sanitizeBirthdayTemplates([{ name: "Diwali", from: "#fff", to: "bad", whatsapp: { en: "Hi {name}" } }, { name: "Diwali" }, "junk"]);
  assert.equal(list.length, 2);
  assert.notEqual(list[0].id, list[1].id);
  assert.equal(list[0].to, DEFAULT_BIRTHDAY_TEMPLATES[0].to, "bad colour falls back");
  assert.equal(list[0].whatsapp.en, "Hi {name}");
  assert.equal(list[0].whatsapp.hi, DEFAULT_BIRTHDAY_TEMPLATES[0].whatsapp.hi, "missing language keeps the default");
  assert.equal(pickBirthdayTemplate(list, "deleted-one").id, list[0].id, "a deleted card falls back to the first");
  assert.equal(sanitizeBirthdayTemplates(Array.from({ length: 40 }, (_, i) => ({ name: `c${i}` }))).length, 20);
  assert.equal(sanitizeRenewalTemplates(null).length, 1);
  assert.equal(sanitizeRenewalTemplates([{ name: "Short", whatsapp: { en: "Renew {vehicle} by {date}" } }])[0].whatsapp.en, "Renew {vehicle} by {date}");
});

test("wording is filled for the person, language and vehicle", () => {
  const renewal = DEFAULT_RENEWAL_TEMPLATES[0];
  const whatsapp = renewalWhatsApp(renewal, "bike", "2026-10-26", "en", "+91 97712 19893");
  assert.ok(whatsapp.includes("bike insurance") && whatsapp.includes("26 October 2026") && whatsapp.includes("{name}") && !whatsapp.includes("{vehicle}"));
  const text = renderMessage(whatsapp, { lang: "en", kind: "renewal", name: "Ravi Kumar", phone: "x" });
  assert.ok(text.startsWith("Namaste Ravi 🙏") && text.includes("Reply STOP"));
  const mail = renewalEmail(renewal, "Ravi Kumar", "car", "2026-10-26", "hi", "98765");
  assert.ok(mail.subject.includes("कार बीमा") && mail.paragraphs.length === 3);
  for (const lang of ["en", "hi", "bn"] as const) {
    assert.ok(!/premium discount|lowest price|cheapest/i.test(renewal.whatsapp[lang] + renewal.emailBody[lang]));
    assert.equal(birthdayEmail(DEFAULT_BIRTHDAY_TEMPLATES[0], "Anita Devi", lang).paragraphs.length, 1);
    assert.ok(instagramCaption("Anita Devi", lang).includes("Anita"));
  }
  assert.equal(fillText("Hi {name}, call {phone}.", { name: "A" }), "Hi A, call.");
});

test("settings stay inside safe limits", () => {
  assert.deepEqual(sanitizeSettings({}).renewal, { enabled: false, template: "standard", daysBefore: 7, email: true, whatsapp: true });
  assert.equal(sanitizeSettings({ renewal: { daysBefore: 400 } }).renewal.daysBefore, 45);
  assert.equal(sanitizeSettings({ renewal: { daysBefore: 0 } }).renewal.daysBefore, 1);
  assert.equal(sanitizeSettings({ birthday: { enabled: "yes" } }).birthday.enabled, false, "only a real true switches it on");
});

test("importing a register picks up the birthday and the vehicle", () => {
  const rows = [
    ["Name", "Mobile", "DOB", "Policy Date", "Vehicle Type"],
    ["RAVI KUMAR", "98765 43210", "12-03-1985", "2026-03-01", "Two Wheeler"],
    ["Sita Devi", "91234 56789", "", "2026-03-05", "Swift Car"],
  ];
  const { records } = parseWorkbook("Bike Insurance 2026", [{ name: "Insurance", rows }]);
  assert.equal(records.length, 2);
  assert.deepEqual([records[0].birthMonth, records[0].birthDay, records[0].vehicle], [3, 12, "bike"]);
  assert.deepEqual([records[1].birthMonth, records[1].birthDay, records[1].vehicle], [null, null, "car"]);
});

import { birthdayCouponText, lastBirthday, sanitizeBirthdayCoupon, birthdayEmail as emailWith, birthdayWhatsApp as waWith, DEFAULT_BIRTHDAY_COUPON, DEFAULT_BIRTHDAY_TEMPLATES as TEMPLATES } from "../src/lib/outreach-core.ts";

test("birthday coupon settings are kept in range", () => {
  assert.deepEqual(sanitizeBirthdayCoupon(undefined), DEFAULT_BIRTHDAY_COUPON);
  assert.deepEqual(sanitizeBirthdayCoupon({ enabled: false, percent: 99, validDays: 500 }), { enabled: false, percent: 50, validDays: 90 });
  assert.deepEqual(sanitizeBirthdayCoupon({ percent: 0, validDays: 0 }), { enabled: true, percent: 1, validDays: 1 });
});

test("the coupon goes into the email and the WhatsApp wish, in every language", () => {
  const coupon = { code: "BDAY-ABC234", percent: 10, until: "2026-11-18" };
  for (const lang of ["en", "hi", "bn"] as const) {
    const text = birthdayCouponText(coupon, lang);
    assert.ok(text.includes("BDAY-ABC234") && text.includes("10%"), lang);
    assert.ok(emailWith(TEMPLATES[0], "Anita Devi", lang, coupon).paragraphs.at(-1)!.includes("BDAY-ABC234"));
    assert.ok(waWith(TEMPLATES[0], lang, coupon).includes("BDAY-ABC234"));
    assert.ok(!emailWith(TEMPLATES[0], "Anita Devi", lang).paragraphs.join(" ").includes("BDAY-"));
  }
  assert.match(birthdayCouponText(coupon, "en"), /not to government fees or insurance premium/);
});

test("lastBirthday finds the most recent birthday, across the new year", () => {
  assert.equal(lastBirthday({ month: 10, day: 19 }, "2026-10-19"), "2026-10-19");
  assert.equal(lastBirthday({ month: 10, day: 17 }, "2026-10-19"), "2026-10-17");
  assert.equal(lastBirthday({ month: 12, day: 30 }, "2027-01-02"), "2026-12-30");
  assert.equal(lastBirthday({ month: 2, day: 29 }, "2027-03-01"), "2027-02-28");
});

import { parseUpiAccounts } from "../src/lib/payments-core.ts";

test("up to three UPI IDs are read, with labels, and bad ones are skipped", () => {
  const found = parseUpiAccounts(["shop@sbi|SBI account", "", "not an id", "other@okaxis"].concat("third@ybl", "fourth@ybl"), "NISE COMPORT");
  assert.deepEqual(found.map((item) => [item.slot, item.vpa, item.label]), [[0, "shop@sbi", "SBI account"], [1, "other@okaxis", "UPI 2"], [2, "third@ybl", "UPI 3"]]);
  assert.deepEqual(parseUpiAccounts([undefined, ""], "x"), []);
});

import { markRefreshed, refreshSlot, refreshStatus } from "../src/lib/outreach-core.ts";

test("the data can be refreshed once in the morning and once in the evening (India time)", () => {
  const morning = new Date("2026-10-20T04:00:00Z"); // 9:30 am IST
  const evening = new Date("2026-10-20T11:00:00Z"); // 4:30 pm IST
  assert.equal(refreshSlot(morning).slot, "morning"); assert.equal(refreshSlot(evening).slot, "evening");
  assert.deepEqual([refreshStatus(undefined, morning).allowed, refreshStatus(undefined, morning).usedToday], [true, 0]);
  const afterMorning = markRefreshed(undefined, morning);
  const blocked = refreshStatus(afterMorning, new Date("2026-10-20T08:00:00Z")); // 1:30 pm IST, still morning
  assert.equal(blocked.allowed, false); assert.equal(blocked.nextAt, "2026-10-20T09:30:00.000Z"); // opens 3 pm IST
  assert.equal(refreshStatus(afterMorning, evening).allowed, true);
  const afterEvening = markRefreshed(afterMorning, evening);
  const none = refreshStatus(afterEvening, new Date("2026-10-20T16:00:00Z")); // 9:30 pm IST
  assert.equal(none.allowed, false); assert.equal(none.usedToday, 2); assert.equal(none.nextAt, "2026-10-20T18:30:00.000Z"); // midnight IST
  assert.equal(refreshStatus(afterEvening, new Date("2026-10-21T04:00:00Z")).allowed, true); // next morning
});

import { addYears, collapseRenewals, rollRenewal, renewalWhatsApp as renewalWa, DEFAULT_RENEWAL_TEMPLATES as RENEWALS } from "../src/lib/outreach-core.ts";

test("old policies roll forward to the next yearly anniversary", () => {
  assert.deepEqual(rollRenewal("2026-01-01", "2026-10-20"), { date: "2027-01-01", estimated: true });
  assert.deepEqual(rollRenewal("2024-03-15", "2026-10-20"), { date: "2027-03-15", estimated: true });
  assert.deepEqual(rollRenewal("2026-10-30", "2026-10-20"), { date: "2026-10-30", estimated: false });
  assert.deepEqual(rollRenewal("2026-10-05", "2026-10-20"), { date: "2026-10-05", estimated: false }); // 15 days overdue: still real
  assert.equal(rollRenewal("2026-09-01", "2026-10-20").date, "2027-09-01");
  assert.equal(addYears("2024-02-29", 1), "2025-02-28");
  assert.equal(rollRenewal("2024-02-29", "2026-10-20").date, "2027-02-28");
});

test("one reminder per person and vehicle type, but different vehicles stay separate", () => {
  const row = (group: string, date: string, original: string, estimated: boolean, vehicleKnown = true) => ({ group, date, original, estimated, vehicleKnown });
  // Same bike, policy history 2023 and 2025 -> both roll near the same date: keep the latest policy.
  const kept = collapseRenewals([row("m1|bike", "2027-06-10", "2024-06-10", true), row("m1|bike", "2027-06-25", "2025-06-25", true)]);
  assert.equal(kept.length, 1); assert.equal(kept[0].original, "2025-06-25");
  // A real date beats an estimate.
  assert.equal(collapseRenewals([row("m1|car", "2026-11-02", "2026-11-02", false), row("m1|car", "2026-11-05", "2025-11-05", true)])[0].estimated, false);
  // A bike and a car for the same mobile stay as two reminders.
  assert.equal(collapseRenewals([row("m1|bike", "2027-01-01", "2026-01-01", true), row("m1|car", "2027-01-01", "2026-01-01", true)]).length, 2);
  // Unknown vehicle: dates far apart are two separate vehicles.
  assert.equal(collapseRenewals([row("m2|", "2027-01-01", "2026-01-01", true, false), row("m2|", "2027-06-01", "2026-06-01", true, false)]).length, 2);
});

test("an estimated renewal date is marked as approximate in the message", () => {
  const exact = renewalWa(RENEWALS[0], "bike", "2027-01-01", "en", "9771219893");
  const guess = renewalWa(RENEWALS[0], "bike", "2027-01-01", "en", "9771219893", true);
  assert.ok(!exact.includes("approx") && guess.includes("(approx.)"));
  assert.ok(renewalWa(RENEWALS[0], "bike", "2027-01-01", "hi", "9771219893", true).includes("अनुमानित"));
});
