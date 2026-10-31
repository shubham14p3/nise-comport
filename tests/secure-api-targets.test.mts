import assert from "node:assert/strict";
import { test } from "node:test";
import { targetFor } from "../src/lib/secure-api-targets.ts";

const paged = ["D4q8M2wS7kF1", "C2m7R4vN9kP6", "W8r2T5yN1cF6", "C9p2W6mH4xB8", "Y6k1D8pT3vN5", "A8s5L2nR7vE4", "B5dY8rN2cV6w"];
for (const operation of paged) test(`${operation} forwards pagination to the real endpoint`, () => {
  const target = targetFor(operation, { q: "a & b", page: 3, pageSize: 50 });
  assert.equal(target?.method, "GET");
  const url = new URL(target!.path, "http://local.test");
  assert.equal(url.searchParams.get("page"), "3");
  assert.equal(url.searchParams.get("pageSize"), "50");
});

test("print and service request pages remain independent", () => {
  const url = new URL(targetFor("J2w7L5pD9nV4", { jobPage: 2, requestPage: 7, pageSize: 10, q: "a & b", status: "history" })!.path, "http://local.test");
  assert.equal(url.searchParams.get("jobPage"), "2");
  assert.equal(url.searchParams.get("requestPage"), "7");
  assert.equal(url.searchParams.get("pageSize"), "10");
  assert.equal(url.searchParams.get("q"), "a & b");
  assert.equal(url.searchParams.get("status"), "history");
});

test("wallet forwards customer ledger, search and its size parameter", () => {
  const url = new URL(targetFor("L9w5A3sJ7qP2", { userId: "customer-id", q: "a+b", page: 2, size: 10 })!.path, "http://local.test");
  assert.equal(url.searchParams.get("userId"), "customer-id");
  assert.equal(url.searchParams.get("q"), "a+b");
  assert.equal(url.searchParams.get("page"), "2");
  assert.equal(url.searchParams.get("size"), "10");
});

test("pagination is finite, integral, capped and page size is restricted", () => {
  for (const [page, expected] of [[-4, "0"], [2.8, "2"], [Infinity, "0"], [NaN, "0"], [99999999, "100000"]] as const) {
    const url = new URL(targetFor("D4q8M2wS7kF1", { page, pageSize: 999999 })!.path, "http://local.test");
    assert.equal(url.searchParams.get("page"), expected);
    assert.equal(url.searchParams.get("pageSize"), "20");
  }
});

test("customer detail and record imports retain their target and selector", () => {
  const customer = new URL(targetFor("C2m7R4vN9kP6", { id: "chosen", page: 3 })!.path, "http://local.test");
  assert.equal(customer.searchParams.get("id"), "chosen");
  const imports = new URL(targetFor("W8r2T5yN1cF6", { imports: true })!.path, "http://local.test");
  assert.equal(imports.searchParams.get("imports"), "1");
});

test("writes stay unchanged and arbitrary operations remain rejected", () => {
  assert.deepEqual(targetFor("T7s3F8mP2cX6", { page: 100 }), { method: "POST", path: "/api/admin/wallet-credit" });
  assert.equal(targetFor("not-an-operation", {}), null);
  assert.equal(targetFor("toString", {}), null);
  assert.equal(targetFor("__proto__", {}), null);
});

test('inbox and claims gateway preserves calendar filters and independent pages', () => {
  for (const operation of ['I5x2N8kQ3wT6', 'Z2n5G8yL6bK3']) {
    const url = new URL(targetFor(operation, { from: '2026-10-29', to: '2026-10-31', feedPage: '4', leadPage: '2' })!.path, 'http://local.test');
    assert.equal(url.searchParams.get('from'), '2026-10-29');
    assert.equal(url.searchParams.get('to'), '2026-10-31');
    if (operation === 'I5x2N8kQ3wT6') { assert.equal(url.searchParams.get('feedPage'), '4'); assert.equal(url.searchParams.get('leadPage'), '2'); }
  }
});

test('counter comment reads preserve the exact visit and cursor; writes use a dedicated endpoint',()=>{
 const target=targetFor('N4v7C2mP8qL5',{visitId:'visit-id',before:'cursor-id'});
 const url=new URL(target!.path,'http://local.test');assert.equal(url.searchParams.get('visitId'),'visit-id');assert.equal(url.searchParams.get('before'),'cursor-id');
 assert.deepEqual(targetFor('S8r3W6kL2pN9',{}),{method:'POST',path:'/api/counter-comments'});
});
