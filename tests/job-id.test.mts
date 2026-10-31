import test from "node:test";
import assert from "node:assert/strict";
import { extractJobCode, validJobCode } from "../src/lib/job-id.ts";

test("universal job codes accept case-insensitive WhatsApp text", () => {
  assert.equal(extractJobCode("status ncj-26-abcdef123456"), "NCJ-26-ABCDEF123456");
  assert.equal(validJobCode(" ncj-26-abcdef123456 "), "NCJ-26-ABCDEF123456");
});
test("job code must not accept SQL fragments, short IDs or legacy references", () => {
  assert.equal(validJobCode("NC-12345"), null);
  assert.equal(validJobCode("NCJ-26-12345"), null);
  assert.equal(validJobCode("NCJ-26-abcdef123456' OR TRUE"), null);
  assert.equal(extractJobCode("hello"), null);
});
