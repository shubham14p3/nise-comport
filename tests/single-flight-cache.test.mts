import assert from "node:assert/strict";
import { test } from "node:test";
import { createSingleFlightCache } from "../src/lib/single-flight-cache.ts";

test("shared components coalesce concurrent session requests", async () => {
  let calls = 0;
  let done!: (value: string) => void;
  const cache = createSingleFlightCache(() => { calls++; return new Promise<string>((resolve) => { done = resolve; }); });
  const a = cache.get();
  const b = cache.get();
  // Loader starts on a microtask; every consumer receives the same request.
  assert.equal(a, b);
  await Promise.resolve();
  assert.equal(calls, 1);
  done("customer");
  assert.equal(await a, "customer");
  assert.equal(await cache.get(), "customer");
  assert.equal(calls, 1);
});

test("cache refreshes after TTL instead of polling every route mount", async () => {
  let now = 1_000;
  let calls = 0;
  const cache = createSingleFlightCache(async () => ++calls, 45_000, () => now);
  assert.equal(await cache.get(), 1);
  now += 44_000;
  assert.equal(await cache.get(), 1);
  assert.equal(calls, 1);
  now += 1_001;
  assert.equal(await cache.get(), 2);
  assert.equal(calls, 2);
});

test("login/logout invalidates anonymous result and prevents stale in-flight replies", async () => {
  const resolving: Array<(value: string | null) => void> = [];
  const cache = createSingleFlightCache(() => new Promise<string | null>((resolve) => resolving.push(resolve)));
  const oldRequest = cache.get();
  await Promise.resolve();
  cache.invalidate();
  const newRequest = cache.get();
  await Promise.resolve();
  assert.equal(resolving.length, 2);
  resolving[0](null);
  assert.equal(await oldRequest, null);
  resolving[1]("signed-in");
  assert.equal(await newRequest, "signed-in");
  assert.equal(await cache.get(), "signed-in");
});

test("network and database failures are not cached", async () => {
  let attempts = 0;
  const cache = createSingleFlightCache(async () => {
    if (++attempts === 1) throw new Error("db unavailable");
    return "recovered";
  });
  await assert.rejects(cache.get(), /unavailable/);
  assert.equal(await cache.get(), "recovered");
  assert.equal(attempts, 2);
});
