ALTER TABLE "email_campaigns" ADD COLUMN IF NOT EXISTS "audience" text DEFAULT 'yes' NOT NULL;--> statement-breakpoint
ALTER TABLE "email_campaigns" ADD COLUMN IF NOT EXISTS "audience_ids" jsonb;--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "consent_asked_at" timestamp with time zone;
