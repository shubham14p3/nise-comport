CREATE TABLE IF NOT EXISTS "mail_tickets" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "number" integer GENERATED ALWAYS AS IDENTITY (sequence name "mail_tickets_number_seq" START WITH 1001 INCREMENT BY 1),
  "key" text NOT NULL,
  "user_id" uuid,
  "from_email" text NOT NULL,
  "from_name" text,
  "subject" text NOT NULL,
  "status" text DEFAULT 'open' NOT NULL,
  "source" text DEFAULT 'site' NOT NULL,
  "link_kind" text,
  "link_id" uuid,
  "link_reference" text,
  "staff_unread" boolean DEFAULT true NOT NULL,
  "customer_unread" boolean DEFAULT false NOT NULL,
  "last_message_at" timestamp with time zone DEFAULT now() NOT NULL,
  "last_customer_at" timestamp with time zone,
  "last_staff_at" timestamp with time zone,
  "auto_close_at" timestamp with time zone,
  "closed_at" timestamp with time zone,
  "close_reason" text,
  "close_notice_sent_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mail_messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "ticket_id" uuid NOT NULL,
  "direction" text NOT NULL,
  "author_id" uuid,
  "author_name" text,
  "body" text NOT NULL,
  "source" text DEFAULT 'site' NOT NULL,
  "rfc_message_id" text,
  "email_status" text DEFAULT 'none' NOT NULL,
  "email_attempts" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mail_attachments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "ticket_id" uuid,
  "message_id" uuid,
  "uploader_id" uuid,
  "object_key" text NOT NULL,
  "name" text NOT NULL,
  "mime_type" text NOT NULL,
  "size_bytes" integer NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mail_sync" (
  "id" text PRIMARY KEY NOT NULL,
  "uid_validity" text,
  "last_uid" integer DEFAULT 0 NOT NULL,
  "last_run_at" timestamp with time zone,
  "last_error" text,
  "last_imported" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "mail_tickets" ADD CONSTRAINT "mail_tickets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "mail_messages" ADD CONSTRAINT "mail_messages_ticket_id_mail_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."mail_tickets"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "mail_messages" ADD CONSTRAINT "mail_messages_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "mail_attachments" ADD CONSTRAINT "mail_attachments_ticket_id_mail_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."mail_tickets"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "mail_attachments" ADD CONSTRAINT "mail_attachments_message_id_mail_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."mail_messages"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "mail_attachments" ADD CONSTRAINT "mail_attachments_uploader_id_users_id_fk" FOREIGN KEY ("uploader_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "mail_tickets_number_unique" ON "mail_tickets" USING btree ("number");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mail_tickets_user_last_idx" ON "mail_tickets" USING btree ("user_id","last_message_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mail_tickets_status_last_idx" ON "mail_tickets" USING btree ("status","last_message_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mail_tickets_from_idx" ON "mail_tickets" USING btree ("from_email");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mail_messages_ticket_idx" ON "mail_messages" USING btree ("ticket_id","created_at");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "mail_messages_rfc_unique" ON "mail_messages" USING btree ("rfc_message_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mail_attachments_message_idx" ON "mail_attachments" USING btree ("message_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mail_attachments_ticket_idx" ON "mail_attachments" USING btree ("ticket_id");
