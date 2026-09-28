ALTER TABLE "users" ADD COLUMN "city" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "state" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "postal_code" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "profile_summary" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "preferred_contact" text DEFAULT 'email' NOT NULL;