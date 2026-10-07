import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { clampPacing, DEFAULT_PACING, inSendingWindow, istHour, nextGapMs, planRound, simulateCampaign } from "../src/lib/campaign-pacing.ts";
import { classifyReply, consentAllows, DEFAULT_MESSAGES, renderMessage, STOP_FOOTER, whatsappLink } from "../src/lib/campaign-text.ts";
import { hasPermission, permissionsOf, sanitizePermissions, STAFF_PERMISSIONS } from "../src/lib/permissions.ts";
import { findPoster, isPosterUrl, POSTERS, posterFor } from "../src/lib/poster-library.ts";
import { parseWebhook, templatePayload, verifyMetaSignature } from "../src/lib/whatsapp.ts";

/** Deterministic "random" numbers for repeatable schedules. */
function seeded(seed = 7) {
  let state = seed;
  return () => { state = (state * 1_103_515_245 + 12_345) % 2 ** 31; return state / 2 ** 31; };
}
const ist = (clock: string) => new Date(`2026-10-05T${clock}:00+05:30`);

test("pacing is clamped to at most 10 per round and a sane window", () => {
  assert.equal(clampPacing({ batchSize: 50 }).batchSize, 10);
  assert.equal(clampPacing({ batchSize: 0 }).batchSize, 1);
  const swapped = clampPacing({ gapMinMinutes: 30, gapMaxMinutes: 10 });
  assert.ok(swapped.gapMaxMinutes >= swapped.gapMinMinutes);
  assert.deepEqual(clampPacing({ windowStart: 20, windowEnd: 9 }), { ...DEFAULT_PACING });
  assert.equal(istHour(ist("09:30")), 9.5);
  assert.ok(inSendingWindow(ist("09:00"), DEFAULT_PACING));
  assert.ok(!inSendingWindow(ist("20:00"), DEFAULT_PACING));
});

test("gaps between rounds are random within 10–30 minutes plus under a minute", () => {
  const random = seeded(3);
  const gaps = Array.from({ length: 500 }, () => nextGapMs(DEFAULT_PACING, random));
  assert.ok(gaps.every((gap) => gap >= 10 * 60_000 && gap < 31 * 60_000), "within range");
  assert.ok(new Set(gaps.map((gap) => Math.round(gap / 60_000))).size > 10, "spread out, not fixed");
});

test("a round sends up to 10 messages 25–90 s apart, then waits 10–30 min", () => {
  const plan = planRound({ now: ist("11:00"), pacing: { ...DEFAULT_PACING, dailyLimit: 100 }, pending: 37, sentToday: 0, random: seeded(1) });
  assert.equal(plan.kind, "send");
  if (plan.kind !== "send") return;
  assert.equal(plan.times.length, 10);
  for (let index = 1; index < plan.times.length; index++) {
    const spacing = plan.times[index].getTime() - plan.times[index - 1].getTime();
    assert.ok(spacing >= 25_000 && spacing <= 90_000, `spacing ${spacing}`);
  }
  const gap = plan.nextRoundAt.getTime() - plan.times.at(-1)!.getTime();
  assert.ok(gap >= 10 * 60_000 && gap < 31 * 60_000);
});

test("outside 9–8 IST and after the daily limit, sending waits for the next morning", () => {
  const night = planRound({ now: ist("22:15"), pacing: DEFAULT_PACING, pending: 5, sentToday: 0, random: seeded(2) });
  assert.equal(night.kind, "wait");
  if (night.kind === "wait") {
    assert.equal(night.reason, "outside-window");
    assert.ok(istHour(night.nextRoundAt) >= 9 && istHour(night.nextRoundAt) < 9.34);
    assert.ok(night.nextRoundAt > ist("22:15"));
  }
  const full = planRound({ now: ist("12:00"), pacing: DEFAULT_PACING, pending: 5, sentToday: 10, random: seeded(2) });
  assert.equal(full.kind, "wait");
  if (full.kind === "wait") assert.equal(full.reason, "daily-limit");
  assert.equal(planRound({ now: ist("12:00"), pacing: DEFAULT_PACING, pending: 0, sentToday: 0 }).kind, "done");
});

test("a simulated 45-message campaign respects every rule", () => {
  const pacing = { ...DEFAULT_PACING, dailyLimit: 20 };
  const sends = simulateCampaign(45, ist("08:00"), pacing, seeded(9));
  assert.equal(sends.length, 45);
  const perDay = new Map<string, number>();
  const perRound = new Map<number, number>();
  for (const send of sends) {
    assert.ok(inSendingWindow(send.at, pacing), `sent at ${send.at.toISOString()}`);
    const day = new Date(send.at.getTime() + 5.5 * 3_600_000).toISOString().slice(0, 10);
    perDay.set(day, (perDay.get(day) ?? 0) + 1);
    perRound.set(send.round, (perRound.get(send.round) ?? 0) + 1);
  }
  assert.ok([...perDay.values()].every((total) => total <= 20));
  assert.ok([...perRound.values()].every((total) => total <= 10));
  assert.equal(perDay.size, 3, "45 messages at 20 a day take three days");
});

test("messages are filled in each language and end with a STOP line", () => {
  const en = renderMessage(DEFAULT_MESSAGES.renewal.en, { lang: "en", kind: "renewal", name: "Priya Kumari", service: "insurance", code: "DIWALI26", renewalOn: "2026-11-02", phone: "+91 97712 19893" });
  assert.match(en, /^Namaste Priya 🙏 Your vehicle insurance renewal is due on 2 November\./);
  assert.match(en, /DIWALI26 for ₹50 off our service charge/);
  assert.ok(en.endsWith(STOP_FOOTER.en));
  const hi = renderMessage(DEFAULT_MESSAGES.renewal.hi, { lang: "hi", kind: "renewal", name: "Priya", service: "insurance", code: null, renewalOn: null, phone: "+91 97712 19893" });
  assert.match(hi, /^नमस्ते Priya जी 🙏 आपके वाहन बीमा का रिन्यूअल है।/);
  assert.ok(!hi.includes("{"), "no placeholders left");
  const bn = renderMessage(DEFAULT_MESSAGES.optin.bn, { lang: "bn", kind: "optin", name: "", phone: "x" });
  assert.ok(!bn.includes(STOP_FOOTER.bn), "the YES/STOP question has no extra footer");
  for (const kind of Object.keys(DEFAULT_MESSAGES) as (keyof typeof DEFAULT_MESSAGES)[]) {
    for (const text of Object.values(DEFAULT_MESSAGES[kind])) assert.doesNotMatch(text, /premium|lowest price|guarantee|प्रीमियम|প্রিমিয়াম/i, "no insurance-premium discount wording");
  }
  assert.equal(whatsappLink("+918092766575", "Hi there"), "https://wa.me/918092766575?text=Hi%20there");
});

test("STOP and YES replies are understood in three languages", () => {
  for (const text of ["STOP", "stop ", "Unsubscribe", "बंद", "বন্ধ"]) assert.equal(classifyReply(text), "stop", text);
  for (const text of ["YES", "yes!", "Haan", "हाँ", "হ্যাঁ"]) assert.equal(classifyReply(text), "yes", text);
  for (const text of ["ok", "what is the price?", "stop sending me the price list tomorrow"]) assert.equal(classifyReply(text), null, text);
  assert.ok(consentAllows("renewal", "unknown") && consentAllows("renewal", "opted_in"));
  assert.ok(!consentAllows("renewal", "opted_out"));
  assert.ok(consentAllows("offer", "opted_in") && !consentAllows("offer", "unknown"));
  assert.ok(consentAllows("optin", "unknown") && !consentAllows("optin", "opted_in"));
});

test("staff permissions: owner can do everything, staff only what was ticked, customers nothing", () => {
  assert.ok(STAFF_PERMISSIONS.every((permission) => hasPermission({ role: "admin" }, permission)));
  const staff = { role: "staff", permissions: ["requests", "campaigns", "nonsense"] };
  assert.ok(hasPermission(staff, "requests") && hasPermission(staff, "campaigns"));
  assert.ok(!hasPermission(staff, "wallet") && !hasPermission(staff, "promotions"));
  assert.deepEqual(permissionsOf(staff), ["requests", "campaigns"]);
  assert.ok(!hasPermission({ role: "customer", permissions: ["requests"] }, "requests"), "a customer with stray permissions still gets nothing");
  assert.deepEqual(sanitizePermissions("requests"), []);
  assert.equal(permissionsOf(null).length, 0);
});

test("poster library files exist and only library or uploaded posters are accepted", () => {
  assert.equal(POSTERS.length, 20);
  for (const poster of POSTERS) {
    assert.ok(existsSync(new URL(`../public${poster.src}`, import.meta.url)), poster.src);
    assert.ok(isPosterUrl(poster.src));
  }
  assert.ok(POSTERS.some((poster) => !poster.discountClaim), "at least one poster without discount wording");
  assert.ok(findPoster("/promos/insurance/ride-safe-every-day.jpg")?.discountClaim);
  assert.ok(isPosterUrl("/media/0b6c1c2e-8a7a-4d0e-9d7e-3f1f0e9a1b2c"));
  for (const bad of ["https://evil.example/x.jpg", "/promos/../../etc/passwd", "javascript:alert(1)", "/media/1"]) assert.ok(!isPosterUrl(bad), bad);
  assert.equal(posterFor({ en: "/a.jpg", hi: "/b.jpg" }, "bn"), "/a.jpg");
  assert.equal(posterFor({ en: "/a.jpg", hi: "/b.jpg" }, "hi"), "/b.jpg");
});

test("WhatsApp webhook: signature, replies, receipts and template payloads", () => {
  const body = JSON.stringify({ entry: [{ changes: [{ value: {
    contacts: [{ wa_id: "918092766575", profile: { name: "Shubham" } }],
    messages: [{ from: "918092766575", type: "text", text: { body: "STOP" } }],
    statuses: [{ id: "wamid.1", status: "failed", errors: [{ message: "Number not on WhatsApp" }] }],
  } }] }] });
  const secret = "test-app-secret";
  const signature = `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
  assert.ok(verifyMetaSignature(body, signature, secret));
  assert.ok(!verifyMetaSignature(`${body} `, signature, secret));
  assert.ok(!verifyMetaSignature(body, signature, undefined));
  assert.deepEqual(parseWebhook(JSON.parse(body)), [
    { type: "message", from: "+918092766575", text: "STOP", name: "Shubham" },
    { type: "status", id: "wamid.1", status: "failed", error: "Number not on WhatsApp" },
  ]);
  assert.deepEqual(parseWebhook({ nonsense: true }), []);
  const payload = templatePayload({ to: "+91 80927 66575", template: "nise_offer_v1", lang: "hi", bodyParams: ["Priya", "Hello"], imageUrl: "https://www.nisecomport.com/promos/insurance/car-bike-quote-today.jpg" });
  assert.equal(payload.to, "918092766575");
  assert.equal(payload.template.language.code, "hi");
  assert.equal(payload.template.components.length, 2);
});

test("migration 0007 adds staff permissions and the dummy test campaign", () => {
  const sql = readFileSync(new URL("../drizzle/0007_staff_campaigns.sql", import.meta.url), "utf8");
  assert.match(sql, /ADD COLUMN "permissions" jsonb DEFAULT '\[\]'::jsonb NOT NULL/);
  assert.match(sql, /UPDATE "users" SET "permissions" = '\["requests"\]'::jsonb WHERE "role" = 'staff'/);
  assert.match(sql, /'Insurance renewal \(dummy test\)'/);
  assert.match(sql, /'\["\+918092766575"\]'::jsonb/);
  assert.match(sql, /WHERE "campaign_messages"\."test" = false/);
  const journal = JSON.parse(readFileSync(new URL("../drizzle/meta/_journal.json", import.meta.url), "utf8")) as { entries: { tag: string }[] };
  assert.ok(journal.entries.some((entry) => entry.tag === "0007_staff_campaigns"));
});
