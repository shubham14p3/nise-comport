ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "email" text;
--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "email_consent" text DEFAULT 'unknown' NOT NULL;
--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "email_consent_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "birth_month" smallint;
--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "birth_day" smallint;
--> statement-breakpoint
ALTER TABLE "customer_records" ADD COLUMN IF NOT EXISTS "birth_month" smallint;
--> statement-breakpoint
ALTER TABLE "customer_records" ADD COLUMN IF NOT EXISTS "birth_day" smallint;
--> statement-breakpoint
ALTER TABLE "customer_records" ADD COLUMN IF NOT EXISTS "vehicle" text;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contacts_birthday_idx" ON "contacts" ("birth_month", "birth_day");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "customer_records_vehicle_renewal_idx" ON "customer_records" ("service", "renewal_on");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "outreach_log" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "contact_id" uuid REFERENCES "contacts"("id") ON DELETE CASCADE,
  "kind" text NOT NULL,
  "channel" text NOT NULL,
  "year" integer NOT NULL,
  "ref" text DEFAULT '' NOT NULL,
  "status" text DEFAULT 'sent' NOT NULL,
  "error" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "outreach_log_once" ON "outreach_log" ("contact_id", "kind", "channel", "year", "ref");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "outreach_settings" (
  "key" text PRIMARY KEY NOT NULL,
  "value" jsonb NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
