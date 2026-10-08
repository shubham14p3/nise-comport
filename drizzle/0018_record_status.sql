ALTER TABLE "customer_records" ADD COLUMN "status" text DEFAULT 'new' NOT NULL;--> statement-breakpoint
ALTER TABLE "customer_records" ADD COLUMN "status_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "customer_records_service_status_idx" ON "customer_records" ("service", "status");
