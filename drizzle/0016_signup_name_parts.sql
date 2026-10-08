ALTER TABLE "users" ADD COLUMN "first_name" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_name" text;--> statement-breakpoint
UPDATE "users" SET "first_name" = split_part("name", ' ', 1), "last_name" = NULLIF(trim(substr("name", length(split_part("name", ' ', 1)) + 2)), '') WHERE "first_name" IS NULL AND "name" <> '';
