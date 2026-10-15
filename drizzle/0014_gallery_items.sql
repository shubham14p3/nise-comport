CREATE TABLE IF NOT EXISTS "gallery_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"src" text NOT NULL,
	"object_key" text,
	"tag" text DEFAULT 'shop' NOT NULL,
	"title" text NOT NULL,
	"alt" text NOT NULL,
	"width" integer DEFAULT 0 NOT NULL,
	"height" integer DEFAULT 0 NOT NULL,
	"hidden" boolean DEFAULT false NOT NULL,
	"hash" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "gallery_items" ADD CONSTRAINT "gallery_items_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "gallery_items_src_unique" ON "gallery_items" USING btree ("src");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "gallery_items_tag_idx" ON "gallery_items" USING btree ("tag");
