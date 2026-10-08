ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "email" text;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "email_campaigns" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "subject" text NOT NULL,
  "body" text NOT NULL,
  "image_type" text,
  "image_data" text,
  "status" text DEFAULT 'draft' NOT NULL,
  "send_at" timestamp with time zone,
  "total" integer DEFAULT 0 NOT NULL,
  "sent_count" integer DEFAULT 0 NOT NULL,
  "failed_count" integer DEFAULT 0 NOT NULL,
  "created_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "email_campaigns" ADD CONSTRAINT "email_campaigns_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "email_deliveries" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "campaign_id" uuid NOT NULL,
  "contact_id" uuid,
  "email" text NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "error" text,
  "sent_at" timestamp with time zone
);--> statement-breakpoint
ALTER TABLE "email_deliveries" ADD CONSTRAINT "email_deliveries_campaign_id_email_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."email_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_deliveries" ADD CONSTRAINT "email_deliveries_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "email_deliveries_campaign_email_idx" ON "email_deliveries" ("campaign_id", "email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_deliveries_status_idx" ON "email_deliveries" ("campaign_id", "status");
