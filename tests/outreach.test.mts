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
