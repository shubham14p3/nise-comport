CREATE INDEX IF NOT EXISTS "wallet_entries_reference_idx" ON "wallet_entries" ("reference");
CREATE INDEX IF NOT EXISTS "counter_visits_created_idx" ON "counter_visits" ("created_at", "id");
CREATE INDEX IF NOT EXISTS "counter_visits_staff_created_idx" ON "counter_visits" ("staff_id", "created_at", "id");
