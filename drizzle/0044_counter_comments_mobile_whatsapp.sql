CREATE TABLE IF NOT EXISTS "counter_comments" (
 "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
 "visit_id" uuid NOT NULL REFERENCES "counter_visits"("id") ON DELETE CASCADE,
 "author_id" uuid NOT NULL REFERENCES "users"("id"),
 "body" text NOT NULL,
 "client_key" uuid NOT NULL UNIQUE,
 "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "counter_comments_visit_created_idx" ON "counter_comments" ("visit_id", "created_at", "id");
CREATE OR REPLACE FUNCTION nise_match_mobile_whatsapp() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 NEW.whatsapp := NEW.phone;
 RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS nise_mobile_whatsapp ON "users";
CREATE TRIGGER nise_mobile_whatsapp BEFORE INSERT OR UPDATE OF phone, whatsapp ON "users"
FOR EACH ROW EXECUTE FUNCTION nise_match_mobile_whatsapp();
UPDATE "users" SET "whatsapp" = "phone" WHERE "whatsapp" IS DISTINCT FROM "phone";
