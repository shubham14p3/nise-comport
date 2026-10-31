import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { missingStaticAssets } from "../scripts/check-build.mjs";

function fixture(run: (dir: string) => void) {
  const dir = mkdtempSync(join(tmpdir(), "nise-build-check-"));
  try { run(dir); } finally { rmSync(dir, { recursive: true, force: true }); }
}

test("complete Next manifests with CSS and JS chunks pass", () => fixture((dir) => {
  mkdirSync(join(dir, "static/chunks"), { recursive: true });
  for (const asset of ["runtime.js", "home.js", "home.css"]) {
    writeFileSync(join(dir, "static/chunks", asset), "test");
  }
  writeFileSync(join(dir, "build-manifest.json"), JSON.stringify({
    rootMainFiles: ["static/chunks/runtime.js"],
    pages: { "/": ["static/chunks/home.js"] },
  }));
  writeFileSync(join(dir, "app-build-manifest.json"), JSON.stringify({
    pages: { "/": ["static/chunks/home.css", "/_next/static/chunks/home.js"] },
  }));
  assert.deepEqual(missingStaticAssets(dir), []);
}));

test("missing CSS and JS chunks are detected before a bad deployment", () => fixture((dir) => {
  writeFileSync(join(dir, "build-manifest.json"), JSON.stringify({
    pages: { "/": ["static/chunks/runtime.js"] },
  }));
  writeFileSync(join(dir, "app-build-manifest.json"), JSON.stringify({
    pages: { "/": ["static/chunks/home.css"] },
  }));
  assert.deepEqual(missingStaticAssets(dir).sort(), [
    "missing asset: static/chunks/home.css",
    "missing asset: static/chunks/runtime.js",
  ]);
}));

test("broken manifest JSON is reported instead of ignored", () => fixture((dir) => {
  writeFileSync(join(dir, "app-build-manifest.json"), "{invalid");
  assert.deepEqual(missingStaticAssets(dir), ["missing asset: app-build-manifest.json (invalid JSON)"]);
}));
