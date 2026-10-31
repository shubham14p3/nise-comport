import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

test("0044 recovery targets the existing documented table, index and phone sync trigger", () => {
  const sql = readFileSync(new URL("../drizzle/0044_counter_comments_mobile_whatsapp.sql", import.meta.url), "utf8");
  assert.match(sql, /CREATE TABLE IF NOT EXISTS "counter_comments"/);
  assert.match(sql, /CREATE INDEX IF NOT EXISTS "counter_comments_visit_created_idx"/);
  assert.match(sql, /CREATE OR REPLACE FUNCTION nise_match_mobile_whatsapp\(\)/);
  assert.match(sql, /CREATE TRIGGER nise_mobile_whatsapp/);
  const bulkUpdate = 'UPDATE "users" SET "whatsapp" = "phone" WHERE "whatsapp" IS DISTINCT FROM "phone";';
  assert.ok(sql.trimEnd().endsWith(bulkUpdate));
  const structuralOnlySql = sql.trimEnd().slice(0, -bulkUpdate.length);
  assert.doesNotMatch(structuralOnlySql, /UPDATE "users" SET/);
  assert.match(structuralOnlySql, /CREATE TRIGGER nise_mobile_whatsapp/);
});

test("recovery script is fail-closed and preserves historical accounts and the Drizzle ledger", () => {
  const source = readFileSync(new URL("../scripts/counter-comments-repair.mjs", import.meta.url), "utf8");
  for (const required of ["--backup-file", "--confirm", "BEGIN", "COMMIT", "ROLLBACK", "job_count", "inspect()"]) {
    assert.ok(source.includes(required), "required safety check " + required);
  }
  assert.doesNotMatch(source, /await client\.query\(bulkUserUpdate\)/);
  assert.doesNotMatch(source, /INSERT INTO drizzle\.__drizzle_migrations|DELETE FROM drizzle\.__drizzle_migrations/);
});
