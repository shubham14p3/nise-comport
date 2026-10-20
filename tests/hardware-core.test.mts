import assert from "node:assert/strict";
import test from "node:test";
import { cleanHardwareInput, mergeHardware, type HardwareRow } from "../src/lib/hardware-core.ts";

const base = [{ slug: "ram", title: "RAM", items: [{ name: "DDR4 RAM 8 GB", note: "a" }, { name: "DDR5 RAM 16 GB", note: "b" }] }, { slug: "empty", title: "Empty", items: [{ name: "Only", note: "x" }] }];
const row = (over: Partial<HardwareRow>): HardwareRow => ({ kind: "item", groupSlug: "ram", name: "X", note: "", image: null, published: true, sortOrder: 0, ...over });

test("no admin changes leaves the built-in list as it is", () => assert.deepEqual(mergeHardware(base, []), base));
test("a hidden built-in part disappears, case-insensitively, and an emptied group is dropped", () => {
  const merged = mergeHardware(base, [row({ kind: "hide", name: "ddr4 ram 8 gb" }), row({ kind: "hide", groupSlug: "empty", name: "Only" })]);
  assert.deepEqual(merged.map((group) => group.items.map((item) => item.name)), [["DDR5 RAM 16 GB"]]);
});
test("added parts join their group; unpublished and duplicate ones do not", () => {
  const merged = mergeHardware(base, [row({ name: "DDR4 RAM 32 GB", note: "new", image: "/images/a.webp" }), row({ name: "Hidden RAM", published: false }), row({ name: "ddr5 ram 16 gb" })]);
  assert.deepEqual(merged[0].items.map((item) => item.name), ["DDR4 RAM 8 GB", "DDR5 RAM 16 GB", "DDR4 RAM 32 GB"]);
  assert.equal(merged[0].items[2].image, "/images/a.webp");
});
test("input is trimmed and checked", () => {
  assert.deepEqual(cleanHardwareInput({ groupSlug: "ram", name: "  New   part ", note: " n ", image: "" }, base), { groupSlug: "ram", name: "New part", note: "n", image: null });
  assert.ok("error" in cleanHardwareInput({ groupSlug: "nope", name: "Valid name" }, base));
  assert.ok("error" in cleanHardwareInput({ groupSlug: "ram", name: "ab" }, base));
  assert.ok("error" in cleanHardwareInput({ groupSlug: "ram", name: "Valid name", image: "https://evil.com/x.png" }, base));
});
