CREATE TABLE "pan_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pan_hash" text NOT NULL,
	"encrypted_pan" text NOT NULL,
	"holder_name" text NOT NULL,
	"record_status" text DEFAULT 'imported' NOT NULL,
	"import_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pan_records_pan_hash_unique" UNIQUE("pan_hash")
);
--> statement-breakpoint
ALTER TABLE "pan_imports" DROP CONSTRAINT "pan_imports_file_id_stored_files_id_fk";
--> statement-breakpoint
ALTER TABLE "pan_imports" ALTER COLUMN "file_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "pan_records" ADD CONSTRAINT "pan_records_import_id_pan_imports_id_fk" FOREIGN KEY ("import_id") REFERENCES "public"."pan_imports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pan_records_name_idx" ON "pan_records" USING btree ("holder_name");--> statement-breakpoint
ALTER TABLE "pan_imports" ADD CONSTRAINT "pan_imports_file_id_stored_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."stored_files"("id") ON DELETE set null ON UPDATE no action;