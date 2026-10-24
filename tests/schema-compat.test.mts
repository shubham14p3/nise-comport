import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { migrationSteps, planRepair, safeSubsetForPopulatedPartials } from "../scripts/schema-compat-core.mjs";

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

test("partially created record_claims table gets exact SQL definitions only with empty-table guard", () => {
  const files = [{
    name: "0029_mobile_claims.sql",
    content: `CREATE TABLE IF NOT EXISTS "record_claims" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
      "phone" text NOT NULL,
      "status" text DEFAULT 'pending' NOT NULL,
      "matched_count" integer DEFAULT 0 NOT NULL,
      "pin_enc" text,
      "method" text,
      "code_hash" text,
      "code_expires_at" timestamp with time zone,
      "code_attempts" integer DEFAULT 0 NOT NULL,
      "expires_at" timestamp with time zone NOT NULL,
      "reminded_at" timestamp with time zone,
      "decided_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
      "decided_at" timestamp with time zone,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL
    );
    --> statement-breakpoint
    CREATE UNIQUE INDEX IF NOT EXISTS "record_claims_one_open" ON "record_claims" ("user_id", "phone") WHERE "status" IN ('pending', 'approved');`,
  }];
  const steps = migrationSteps(files);
  const original = steps.find((s) => s.kind === "table");
  assert.equal(original.columns.length, 15);
  const expected = new Map([["record_claims", new Set(original.columns)]]);
  const existing = new Map([["record_claims", new Set([
    "id", "user_id", "status", "method", "decided_by", "decided_at", "created_at",
  ])]]);
  const plan = planRepair(expected, existing, steps);
  assert.deepEqual(plan.blockers, []);
  assert.deepEqual(plan.partialTables, ["record_claims"]);
  const adds = plan.pending.filter((s) => s.kind === "partial-column");
  assert.deepEqual(adds.map((s) => s.column), [
    "phone", "matched_count", "pin_enc", "code_hash", "code_expires_at",
    "code_attempts", "expires_at", "reminded_at",
  ]);
  assert.ok(adds.every((s) => s.requiresEmptyTable && s.sql.startsWith('ALTER TABLE "record_claims" ADD COLUMN IF NOT EXISTS')));
  assert.match(adds.find((s) => s.column === "phone").sql, /text NOT NULL;/);
  assert.match(adds.find((s) => s.column === "expires_at").sql, /timestamp with time zone NOT NULL;/);
  assert.ok(plan.pending.some((s) => s.kind === "index" && s.requiresEmptyTable));
});

test("CREATE TABLE definitions with numeric commas and JSON quoted commas stay intact", () => {
  const [table] = migrationSteps([{
    name: "test.sql",
    content: `CREATE TABLE "parts" (
      "id" uuid PRIMARY KEY,
      "amount" numeric(10, 2) NOT NULL,
      "flags" jsonb DEFAULT '{"en":"a,b"}'::jsonb NOT NULL,
      "label" text DEFAULT 'A, B'
    );`,
  }]);
  assert.deepEqual(table.columns, ["id", "amount", "flags", "label"]);
  const expected = new Map([["parts", new Set(table.columns)]]);
  const existing = new Map([["parts", new Set(["id"])]]);
  const plan = planRepair(expected, existing, [table]);
  assert.deepEqual(plan.blockers, []);
  assert.equal(plan.pending.filter((s) => s.kind === "partial-column").length, 3);
  assert.match(plan.pending.find((s) => s.column === "amount").sql, /numeric\(10, 2\)/);
  assert.match(plan.pending.find((s) => s.column === "flags").sql, /a,b/);
});

test("safe-only mode never applies SQL against a populated partial table", () => {
  const plan = {
    pending: [
      { kind: "partial-column", table: "record_claims", column: "phone", sql: "DO NOT RUN" },
      { kind: "index", table: "record_claims", sql: "DO NOT RUN" },
      { kind: "table", table: "hardware_items", sql: "CREATE TABLE IF NOT EXISTS hardware_items (...)" },
      { kind: "column", table: "coupons", column: "max_percent", sql: "ALTER TABLE coupons ADD COLUMN max_percent integer" },
    ],
  };
  const result = safeSubsetForPopulatedPartials(plan, ["record_claims"]);
  assert.ok(result.skipped.has("record_claims"));
  assert.deepEqual(result.executableSteps.map((s) => s.table), ["hardware_items", "coupons"]);
  assert.ok(result.executableSteps.every((s) => !s.sql.includes("DO NOT RUN")));
});

test("isolate modern verified mobile claims without touching 9890 legacy register approvals", () => {
  const sql = readFileSync(new URL("../drizzle/0034_isolated_mobile_claims.sql", import.meta.url), "utf8");
  const steps = migrationSteps([{ name: "0034_isolated_mobile_claims.sql", content: sql }]);
  assert.deepEqual(steps.filter((s) => s.kind === "table").map((s) => s.table), [
    "mobile_record_claims", "mobile_record_flags",
  ]);
  assert.equal(steps.filter((s) => s.kind === "index").length, 4);
  assert.match(sql, /REFERENCES "mobile_record_claims"\("id"\)/);
  // ON DELETE CASCADE within a new foreign key is safe DDL, not a DELETE statement.
  assert.equal(/^\s*(?:INSERT\s+INTO|UPDATE\s+["a-z]|DELETE\s+FROM|DROP\s+(?:TABLE|INDEX)|TRUNCATE\s+)/im.test(sql), false);
  assert.equal(steps.some((s) => ["record_claims", "record_flags"].includes(s.table)), false);

  const expected = new Map(steps.filter((s) => s.kind === "table").map((s) => [s.table, new Set(s.columns)]));
  const populatedLegacy = new Map([["record_claims", new Set(["id", "user_id", "mobile_hash", "claimed_name", "matched_name", "status"])]]);
  const plan = planRepair(expected, populatedLegacy, steps);
  assert.deepEqual(plan.blockers, []);
  assert.deepEqual(plan.partialTables, []);
  assert.equal(plan.pending.filter((s) => s.kind === "table").length, 2);
  assert.equal(plan.pending.every((s) => s.table.startsWith("mobile_record_")), true);
});
