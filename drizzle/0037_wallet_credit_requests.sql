-- Wallet credits are requested by one admin and approved by a different admin before they post.
CREATE TABLE IF NOT EXISTS "wallet_credit_requests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id"),
  "amount" numeric(10, 2) NOT NULL,
  "reason" text NOT NULL,
  "requested_by_id" uuid NOT NULL REFERENCES "users"("id"),
  "requested_at" timestamp with time zone DEFAULT now() NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "decided_by_id" uuid REFERENCES "users"("id"),
  "decided_at" timestamp with time zone,
  "decision_note" text,
  "wallet_entry_id" uuid
);
CREATE INDEX IF NOT EXISTS "wallet_credit_requests_status_idx" ON "wallet_credit_requests" ("status", "requested_at");
