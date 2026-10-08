CREATE TABLE IF NOT EXISTS "record_claims" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "mobile_hash" text NOT NULL,
  "matched_name" text,
  "claimed_name" text NOT NULL,
  "method" text NOT NULL,
  "whatsapp_code" text,
  "status" text DEFAULT 'pending' NOT NULL,
  "decided_by" uuid,
  "decided_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "record_claims" ADD CONSTRAINT "record_claims_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "record_claims" ADD CONSTRAINT "record_claims_decided_by_users_id_fk" FOREIGN KEY ("decided_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "record_claims_status_idx" ON "record_claims" ("status");
