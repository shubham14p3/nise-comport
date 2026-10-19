CREATE TABLE IF NOT EXISTS "whatsapp_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone" text NOT NULL,
	"direction" text NOT NULL,
	"body" text NOT NULL,
	"sender" text DEFAULT 'customer' NOT NULL,
	"name" text,
	"user_id" uuid,
	"needs_human" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "whatsapp_messages_phone_created_idx" ON "whatsapp_messages" USING btree ("phone","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "whatsapp_messages_human_idx" ON "whatsapp_messages" USING btree ("needs_human","created_at");
