-- Walk-in counter visits: each visit records the bill, the 10% discount and how much of it came from the wallet.
CREATE TABLE IF NOT EXISTS "counter_visits" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id"),
  "staff_id" uuid NOT NULL REFERENCES "users"("id"),
  "service_slug" text NOT NULL,
  "service_name" text NOT NULL,
  "bill_paise" integer NOT NULL,
  "discount_paise" integer NOT NULL,
  "wallet_paise" integer NOT NULL,
  "collect_paise" integer NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "counter_visits_user_created_idx" ON "counter_visits" ("user_id", "created_at");
