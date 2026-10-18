ALTER TABLE "service_requests" ADD COLUMN IF NOT EXISTS "official_reference" text;
--> statement-breakpoint
ALTER TABLE "service_requests" ADD COLUMN IF NOT EXISTS "official_reference_label" text;
--> statement-breakpoint
ALTER TABLE "service_requests" ADD COLUMN IF NOT EXISTS "official_reference_set_at" timestamp with time zone;
