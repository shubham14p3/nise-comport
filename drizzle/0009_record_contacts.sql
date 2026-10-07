ALTER TABLE "customer_records" ADD COLUMN "phone_hashes" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "customer_records" ADD COLUMN "email_hash" text;--> statement-breakpoint
ALTER TABLE "customer_records" ADD COLUMN "contact_enc" text;--> statement-breakpoint
UPDATE "customer_records" SET "phone_hashes" = ARRAY["mobile_hash"] WHERE "mobile_hash" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "customer_records_phones_idx" ON "customer_records" USING gin ("phone_hashes");--> statement-breakpoint
CREATE INDEX "customer_records_email_idx" ON "customer_records" USING btree ("email_hash");
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "whatsapp" text;
