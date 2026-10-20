CREATE TABLE IF NOT EXISTS "hardware_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "kind" text DEFAULT 'item' NOT NULL,
  "group_slug" text NOT NULL,
  "name" text NOT NULL,
  "note" text DEFAULT '' NOT NULL,
  "image" text,
  "published" boolean DEFAULT true NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "hardware_items_group_name_unique" ON "hardware_items" ("group_slug", lower("name"));
