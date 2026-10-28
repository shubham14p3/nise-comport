-- Welcome credit (₹100 wallet, 10% off every bill) for first-time customers, granted after verification.
CREATE TABLE IF NOT EXISTS "welcome_credits" (
  "user_id" uuid PRIMARY KEY REFERENCES "users"("id"),
  "phone" text,
  "email" text,
  "nudge_count" integer DEFAULT 0 NOT NULL,
  "granted_at" timestamp with time zone,
  "celebrated_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "welcome_credits_phone_idx" ON "welcome_credits" ("phone");
CREATE INDEX IF NOT EXISTS "welcome_credits_email_idx" ON "welcome_credits" ("email");
