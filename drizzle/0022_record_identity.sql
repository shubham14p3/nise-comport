ALTER TABLE "customer_records" ADD COLUMN IF NOT EXISTS "identity_hash" text;--> statement-breakpoint
ALTER TABLE "customer_records" ADD COLUMN IF NOT EXISTS "removed_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "customer_records_identity_idx" ON "customer_records" ("identity_hash");--> statement-breakpoint
ALTER TABLE "record_imports" ADD COLUMN IF NOT EXISTS "updated" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "record_imports" ADD COLUMN IF NOT EXISTS "removed" integer DEFAULT 0 NOT NULL;
