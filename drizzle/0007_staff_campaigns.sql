ALTER TABLE "users" ADD COLUMN "permissions" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
-- Existing staff keep what they could do before: the request queue.
UPDATE "users" SET "permissions" = '["requests"]'::jsonb WHERE "role" = 'staff';--> statement-breakpoint
ALTER TABLE "coupons" ADD COLUMN "posters" jsonb;--> statement-breakpoint
ALTER TABLE "coupons" ADD COLUMN "created_by" uuid;--> statement-breakpoint
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE TABLE "media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"object_key" text NOT NULL,
	"original_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"title" text NOT NULL,
	"locale" text,
	"category" text,
	"uploaded_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"locale" text DEFAULT 'en' NOT NULL,
	"area" text,
	"services" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"consent" text DEFAULT 'unknown' NOT NULL,
	"consent_at" timestamp with time zone,
	"source" text,
	"notes" text,
	"last_messaged_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"kind" text NOT NULL,
	"service" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"message" jsonb NOT NULL,
	"posters" jsonb,
	"coupon_code" text,
	"audience" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"test_numbers" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"batch_size" integer DEFAULT 10 NOT NULL,
	"gap_min_minutes" integer DEFAULT 10 NOT NULL,
	"gap_max_minutes" integer DEFAULT 30 NOT NULL,
	"daily_limit" integer DEFAULT 10 NOT NULL,
	"window_start" integer DEFAULT 9 NOT NULL,
	"window_end" integer DEFAULT 20 NOT NULL,
	"provider" text DEFAULT 'manual' NOT NULL,
	"template_name" text,
	"next_round_at" timestamp with time zone,
	"round" integer DEFAULT 0 NOT NULL,
	"created_by" uuid,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "campaign_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"contact_id" uuid,
	"phone" text NOT NULL,
	"name" text NOT NULL,
	"locale" text DEFAULT 'en' NOT NULL,
	"body" text NOT NULL,
	"poster_url" text,
	"test" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"round" integer,
	"scheduled_at" timestamp with time zone,
	"sent_at" timestamp with time zone,
	"provider_message_id" text,
	"error" text,
	"attempts" integer DEFAULT 0 NOT NULL,
	"sent_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_messages" ADD CONSTRAINT "campaign_messages_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_messages" ADD CONSTRAINT "campaign_messages_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_messages" ADD CONSTRAINT "campaign_messages_sent_by_users_id_fk" FOREIGN KEY ("sent_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "media_created_idx" ON "media" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "contacts_phone_unique" ON "contacts" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "contacts_consent_idx" ON "contacts" USING btree ("consent");--> statement-breakpoint
CREATE INDEX "campaigns_status_next_idx" ON "campaigns" USING btree ("status","next_round_at");--> statement-breakpoint
CREATE UNIQUE INDEX "campaign_messages_campaign_phone_unique" ON "campaign_messages" USING btree ("campaign_id","phone") WHERE "campaign_messages"."test" = false;--> statement-breakpoint
CREATE INDEX "campaign_messages_status_scheduled_idx" ON "campaign_messages" USING btree ("status","scheduled_at");--> statement-breakpoint
CREATE INDEX "campaign_messages_provider_idx" ON "campaign_messages" USING btree ("provider_message_id");
;--> statement-breakpoint
-- A test contact (the owner's number) and a dummy insurance-renewal campaign that only sends to it.
INSERT INTO "contacts" ("name", "phone", "locale", "services", "consent", "consent_at", "source", "notes")
VALUES ('Shubham (test)', '+918092766575', 'en', jsonb_build_array(jsonb_build_object('service', 'insurance', 'renewalOn', to_char((now() AT TIME ZONE 'Asia/Kolkata')::date + 20, 'YYYY-MM-DD'), 'note', 'Test contact')), 'opted_in', now(), 'test', 'Owner''s own number for testing campaigns.')
ON CONFLICT ("phone") DO NOTHING;--> statement-breakpoint
INSERT INTO "campaigns" ("name", "kind", "service", "status", "message", "posters", "audience", "test_numbers", "provider")
SELECT 'Insurance renewal (dummy test)', 'renewal', 'insurance', 'draft', '{"en":"Namaste {name} 🙏 Your {service} renewal is due{date}. Renew with NISE COMPORT, Kharangajhar, Telco: we compare plans and do the paperwork for you.{code} Reply here or call {phone}.","hi":"नमस्ते {name} 🙏 आपके {service} का रिन्यूअल{date} है। NISE COMPORT, खरंगाझार, टेल्को में रिन्यू कराएँ: हम प्लान की तुलना और सारी कागज़ी कार्यवाही करते हैं।{code} यहीं जवाब दें या {phone} पर कॉल करें।","bn":"নমস্কার {name} 🙏 আপনার {service} রিনিউ করার সময়{date}। NISE COMPORT, খরংঝাড়, টেলকোতে রিনিউ করান: আমরা প্ল্যান তুলনা করে সব কাগজপত্র করে দিই।{code} এখানে উত্তর দিন বা {phone}-এ ফোন করুন।"}'::jsonb, '{"en":"/promos/insurance/car-bike-quote-today.jpg"}'::jsonb, '{"renewalWithinDays":45}'::jsonb, '["+918092766575"]'::jsonb, 'manual'
WHERE NOT EXISTS (SELECT 1 FROM "campaigns" WHERE "name" = 'Insurance renewal (dummy test)');
