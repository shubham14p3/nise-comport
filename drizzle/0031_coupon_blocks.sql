CREATE TABLE IF NOT EXISTS "coupon_blocks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "coupon_id" uuid REFERENCES "coupons"("id") ON DELETE CASCADE,
  "reason" text,
  "created_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "coupon_blocks_user_coupon_unique" ON "coupon_blocks" ("user_id", "coupon_id") WHERE "coupon_id" IS NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "coupon_blocks_user_all_unique" ON "coupon_blocks" ("user_id") WHERE "coupon_id" IS NULL;
