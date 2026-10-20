import assert from "node:assert/strict";
import test from "node:test";
import { checkMobile, claimExpiry, claimIsOpen, claimReminderDue, generatePin, isPlaceholderEmail, isWeakPin, missingDetails, ownRecordView, pinProblem, placeholderEmail, promptDue, rewardReference, typedMobile } from "../src/lib/mobile-login-core.ts";

test("mobile numbers: formats and junk", () => {
  for (const good of ["9876543210", "98765 43210", "98765-43210", "+91 98765 43210", "919876543210", "09876543210", "+91-(98765)-43210", "6000000001"]) {
    const result = checkMobile(good); assert.ok(result.ok, good); if (result.ok) assert.equal(result.e164, `+91${result.digits}`);
  }
  assert.equal((checkMobile("+91 98765 43210") as { digits: string }).digits, "9876543210");
  for (const bad of ["", "98765", "987654321", "98765432101", "5876543210", "1234567890", "9999999999", "0000000000", "98765abcde", "98765 4321x", "++919876543210x"]) assert.equal(checkMobile(bad).ok, false, bad);
  assert.match((checkMobile("98765") as { error: string }).error, /10 digits/);
});

test("typing in the mobile box keeps ten digits", () => {
  assert.equal(typedMobile("+91 98765 43210"), "9876543210");
  assert.equal(typedMobile("98a76-5432109999"), "9876543210");
  assert.equal(typedMobile("919876543210"), "9876543210");
  assert.equal(typedMobile("09876543210"), "9876543210");
});

test("PINs", () => {
  assert.equal(pinProblem("123456"), ""); assert.ok(pinProblem("12345")); assert.ok(pinProblem("12345a")); assert.ok(pinProblem("1234567"));
  assert.ok(isWeakPin("111111") && isWeakPin("123456") && isWeakPin("987654") && !isWeakPin("482915"));
  const queue = [0, 111111, 123456, 482915];
  assert.equal(generatePin(() => queue.shift() ?? 7), "482915");
  assert.match(generatePin((n) => Math.floor(Math.random() * n)), /^\d{6}$/);
});

test("claims last seven days and remind after two", () => {
  const created = new Date("2026-10-20T00:00:00Z"); const expiresAt = claimExpiry(created);
  assert.equal(expiresAt.toISOString(), "2026-10-27T00:00:00.000Z");
  const claim = { status: "pending", createdAt: created, remindedAt: null, expiresAt };
  assert.equal(claimReminderDue(claim, new Date("2026-10-21T23:00:00Z")), false);
  assert.equal(claimReminderDue(claim, new Date("2026-10-22T00:00:00Z")), true);
  assert.equal(claimReminderDue({ ...claim, remindedAt: new Date() }, new Date("2026-10-23T00:00:00Z")), false);
  assert.equal(claimReminderDue({ ...claim, status: "approved" }, new Date("2026-10-23T00:00:00Z")), false);
  assert.equal(claimIsOpen(claim, new Date("2026-10-26T23:00:00Z")), true);
  assert.equal(claimIsOpen(claim, new Date("2026-10-27T00:00:01Z")), false);
});

test("placeholder emails and missing details", () => {
  assert.ok(isPlaceholderEmail(placeholderEmail("9876543210"))); assert.ok(!isPlaceholderEmail("a@b.com")); assert.ok(!isPlaceholderEmail(null));
  assert.deepEqual(missingDetails({ name: "Asha", email: placeholderEmail("9876543210"), phone: "+919876543210", phoneVerifiedAt: null }), ["email", "mobile", "whatsapp"]);
  assert.deepEqual(missingDetails({ name: "Asha", email: "a@b.com", emailVerifiedAt: new Date(), phone: "+919876543210", phoneVerifiedAt: new Date(), whatsapp: "+919876543210" }), []);
  assert.ok(missingDetails({ name: "", email: "a@b.com", emailVerifiedAt: new Date() }).includes("name"));
});

test("verify prompt timing", () => {
  const start = 1_000_000;
  assert.equal(promptDue(start, null, start + 60_000), false);
  assert.equal(promptDue(start, null, start + 4 * 60_000), true);
  assert.equal(promptDue(start, start + 4 * 60_000, start + 3600_000), false);
  assert.equal(promptDue(start, start + 4 * 60_000, start + 25 * 3600_000), true);
});

test("customers see a first name and the service only", () => {
  const view = ownRecordView({ id: "1", service: "insurance", name: "RAMESH KUMAR SINGH", recordDate: "2025-01-02", renewalOn: "2026-01-02", vehicle: "bike" });
  assert.deepEqual(Object.keys(view).sort(), ["date", "id", "name", "nextRenewal", "service", "vehicle"]);
  assert.equal(view.name, "RAMESH");
  assert.equal(rewardReference("email", "u1"), "verify:email:u1");
});
