ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "from_records" boolean DEFAULT false NOT NULL;
