ALTER TABLE "users" ADD COLUMN "inbox_seen_at" timestamp with time zone;--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"topic" text NOT NULL,
	"message" text,
	"source" text DEFAULT 'chat' NOT NULL,
	"page" text,
	"locale" text DEFAULT 'en' NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"handled_by" uuid,
	"handled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text NOT NULL,
	"permission" text NOT NULL,
	"category" text,
	"title" text NOT NULL,
	"detail" text,
	"ref_type" text,
	"ref_id" text,
	"actor_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "record_imports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"file_name" text NOT NULL,
	"uploaded_by" uuid,
	"sheets" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"total_rows" integer DEFAULT 0 NOT NULL,
	"imported" integer DEFAULT 0 NOT NULL,
	"duplicates" integer DEFAULT 0 NOT NULL,
	"skipped" integer DEFAULT 0 NOT NULL,
	"contacts_added" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"import_id" uuid,
	"service" text NOT NULL,
	"source" text NOT NULL,
	"name" text NOT NULL,
	"mobile_hash" text,
	"mobile_enc" text,
	"mobile_last4" text,
	"pan_hash" text,
	"aadhaar_hash" text,
	"record_date" date,
	"renewal_on" date,
	"payload_enc" text NOT NULL,
	"row_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_handled_by_users_id_fk" FOREIGN KEY ("handled_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "record_imports" ADD CONSTRAINT "record_imports_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_records" ADD CONSTRAINT "customer_records_import_id_record_imports_id_fk" FOREIGN KEY ("import_id") REFERENCES "public"."record_imports"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "leads_status_created_idx" ON "leads" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "leads_phone_idx" ON "leads" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "activity_log_created_idx" ON "activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "activity_log_permission_created_idx" ON "activity_log" USING btree ("permission","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "customer_records_row_hash_unique" ON "customer_records" USING btree ("row_hash");--> statement-breakpoint
CREATE INDEX "customer_records_mobile_idx" ON "customer_records" USING btree ("mobile_hash");--> statement-breakpoint
CREATE INDEX "customer_records_pan_idx" ON "customer_records" USING btree ("pan_hash");--> statement-breakpoint
CREATE INDEX "customer_records_service_idx" ON "customer_records" USING btree ("service");--> statement-breakpoint
CREATE INDEX "customer_records_name_idx" ON "customer_records" USING btree ("name");--> statement-breakpoint
CREATE INDEX "customer_records_renewal_idx" ON "customer_records" USING btree ("renewal_on");
