ALTER TABLE "testimonials" ADD COLUMN IF NOT EXISTS "source_id" text;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "testimonials_source_unique_idx" ON "testimonials" USING btree ("source","source_id");
