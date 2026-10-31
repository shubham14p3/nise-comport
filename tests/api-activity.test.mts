import assert from "node:assert/strict";
import { test } from "node:test";
import { getApiActivity, trackApiActivity } from "../src/lib/api-activity.ts";

test("shared loading count covers an in-flight action and resets on success", async () => {
  let done!: (value: string) => void;
  const promise = new Promise<string>((resolve) => { done = resolve; });
  const tracked = trackApiActivity(promise);
  assert.equal(getApiActivity(), 1);
  done("saved");
  assert.equal(await tracked, "saved");
  await Promise.resolve(); // async completion updates activity
  assert.equal(getApiActivity(), 0);
});

test("failed requests also release the global loading indicator", async () => {
  let reject!: (error: Error) => void;
  const promise = new Promise<void>((_resolve, fail) => { reject = fail; });
  const tracked = trackApiActivity(promise);
  assert.equal(getApiActivity(), 1);
  reject(new Error("unavailable"));
  await assert.rejects(tracked, /unavailable/);
  await Promise.resolve();
  assert.equal(getApiActivity(), 0);
});
