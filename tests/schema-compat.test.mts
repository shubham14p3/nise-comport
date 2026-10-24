import test from "node:test";
import assert from "node:assert/strict";
import { migrationSteps, planRepair } from "../scripts/schema-compat-core.mjs";

const sql = [
  { name: "0000_init.sql", content: `CREATE TABLE "users" (
    "id" uuid PRIMARY KEY NOT NULL,
    "email" text NOT NULL
  );--> statement-breakpoint
  CREATE TABLE "coupons" (
    "id" uuid PRIMARY KEY NOT NULL,
    "code" text NOT NULL
  );` },
  { name: "0001_additions.sql", content: `-- Add a coupon column without modifying existing rows.
    ALTER TABLE "coupons" ADD COLUMN "kind" text DEFAULT 'public' NOT NULL;
    --> statement-breakpoint
    CREATE TABLE IF NOT EXISTS "hardware_items" (
      "id" uuid PRIMARY KEY NOT NULL,
      "name" text NOT NULL
    );
    --> statement-breakpoint
    CREATE UNIQUE INDEX IF NOT EXISTS "hardware_items_name_unique" ON "hardware_items" ("name");
    --> statement-breakpoint
    INSERT INTO "coupons" ("code") VALUES ('MUST-NOT-RUN');
    --> statement-breakpoint
    DROP TABLE "users";` },
  { name: "0002_new.sql", content: `ALTER TABLE "hardware_items" ADD COLUMN IF NOT EXISTS "published" boolean DEFAULT true NOT NULL;` },
];

test("only additive SQL is included; dangerous seed/drop statements are excluded", () => {
  const steps = migrationSteps(sql);
  assert.deepEqual(steps.map((s) => s.kind), ["table", "table", "column", "table", "index", "column"]);
  assert.ok(steps.every((s) => !/\bINSERT\b|\bDROP\b/.test(s.sql)));
  assert.ok(steps.filter((s) => s.kind === "column").every((s) => /ADD COLUMN IF NOT EXISTS/.test(s.sql)));
  assert.ok(steps.filter((s) => s.kind === "table").every((s) => /CREATE TABLE IF NOT EXISTS/.test(s.sql)));
});

test("existing coupons are patched; missing hardware table and index are created", () => {
  const expected = new Map([
    ["users", new Set(["id", "email"])],
    ["coupons", new Set(["id", "code", "kind"])],
    ["hardware_items", new Set(["id", "name", "published"])],
  ]);
  const existing = new Map([
    ["users", new Set(["id", "email"])],
    ["coupons", new Set(["id", "code"])],
  ]);
  const plan = planRepair(expected, existing, migrationSteps(sql));
  assert.deepEqual(plan.blockers, []);
  assert.deepEqual(plan.pending.map((s) => `${s.kind}:${s.table}${s.column ? "." + s.column : ""}`),
    ["column:coupons.kind", "table:hardware_items", "column:hardware_items.published", "index:hardware_items"]);
  assert.equal(plan.pending.some((s) => /INSERT|DROP/.test(s.sql)), false);
});

test("already synchronized tables require no DDL", () => {
  const expected = new Map([["users", new Set(["id", "email"])]]);
  const existing = new Map([["users", new Set(["id", "email"])]]);
  const plan = planRepair(expected, existing, migrationSteps(sql));
  assert.equal(plan.pending.length, 0);
  assert.deepEqual(plan.blockers, []);
});

test("missing columns without a documented migration abort automatic sync", () => {
  const expected = new Map([["users", new Set(["id", "email", "missing_undocumented"])]]); 
  const existing = new Map([["users", new Set(["id", "email"])]]);
  const plan = planRepair(expected, existing, migrationSteps(sql));
  assert.equal(plan.pending.length, 0);
  assert.ok(plan.blockers.some((b) => b.includes("missing_undocumented")));
});

test("new mailbox tables may receive their deferred foreign keys", () => {
  const f = migrationSteps([{
    name: "0026_mailbox.sql",
    content: `CREATE TABLE IF NOT EXISTS "mail_tickets" ("id" uuid NOT NULL);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mail_messages" ("id" uuid NOT NULL, "ticket_id" uuid NOT NULL);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "mail_messages" ADD CONSTRAINT "mail_messages_ticket_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."mail_tickets"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  }]);
  const expected = new Map([["mail_tickets", new Set(["id"])], ["mail_messages", new Set(["id", "ticket_id"])]]);
  const plan = planRepair(expected, new Map(), f);
  assert.deepEqual(plan.blockers, []);
  assert.equal(plan.pending.at(-1).kind, "fk");
  assert.equal(plan.pending.at(-1).constraint, "mail_messages_ticket_fk");
});
