-- Isolated modern mobile-record claim workflow; never change legacy register approvals.
-- 2026-10-19 and 2026-10-24 backups confirm 9,890 distinct legacy
-- APPROVED register claims in public.record_claims. No ownership can be
-- inferred from those rows, so new phone claims use dedicated tables.
-- This migration contains schema-only DDL; no backfills or customer-row updates.
CREATE TABLE IF NOT EXISTS "mobile_record_claims" (
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
CREATE INDEX IF NOT EXISTS "mobile_record_claims_status_idx" ON "mobile_record_claims" ("status", "created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mobile_record_claims_user_idx" ON "mobile_record_claims" ("user_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "mobile_record_claims_one_open" ON "mobile_record_claims" ("user_id", "phone") WHERE "status" IN ('pending', 'approved');
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mobile_record_flags" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "claim_id" uuid REFERENCES "mobile_record_claims"("id") ON DELETE SET NULL,
  "record_id" uuid,
  "note" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mobile_record_flags_open_idx" ON "mobile_record_flags" ("resolved_at", "created_at");
