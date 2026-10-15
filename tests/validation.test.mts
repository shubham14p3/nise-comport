import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanName, formatPhone, isIndianPin, looksLikeEmail, normalizeEmail, normalizePhone, passwordProblem } from "../src/lib/validation.ts";

test("Indian phone numbers in any common format become +91 E.164", () => {
  for (const input of ["9876543210", "98765 43210", "098765-43210", "+91 98765 43210", "919876543210", "+91-98765-43210", "(0)9876543210", "0091 9876543210"]) {
    assert.equal(normalizePhone(input), "+919876543210", input);
  }
  assert.equal(normalizePhone("0657-2917622"), "+916572917622");
  assert.equal(normalizePhone("+44 20 7946 0958"), "+442079460958");
});

test("impossible phone numbers are rejected", () => {
  for (const input of ["", "12345", "1234567890", "0000000000", "+91 12345 67890", "98765abc10", "9876543210123456", "+0 123"]) {
    assert.equal(normalizePhone(input), null, input);
  }
  assert.equal(formatPhone("+919876543210"), "+91 98765 43210");
  assert.equal(formatPhone(null), "");
});

test("password rules block weak and personal passwords", () => {
  assert.match(passwordProblem("short"), /at least 10/);
  assert.match(passwordProblem("aaaaaaaaaaaa"), /repeat/);
  assert.match(passwordProblem("1234567890"), /common|sequence/);
  assert.match(passwordProblem("Password123"), /common/);
  assert.match(passwordProblem("priya.kumari2026", { email: "priya.kumari@example.com" }), /email/);
  assert.match(passwordProblem("priyanka123!", { name: "Priyanka Das" }), /name/);
  assert.equal(passwordProblem("tea at kharangajhar 7"), "");
  assert.equal(passwordProblem("x".repeat(129)).length > 0, true);
});

test("emails are normalised and sanity-checked", () => {
  assert.equal(normalizeEmail("  Priya@Example.COM "), "priya@example.com");
  assert.equal(looksLikeEmail("priya@example.com"), true);
  for (const bad of ["priya", "priya@", "@example.com", "priya@example", "pri ya@example.com", "priya@@example.com", "priya..k@example.com"]) assert.equal(looksLikeEmail(bad), false, bad);
});

test("names lose control characters and extra spaces; PIN codes are validated", () => {
  assert.equal(cleanName("  Priya\t\nKumari  "), "Priya Kumari");
  assert.equal(isIndianPin("831004"), true);
  assert.equal(isIndianPin("031004"), false);
  assert.equal(isIndianPin("83100"), false);
});
