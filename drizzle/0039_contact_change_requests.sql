-- Staff email/mobile changes wait for an admin's approval (admin changes apply directly).
CREATE TABLE IF NOT EXISTS "contact_change_requests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id"),
  "new_email" text NOT NULL,
  "new_phone" text,
  "requested_by_id" uuid NOT NULL REFERENCES "users"("id"),
  "requested_at" timestamp with time zone DEFAULT now() NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "decided_by_id" uuid REFERENCES "users"("id"),
  "decided_at" timestamp with time zone,
  "decision_note" text
);
CREATE INDEX IF NOT EXISTS "contact_change_requests_status_idx" ON "contact_change_requests" ("status", "requested_at");
