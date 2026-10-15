import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { checkInsuranceForm, FACILITATOR_NOTE, NCB_SLABS, renewalDate, summariseInsurance } from "../src/lib/motor-insurance.ts";
import { findGuide, findVariant } from "../src/lib/help-docs.ts";

const base = { name: "Priya Kumari", phone: "98765 43210", vehicle: "car", regNo: "jh05-ab-1234" };

test("insurance form: renewal is cleaned and summarised", () => {
  const { form, problems } = checkInsuranceForm({ ...base, purpose: "renew", expiry: "2026-11-02", ncb: "35", addOns: ["zero-dep", "hack"], cover: "comprehensive" });
  assert.deepEqual(problems, {});
  assert.equal(form.regNo, "JH05AB1234");
  assert.deepEqual(form.addOns, ["zero-dep"]);
  assert.equal(renewalDate(form), "2026-11-02");
  const lines = summariseInsurance(form);
  assert.match(lines[0], /Car JH05AB1234/);
  assert.ok(lines.some((line) => /NCB 35%/.test(line)));
});

test("insurance form: problems for bad input", () => {
  assert.ok(checkInsuranceForm({ purpose: "renew", name: "A", phone: "123" }).problems.phone);
  assert.ok(checkInsuranceForm({ ...base, purpose: "renew", regNo: "" }).problems.regNo);
  assert.ok(checkInsuranceForm({ ...base, purpose: "claim" }).problems.incident);
  const fresh = checkInsuranceForm({ ...base, purpose: "new", regNo: "", make: "Tata", model: "Punch" });
  assert.deepEqual(fresh.problems, {});
  assert.equal(renewalDate(fresh.form), null);
});

test("motor insurance facts and facilitator wording", () => {
  assert.deepEqual(NCB_SLABS.map((row) => row.discount), [20, 25, 35, 45, 50]);
  assert.match(FACILITATOR_NOTE, /insur/i);
  const guide = findGuide("my bike insurance expired")!;
  assert.equal(guide.id, "insurance");
  assert.equal(findVariant(guide, "my bike insurance expired").id, "expired");
  assert.ok(guide.variants.every((variant) => variant.href?.startsWith("/insurance")));
  const text = JSON.stringify(guide);
  assert.doesNotMatch(text, /https?:\/\/|parivahan|\.gov\.in/i, "chat never points to outside sites");
});

test("migration 0011 adds lead details", () => {
  const sql = readFileSync(new URL("../drizzle/0011_insurance_leads.sql", import.meta.url), "utf8");
  assert.match(sql, /ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "details" jsonb/);
  const journal = JSON.parse(readFileSync(new URL("../drizzle/meta/_journal.json", import.meta.url), "utf8"));
  assert.ok(journal.entries.some((entry: { tag: string }) => entry.tag === "0011_insurance_leads"));
});

test("migration 0012 adds request drafts", () => {
  const sql = readFileSync(new URL("../drizzle/0012_request_drafts.sql", import.meta.url), "utf8");
  assert.match(sql, /CREATE TABLE IF NOT EXISTS "request_drafts"/);
  assert.match(sql, /ON DELETE cascade/);
  const journal = JSON.parse(readFileSync(new URL("../drizzle/meta/_journal.json", import.meta.url), "utf8"));
  assert.ok(journal.entries.some((entry: { tag: string }) => entry.tag === "0012_request_drafts"));
});

test("form translations: every option has en/hi/bn and values stay English", async () => {
  const { INSURANCE_TEXT, SERVICE_NAMES, statusText } = await import("../src/lib/i18n-forms.ts");
  const { FUELS, INCIDENTS, ADD_ONS, COVER_CHOICES } = await import("../src/lib/motor-insurance.ts");
  for (const fuel of FUELS) assert.ok(INSURANCE_TEXT.fuels[fuel]?.hi, fuel);
  for (const incident of INCIDENTS) assert.ok(INSURANCE_TEXT.incidents[incident]?.bn, incident);
  for (const addOn of ADD_ONS) assert.ok(INSURANCE_TEXT.addOnNames[addOn.id]?.hi && INSURANCE_TEXT.addOnTexts[addOn.id]?.bn, addOn.id);
  for (const id of Object.keys(COVER_CHOICES)) assert.ok(INSURANCE_TEXT.covers[id]?.hi, id);
  const { publishedServiceDetails } = await import("../src/lib/services.ts");
  for (const service of publishedServiceDetails) assert.ok(SERVICE_NAMES[service.slug]?.hi && SERVICE_NAMES[service.slug]?.bn, `${service.slug} needs Hindi/Bengali names`);
  assert.equal(statusText("ready_for_pickup", "hi"), "लेने के लिए तैयार");
});

test("gallery photos: files exist, categories are known, inbox folders match", async () => {
  const { existsSync, readdirSync } = await import("node:fs");
  const { galleryPhotos } = await import("../src/lib/gallery-photos.ts");
  const { isGalleryTag } = await import("../src/lib/gallery-tags.ts");
  for (const photo of galleryPhotos) {
    assert.ok(isGalleryTag(photo.service), `${photo.src}: unknown category ${photo.service}`);
    assert.ok(existsSync(new URL(`../public${photo.src}`, import.meta.url)), `${photo.src} is missing`);
    assert.ok(photo.alt.length > 20, `${photo.src} needs alt text`);
  }
  for (const folder of readdirSync(new URL("../photo-inbox/", import.meta.url), { withFileTypes: true }).filter((entry) => entry.isDirectory() && !entry.name.startsWith("_"))) {
    assert.ok(folder.name === "all-photos" || isGalleryTag(folder.name), `photo-inbox/${folder.name} isn't a known category`);
  }
});
