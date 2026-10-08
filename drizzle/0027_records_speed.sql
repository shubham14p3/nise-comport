-- Faster service screens: year lists and pages are filtered by service and ordered by date,
-- the stage counts and status filters group by service and status.
CREATE INDEX IF NOT EXISTS "customer_records_service_date_idx" ON "customer_records" USING btree ("service","record_date" DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS "customer_records_service_status_idx" ON "customer_records" USING btree ("service","status");
