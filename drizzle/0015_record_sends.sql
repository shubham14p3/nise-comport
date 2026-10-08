CREATE TABLE "record_sends" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"person_key" text NOT NULL,
	"sent_by" uuid,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "record_sends" ADD CONSTRAINT "record_sends_sent_by_users_id_fk" FOREIGN KEY ("sent_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "record_sends_person_idx" ON "record_sends" USING btree ("person_key","sent_at");
