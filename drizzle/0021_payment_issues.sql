ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "failure_reason" text;
--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "issue_note" text;
--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "issue_raised_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "refund_choice" text;
--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "refund_status" text;
--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "refund_details" text;
--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "refund_paise" integer;
--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "refunded_at" timestamp with time zone;
