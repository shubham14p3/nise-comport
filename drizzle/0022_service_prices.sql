CREATE TABLE IF NOT EXISTS "service_prices" (
	"service_slug" text PRIMARY KEY NOT NULL,
	"amount" integer,
	"kind" text DEFAULT 'fixed' NOT NULL,
	"note" text,
	"updated_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "service_prices" ADD CONSTRAINT "service_prices_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
