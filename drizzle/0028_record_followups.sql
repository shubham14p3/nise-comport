CREATE TABLE IF NOT EXISTS "record_followups" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "record_id" uuid NOT NULL REFERENCES "customer_records"("id") ON DELETE cascade,
  "author_id" uuid REFERENCES "users"("id") ON DELETE set null,
  "by_staff" boolean DEFAULT false NOT NULL,
  "author_name" text NOT NULL,
  "body_enc" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "record_followups_record_idx" ON "record_followups" USING btree ("record_id","created_at");
CREATE INDEX IF NOT EXISTS "record_followups_author_idx" ON "record_followups" USING btree ("author_id","created_at");
