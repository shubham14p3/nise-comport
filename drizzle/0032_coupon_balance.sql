ALTER TABLE "coupons" ADD COLUMN IF NOT EXISTS "max_percent" integer;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "coupon_credits" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "coupon_id" uuid NOT NULL REFERENCES "coupons"("id") ON DELETE CASCADE,
  "reference" text NOT NULL,
  "amount" numeric(10,2) NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "coupon_credits_reference_unique" ON "coupon_credits" ("reference");
