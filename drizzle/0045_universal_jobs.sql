-- 0045: universal, backward-compatible job tracking. Run only after a fresh off-repo backup.
-- Existing service, print, counter and imported-record IDs and references are retained.
CREATE TABLE IF NOT EXISTS "jobs" (
 "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
 "code" text NOT NULL DEFAULT ('NCJ-' || to_char(now(), 'YY') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12))),
 "source_kind" text NOT NULL,
 "source_id" uuid NOT NULL,
 "user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
 "service_slug" text,
 "service_name" text NOT NULL,
 "source_reference" text,
 "status" text NOT NULL,
 "missing_documents" jsonb NOT NULL DEFAULT '[]'::jsonb,
 "internal_note" text,
 "created_at" timestamptz NOT NULL DEFAULT now(),
 "updated_at" timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT "jobs_source_kind_check" CHECK ("source_kind" IN ('service','print','counter','historical')),
 CONSTRAINT "jobs_missing_documents_array" CHECK (jsonb_typeof("missing_documents") = 'array')
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "jobs_code_unique" ON "jobs"("code");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "jobs_source_unique" ON "jobs"("source_kind", "source_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "jobs_user_created_idx" ON "jobs"("user_id", "created_at" DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "jobs_status_updated_idx" ON "jobs"("status", "updated_at" DESC);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "job_events" (
 "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
 "job_id" uuid NOT NULL REFERENCES "jobs"("id") ON DELETE CASCADE,
 "actor_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
 "kind" text NOT NULL,
 "from_status" text,
 "to_status" text,
 "note" text,
 "public_visible" boolean NOT NULL DEFAULT false,
 "created_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "job_events_job_created_idx" ON "job_events"("job_id", "created_at" DESC);
--> statement-breakpoint
-- Backfill is idempotent by (source_kind, source_id); no original rows are modified.
INSERT INTO "jobs" ("source_kind", "source_id", "user_id", "service_slug", "service_name", "source_reference", "status", "created_at", "updated_at")
SELECT 'service', r."id", r."user_id", r."service_slug", r."service_name", r."reference", r."status", r."created_at", r."updated_at"
FROM "service_requests" r
WHERE NOT (r."details"->>'source' = 'counter' AND r."details" ? 'counterVisitId')
ON CONFLICT ("source_kind", "source_id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "jobs" ("source_kind", "source_id", "user_id", "service_slug", "service_name", "source_reference", "status", "created_at", "updated_at")
SELECT 'print', p."id", p."user_id", 'printing', 'Print: ' || p."file_name", p."reference", p."status", p."created_at", p."updated_at"
FROM "print_jobs" p WHERE true ON CONFLICT ("source_kind", "source_id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "jobs" ("source_kind", "source_id", "user_id", "service_slug", "service_name", "source_reference", "status", "created_at", "updated_at")
SELECT 'counter', v."id", v."user_id", v."service_slug", v."service_name", 'CV-' || upper(v."id"::text), 'recorded', v."created_at", v."created_at"
FROM "counter_visits" v WHERE true ON CONFLICT ("source_kind", "source_id") DO NOTHING;
--> statement-breakpoint
-- A legacy row is a historical record, not necessarily an open customer request.
-- Never guess its user_id from a phone hash, and do not decrypt the import.
INSERT INTO "jobs" ("source_kind", "source_id", "service_slug", "service_name", "source_reference", "status", "created_at", "updated_at")
SELECT 'historical', r."id", r."service", r."service", NULL, 'historical',
 COALESCE(r."record_date"::timestamptz, r."created_at"), r."created_at"
FROM "customer_records" r WHERE true ON CONFLICT ("source_kind", "source_id") DO NOTHING;
--> statement-breakpoint
-- Database trigger keeps every new source insert covered without altering dozens of app writers.
-- Status changes in existing service/print workflows also synchronize into the registry.
CREATE OR REPLACE FUNCTION "nise_sync_universal_job"() RETURNS trigger AS $$
DECLARE
 k text := TG_ARGV[0];
 name_value text;
 slug_value text;
 ref_value text;
 status_value text;
 owner_value uuid;
 born timestamptz;
 modified timestamptz;
 job_pk uuid;
 old_value text;
BEGIN
 IF k = 'service' THEN
   -- A payment-only request created from an existing counter visit is NOT another job.
   -- Its CV-reference and details.counterVisitId link it to the original counter job.
   IF NEW.details->>'source' = 'counter' AND NEW.details ? 'counterVisitId' THEN
     RETURN NEW;
   END IF;
   name_value := NEW.service_name; slug_value := NEW.service_slug;
   ref_value := NEW.reference; status_value := NEW.status; owner_value := NEW.user_id;
   born := NEW.created_at; modified := NEW.updated_at;
 ELSIF k = 'print' THEN
   name_value := 'Print: ' || NEW.file_name; slug_value := 'printing';
   ref_value := NEW.reference; status_value := NEW.status; owner_value := NEW.user_id;
   born := NEW.created_at; modified := NEW.updated_at;
 ELSIF k = 'counter' THEN
   name_value := NEW.service_name; slug_value := NEW.service_slug;
   ref_value := 'CV-' || upper(NEW.id::text); status_value := 'recorded'; owner_value := NEW.user_id;
   born := NEW.created_at; modified := NEW.created_at;
 ELSIF k = 'historical' THEN
   name_value := NEW.service; slug_value := NEW.service;
   ref_value := NULL; status_value := 'historical'; owner_value := NULL;
   born := COALESCE(NEW.record_date::timestamptz, NEW.created_at); modified := NEW.created_at;
 ELSE
   RAISE EXCEPTION 'Unsupported job source kind: %', k;
 END IF;
 SELECT j.status INTO old_value FROM jobs j WHERE j.source_kind = k AND j.source_id = NEW.id;
 INSERT INTO jobs (source_kind, source_id, user_id, service_slug, service_name, source_reference, status, created_at, updated_at)
 VALUES (k, NEW.id, owner_value, slug_value, name_value, ref_value, status_value, born, modified)
 ON CONFLICT (source_kind, source_id) DO UPDATE SET
  user_id = EXCLUDED.user_id, service_slug = EXCLUDED.service_slug,
  service_name = EXCLUDED.service_name, source_reference = EXCLUDED.source_reference,
  status = EXCLUDED.status, updated_at = EXCLUDED.updated_at
 RETURNING id INTO job_pk;
 IF TG_OP = 'INSERT' THEN
   INSERT INTO job_events (job_id, kind, to_status, note, public_visible)
   VALUES (job_pk, 'created', status_value, 'Job created', true);
 ELSIF old_value IS DISTINCT FROM status_value THEN
   INSERT INTO job_events (job_id, kind, from_status, to_status, note, public_visible)
   VALUES (job_pk, 'status', old_value, status_value, 'Status updated', true);
 END IF;
 RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
DROP TRIGGER IF EXISTS "nise_service_job_sync" ON "service_requests";
--> statement-breakpoint
CREATE TRIGGER "nise_service_job_sync" AFTER INSERT OR UPDATE OF "status", "service_slug", "service_name", "reference", "user_id"
 ON "service_requests" FOR EACH ROW EXECUTE FUNCTION "nise_sync_universal_job"('service');
--> statement-breakpoint
DROP TRIGGER IF EXISTS "nise_print_job_sync" ON "print_jobs";
--> statement-breakpoint
CREATE TRIGGER "nise_print_job_sync" AFTER INSERT OR UPDATE OF "status", "file_name", "reference", "user_id"
 ON "print_jobs" FOR EACH ROW EXECUTE FUNCTION "nise_sync_universal_job"('print');
--> statement-breakpoint
DROP TRIGGER IF EXISTS "nise_counter_job_sync" ON "counter_visits";
--> statement-breakpoint
CREATE TRIGGER "nise_counter_job_sync" AFTER INSERT ON "counter_visits"
 FOR EACH ROW EXECUTE FUNCTION "nise_sync_universal_job"('counter');
--> statement-breakpoint
DROP TRIGGER IF EXISTS "nise_historical_job_sync" ON "customer_records";
--> statement-breakpoint
CREATE TRIGGER "nise_historical_job_sync" AFTER INSERT ON "customer_records"
 FOR EACH ROW EXECUTE FUNCTION "nise_sync_universal_job"('historical');
