import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { addDays, COMMUNITY_LABELS, FESTIVALS, FESTIVAL_PROMO, festivalPromos, istDate, istDayEnd, istDayStart, mergeOccurrences } from "../src/lib/festivals.ts";
import { fetchHolidayFeed, matchFestivals, parseIcs } from "../src/lib/festival-calendar.ts";
import { SPORT_EVENTS, sportPromos } from "../src/lib/sports-events.ts";
import { curatedEventPromos, duplicateCodes, eventPromos, promoStatus } from "../src/lib/promo-calendar.ts";
import { eventCouponSeedSql, eventCouponValues, UPSERT_EVENT_COUPON, welcomeCode, syncEventCoupons } from "../src/lib/offer-sync.ts";
import { foldIcsLine, googleCalendarLink, googleSubscribeLink, liveOfferCodes, promoCsv, promoIcs, promoText, promoToOffer, viewFromPromo } from "../src/lib/promo-view.ts";
import { promoDict } from "../src/lib/promo-i18n.ts";
import { dictionaries } from "../src/lib/i18n.ts";
import { offersFor } from "../src/lib/offers.ts";

const OCT_1 = new Date("2026-10-01T06:00:00Z");
const SITE = "https://www.nisecomport.com";

const SAMPLE_ICS = [
  "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Google Inc//Google Calendar 70.9054//EN", "X-WR-CALNAME:Holidays in India",
  "BEGIN:VEVENT", "DTSTART;VALUE=DATE:20261108", "DTEND;VALUE=DATE:20261109", "UID:20261108_diwali@google.com", "SUMMARY:Diwali/Deepavali", "DESCRIPTION:Public holiday", "END:VEVENT",
  "BEGIN:VEVENT", "DTSTART;VALUE=DATE:20261021", "UID:x1", "SUMMARY:Dussehra", "END:VEVENT",
  "BEGIN:VEVENT", "DTSTART;VALUE=DATE:20261017", "UID:x2", "SUMMARY:First Day of Durga Puja Festivities", "END:VEVENT",
  "BEGIN:VEVENT", "DTSTART;VALUE=DATE:20261019", "UID:x3", "SUMMARY:Maha Ashtami", "END:VEVENT",
  "BEGIN:VEVENT", "DTSTART;VALUE=DATE:20261224", "UID:x4", "SUMMARY:Christmas Eve", "END:VEVENT",
  "BEGIN:VEVENT", "DTSTART;VALUE=DATE:20261225", "UID:x5", "SUMMARY:Christmas", "END:VEVENT",
  "BEGIN:VEVENT", "DTSTART;VALUE=DATE:20270321", "UID:x6", "SUMMARY:Holika Dahana", "END:VEVENT",
  "BEGIN:VEVENT", "DTSTART;VALUE=DATE:20270322", "UID:x7", "SUMMARY:Holi", "END:VEVENT",
  "BEGIN:VEVENT", "DTSTART;VALUE=DATE:20270408", "UID:x8", "SUMMARY:Chaitra Navratri", "END:VEVENT",
  // A folded line (RFC 5545: continuation lines start with a space) and escaped characters.
  "BEGIN:VEVENT", "DTSTART:20291108T000000Z", "UID:x9", "SUMMARY:Diwali\\, the festiv", " al of lights", "END:VEVENT",
  "END:VCALENDAR",
].join("\r\n");

test("iCalendar parser handles all-day dates, folded lines and escapes", () => {
  const events = parseIcs(SAMPLE_ICS);
  assert.equal(events.length, 10);
  assert.deepEqual(events[0], { uid: "20261108_diwali@google.com", summary: "Diwali/Deepavali", date: "2026-11-08", description: "Public holiday" });
  assert.equal(events.at(-1)?.summary, "Diwali, the festival of lights");
  assert.equal(events.at(-1)?.date, "2029-11-08");
});

test("feed titles match the right festivals only", () => {
  const found = matchFestivals(parseIcs(SAMPLE_ICS));
  const keys = (title: string) => found.filter((item) => item.title === title).map((item) => item.key);
  assert.deepEqual(keys("Diwali/Deepavali"), ["diwali"]);
  assert.deepEqual(keys("Maha Ashtami"), ["durga-puja"]);
  assert.deepEqual(keys("First Day of Durga Puja Festivities"), [], "first day of the festivities is not Ashtami");
  assert.deepEqual(keys("Christmas Eve"), []);
  assert.deepEqual(keys("Christmas"), ["christmas"]);
  assert.deepEqual(keys("Holika Dahana"), [], "bonfire night is not the colours day");
  assert.deepEqual(keys("Holi"), ["holi"]);
  assert.deepEqual(keys("Chaitra Navratri"), [], "spring Navratri is outside the autumn months");
});

test("feed dates correct fallback dates only when they are close", () => {
  const occurrences = mergeOccurrences([
    { key: "dussehra", date: "2026-10-21" }, // 1 day from the fallback: accepted
    { key: "diwali", date: "2026-12-30" }, // 52 days away: ignored
    { key: "diwali", date: "2029-11-05" }, // no fallback for 2029: used as is
    { key: "holi", date: "2027-03-20" }, { key: "holi", date: "2027-03-23" }, // closest to 22 Mar wins
  ]);
  const find = (key: string, year: number) => occurrences.find((item) => item.def.key === key && item.date.startsWith(String(year)));
  assert.equal(find("dussehra", 2026)?.date, "2026-10-21");
  assert.equal(find("dussehra", 2026)?.source, "google");
  assert.equal(find("diwali", 2026)?.date, "2026-11-08");
  assert.equal(find("diwali", 2026)?.source, "curated");
  assert.equal(find("diwali", 2029)?.date, "2029-11-05");
  assert.equal(find("holi", 2027)?.date, "2027-03-23");
});

test("festival codes go live 30 days before and end on the day", () => {
  const promos = festivalPromos(mergeOccurrences([]), OCT_1);
  const diwali = promos.find((promo) => promo.key === "diwali-2026");
  assert.ok(diwali);
  assert.equal(diwali.code, "DIWALI26");
  assert.equal(diwali.startsOn, "2026-10-09");
  assert.equal(diwali.endsOn, "2026-11-08");
  assert.equal(diwali.discount, 50);
  assert.equal(diwali.minimum, 150);
  assert.ok(!promos.some((promo) => promo.eventStarts < "2026-10-01"), "past festivals are skipped");
  assert.equal(promoStatus(diwali, OCT_1), "upcoming");
  assert.equal(promoStatus(diwali, new Date("2026-10-09T00:00:00+05:30")), "live");
  assert.equal(promoStatus(diwali, new Date("2026-11-08T23:59:00+05:30")), "live");
  assert.equal(promoStatus(diwali, new Date("2026-11-09T00:00:00+05:30")), "ended");
});

test("every festival has dates through 2028 and labels in three languages", () => {
  for (const def of FESTIVALS) {
    assert.match(def.code, /^[A-Z]{3,12}$/, def.key);
    assert.ok(def.dates[2028], `${def.key} has a 2028 date`);
    for (const [year, date] of Object.entries(def.dates)) {
      assert.match(date, /^\d{4}-\d{2}-\d{2}$/);
      assert.ok(date.startsWith(year), `${def.key} ${date} filed under ${year}`);
      if (def.months) assert.ok(def.months.includes(Number(date.slice(5, 7))), `${def.key} ${date} outside its months`);
    }
    for (const locale of ["en", "hi", "bn"] as const) assert.ok(def.names[locale].trim(), `${def.key} ${locale}`);
    for (const community of def.communities) assert.ok(COMMUNITY_LABELS[community]);
  }
  const communities = new Set(FESTIVALS.flatMap((def) => def.communities));
  for (const needed of ["hindu", "bengali", "punjabi", "christian", "muslim", "jharkhand", "jain-buddhist", "regional", "national"] as const) assert.ok(communities.has(needed), needed);
});

test("sports codes cover India's events and run until the final", () => {
  const promos = sportPromos(OCT_1);
  const asiad = promos.find((promo) => promo.code === "ASIAD26");
  assert.ok(asiad, "Asian Games still running on 1 Oct 2026");
  assert.equal(promoStatus(asiad, OCT_1), "live");
  assert.equal(asiad.endsOn, "2026-10-04");
  const worldCup = promos.find((promo) => promo.code === "WORLDCUP27");
  assert.equal(worldCup?.startsOn, "2027-09-04");
  assert.equal(worldCup?.endsOn, "2027-11-21");
  assert.ok(promos.find((promo) => promo.code === "T20FEVER27")?.tentative, "IPL 2027 dates aren't confirmed");
  assert.ok(!sportPromos(new Date("2026-10-05T06:00:00Z")).some((promo) => promo.code === "ASIAD26"), "ended events drop out");
  for (const event of SPORT_EVENTS) {
    assert.ok(event.start <= event.end, event.key);
    assert.doesNotMatch(event.code, /IPL|OLYMPIC|ICC|BCCI/, `${event.code} avoids tournament trademarks`);
    for (const locale of ["en", "hi", "bn"] as const) assert.ok(event.names[locale] && event.blurb[locale], `${event.key} ${locale}`);
  }
});

test("the full calendar has unique codes through December 2028", () => {
  const promos = curatedEventPromos(OCT_1);
  assert.deepEqual(duplicateCodes(promos), []);
  assert.ok(promos.length >= 110, `only ${promos.length} codes`);
  assert.ok(promos.some((promo) => promo.code === "XMAS28"));
  assert.ok(promos.some((promo) => promo.code === "TEAMINDIA28"));
  for (const promo of promos) {
    assert.match(promo.code, /^[A-Z0-9]{4,13}$/);
    assert.ok(promo.startsOn <= promo.endsOn);
    assert.equal(promo.startsOn, addDays(promo.eventStarts, -FESTIVAL_PROMO.leadDays));
  }
  const sorted = [...promos].sort((a, b) => a.eventStarts.localeCompare(b.eventStarts) || a.code.localeCompare(b.code));
  assert.deepEqual(promos.map((promo) => promo.code), sorted.map((promo) => promo.code));
  assert.equal(eventPromos([], OCT_1).length, promos.length);
});

test("India-time day boundaries", () => {
  assert.equal(istDate(new Date("2026-11-08T18:29:00Z")), "2026-11-08");
  assert.equal(istDate(new Date("2026-11-08T18:31:00Z")), "2026-11-09");
  assert.equal(istDayStart("2026-10-09").toISOString(), "2026-10-08T18:30:00.000Z");
  assert.equal(istDayEnd("2026-11-08").toISOString(), "2026-11-08T18:29:59.999Z");
});

test("database rows: upsert parameters line up and the seed is safe SQL", () => {
  const diwali = curatedEventPromos(OCT_1).find((promo) => promo.code === "DIWALI26")!;
  const values = eventCouponValues(diwali);
  const placeholders = UPSERT_EVENT_COUPON.match(/\$\d+/g) ?? [];
  assert.equal(new Set(placeholders).size, values.length);
  assert.match(UPSERT_EVENT_COUPON, /ON CONFLICT \(event_key\) WHERE event_key IS NOT NULL/);
  assert.match(UPSERT_EVENT_COUPON, /coupons\.locked = false/);
  assert.doesNotMatch(UPSERT_EVENT_COUPON, /active = EXCLUDED/, "the sync never switches a code back on");
  assert.equal(values[0], "DIWALI26");
  assert.equal(values[5], "2026-10-08T18:30:00.000Z");
  const seed = eventCouponSeedSql([{ ...diwali, names: { en: "Women's Day", hi: "x", bn: "y" } }]);
  assert.match(seed, /'\{"en":"Women''s Day"/, "quotes are doubled");
  assert.match(seed, /ON CONFLICT DO NOTHING;$/);
});

test("the migration seeds every code once and adds the redemptions table", () => {
  const sql = readFileSync(new URL("../drizzle/0006_festival_offers.sql", import.meta.url), "utf8");
  const codes = [...sql.matchAll(/^\('([A-Z0-9]+)', 'fixed'/gm)].map((match) => match[1]);
  assert.ok(codes.length >= 110);
  assert.equal(new Set(codes).size, codes.length);
  assert.match(sql, /CREATE TABLE "coupon_redemptions"/);
  assert.match(sql, /"coupons_welcome_user_unique"/);
  assert.match(sql, /'welcome'/);
  const journal = JSON.parse(readFileSync(new URL("../drizzle/meta/_journal.json", import.meta.url), "utf8")) as { entries: { tag: string }[] };
  assert.ok(journal.entries.some((entry) => entry.tag === "0006_festival_offers"));
});

test("sync upserts every promo and reports code conflicts", async () => {
  const seen: unknown[][] = [];
  const query = async (_text: string, params: unknown[] = []) => {
    seen.push(params);
    if (params[0] === "XMAS26") throw Object.assign(new Error("duplicate key"), { code: "23505" });
    return { rows: params[0] === "DIWALI26" ? [] : [{ inserted: params[0] !== "HOLI27" }] };
  };
  const offline = async () => { throw new Error("offline"); };
  const report = await syncEventCoupons(query, { now: OCT_1, fetchImpl: offline });
  assert.equal(report.feed.ok, false);
  assert.equal(seen.length, report.promos);
  assert.deepEqual(report.conflicts, ["XMAS26"]);
  assert.equal(report.unchanged, 1);
  assert.equal(report.updated, 1);
  assert.equal(report.created, report.promos - 3);
});

test("the Google feed is used when it answers", async () => {
  const fetchImpl = async () => ({ ok: true, status: 200, text: async () => SAMPLE_ICS });
  const feed = await fetchHolidayFeed(fetchImpl);
  assert.equal(feed.ok, true);
  const promos = eventPromos(matchFestivals(feed.events), OCT_1);
  const dussehra = promos.find((promo) => promo.code === "DUSSEHRA26");
  assert.equal(dussehra?.eventStarts, "2026-10-21");
  assert.equal(dussehra?.source, "google");
  const broken = await fetchHolidayFeed(async () => ({ ok: true, status: 200, text: async () => "<html>blocked</html>" }));
  assert.equal(broken.ok, false);
});

test("welcome codes are readable and random", () => {
  let next = 0;
  const code = welcomeCode(() => next++ % 32);
  assert.equal(code, "WELCOME-ABCDEF");
  assert.match(welcomeCode((max) => Math.floor(Math.random() * max)), /^WELCOME-[A-HJ-NP-Z2-9]{6}$/);
});

test("promo banners translate and link to the request flow", () => {
  const view = viewFromPromo(curatedEventPromos(OCT_1).find((promo) => promo.code === "DIWALI26")!);
  const offer = promoToOffer(view);
  assert.equal(offer.highlight.en, "₹50 OFF");
  assert.equal(offer.highlight.hi, "₹50 की छूट");
  assert.equal(offer.highlight.bn, "₹50 ছাড়");
  assert.match(offer.ticker.hi, /दीपावली.*DIWALI26/);
  assert.match(offer.ticker.bn, /দীপাবলি.*DIWALI26/);
  assert.match(offer.terms.en, /service charge/);
  assert.equal(offer.href, "/request?coupon=DIWALI26");
  assert.equal(offer.tone, "saffron");
  assert.equal(promoText(view, "en").title, "Diwali offer");
  const live = liveOfferCodes(curatedEventPromos(OCT_1).map(viewFromPromo), OCT_1);
  assert.equal(live[0]?.code, "ASIAD26", "soonest-ending first");
  assert.ok(live.every((item) => item.badge === "LIVE"));
  const rail = offersFor(null, OCT_1, live);
  assert.ok(rail.findIndex((item) => item.code) < rail.findIndex((item) => item.id === "free-document-check"), "codes come before general offers");
});

test("Google Calendar, iCalendar and CSV exports", () => {
  const views = curatedEventPromos(OCT_1).map(viewFromPromo);
  const diwali = views.find((view) => view.code === "DIWALI26")!;
  const link = new URL(googleCalendarLink(diwali, { siteUrl: SITE }));
  assert.equal(link.hostname, "calendar.google.com");
  assert.equal(link.searchParams.get("dates"), "20261009/20261109", "all-day end date is exclusive");
  assert.match(link.searchParams.get("text") ?? "", /DIWALI26/);
  assert.match(googleSubscribeLink(`${SITE}/offers/calendar.ics`), /cid=webcal%3A%2F%2Fwww\.nisecomport\.com%2Foffers%2Fcalendar\.ics$/);

  const ics = promoIcs(views, { siteUrl: SITE, locale: "hi", now: OCT_1 });
  assert.ok(ics.startsWith("BEGIN:VCALENDAR\r\n") && ics.endsWith("END:VCALENDAR\r\n"));
  assert.equal(ics.split("BEGIN:VEVENT").length - 1, views.length);
  assert.match(ics, /UID:diwali-2026@www\.nisecomport\.com/);
  assert.match(ics, /DTSTART;VALUE=DATE:20261009\r\nDTEND;VALUE=DATE:20261109/);
  const encoder = new TextEncoder();
  for (const line of ics.split("\r\n")) assert.ok(encoder.encode(line).length <= 75, `line too long: ${line}`);
  const folded = foldIcsLine(`SUMMARY:${"दीपावली ".repeat(20)}`);
  assert.equal(folded.replace(/\r\n /g, ""), `SUMMARY:${"दीपावली ".repeat(20)}`, "folding never splits a character");

  const csv = promoCsv(views, { siteUrl: SITE, locale: "bn", now: OCT_1 });
  const rows = csv.trim().split("\r\n");
  assert.equal(rows.length, views.length + 1);
  assert.match(rows[0], /^কোড,/);
  assert.match(csv, /ASIAD26,.*এখন লাইভ/);
  const injected = promoCsv([{ ...diwali, names: { en: "=HYPERLINK(\"x\")", hi: "x", bn: "x" } }], { siteUrl: SITE, now: OCT_1 });
  assert.match(injected, /"'=HYPERLINK\(""x""\)"/, "formulas are neutralised");
});

test("promo interface text exists in every language, including the chat topic", () => {
  const english = Object.keys(promoDict("en")).sort();
  for (const locale of ["hi", "bn"] as const) {
    assert.deepEqual(Object.keys(promoDict(locale)).sort(), english);
    for (const [key, value] of Object.entries(promoDict(locale))) assert.ok(value.trim(), `${locale}.${key}`);
  }
  for (const locale of ["en", "hi", "bn"] as const) assert.ok(dictionaries[locale].chat.topics.offers.label);
});
