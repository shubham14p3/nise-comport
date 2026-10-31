import assert from "node:assert/strict";
import { test } from "node:test";
import { coalesceInFlight, requestFlightKey } from "../src/lib/inflight-requests.ts";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((ok, fail) => { resolve = ok; reject = fail; });
  return { promise, resolve, reject };
}

test("rapid identical clicks start exactly one backend request", async () => {
  const pending = new Map<string, Promise<unknown>>();
  const gate = deferred<string>();
  let calls = 0;
  const send = () => coalesceInFlight(pending, requestFlightKey("signin", { email: "a@test.invalid" }), () => {
    calls++;
    return gate.promise;
  });
  const one = send();
  const two = send();
  const three = send();
  assert.strictEqual(one, two);
  assert.strictEqual(one, three);
  await Promise.resolve();
  assert.equal(calls, 1);
  gate.resolve("ok");
  assert.equal(await one, "ok");
  assert.equal(await two, "ok");
});

test("different records and payloads are never locked together", async () => {
  const pending = new Map<string, Promise<unknown>>();
  let calls = 0;
  const send = (id: string) => coalesceInFlight(pending, requestFlightKey("save", { id }), async () => ++calls);
  assert.deepEqual(await Promise.all([send("record-a"), send("record-b")]), [1, 2]);
});

test("failed requests are cleared so the user can retry", async () => {
  const pending = new Map<string, Promise<unknown>>();
  const gate = deferred<string>();
  let calls = 0;
  const key = requestFlightKey("pay", { id: 42 });
  const run = () => coalesceInFlight(pending, key, () => { calls++; return gate.promise; });
  const first = run();
  const second = run();
  await Promise.resolve();
  assert.equal(calls, 1);
  gate.reject(new Error("temporarily unavailable"));
  await assert.rejects(first);
  await assert.rejects(second);
  assert.equal(pending.size, 0);
  assert.equal(await coalesceInFlight(pending, key, async () => { calls++; return "retry ok"; }), "retry ok");
  assert.equal(calls, 2);
});

test("a successful request can be intentionally run again after completion", async () => {
  const pending = new Map<string, Promise<unknown>>();
  let calls = 0;
  const run = () => coalesceInFlight(pending, "refresh", async () => ++calls);
  assert.equal(await run(), 1);
  assert.equal(await run(), 2);
});
