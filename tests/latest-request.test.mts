import assert from "node:assert/strict";
import { test } from "node:test";
import { createLatestRequest } from "../src/lib/latest-request.ts";

test("late results cannot replace a newer page or conversation", async () => {
  const gate = createLatestRequest();
  let finishOld!: (value: string) => void;
  let displayed = "";
  const oldCurrent = gate.begin();
  const old = new Promise<string>(resolve => { finishOld = resolve; }).then(value => { if (oldCurrent()) displayed = value; });
  const current = gate.begin();
  if (current()) displayed = "new page";
  finishOld("old page");
  await old;
  assert.equal(displayed, "new page");
  assert.equal(current(), true);
});

test("unmount or navigation invalidates pending success and error handlers", () => {
  const gate = createLatestRequest();
  const current = gate.begin();
  gate.invalidate();
  assert.equal(current(), false);
  assert.equal(gate.begin()(), true);
});
