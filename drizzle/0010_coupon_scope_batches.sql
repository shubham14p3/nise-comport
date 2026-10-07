ALTER TABLE "coupons" ADD COLUMN "applies_to" jsonb;--> statement-breakpoint
ALTER TABLE "coupons" ADD COLUMN "max_discount" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "coupons" ADD COLUMN "batch_id" uuid;--> statement-breakpoint
CREATE TABLE "coupon_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"prefix" text NOT NULL,
	"title" jsonb NOT NULL,
	"discount_type" text NOT NULL,
	"discount_value" numeric(10, 2) NOT NULL,
	"minimum_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"max_discount" numeric(10, 2),
	"uses_per_code" integer DEFAULT 1 NOT NULL,
	"applies_to" jsonb,
	"audience" jsonb NOT NULL,
	"starts_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"issued" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "coupon_batches" ADD CONSTRAINT "coupon_batches_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "coupons_batch_idx" ON "coupons" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "coupons_user_idx" ON "coupons" USING btree ("user_id");
--> statement-breakpoint
CREATE TABLE "site_banners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"placement" text NOT NULL,
	"title" jsonb NOT NULL,
	"text" jsonb,
	"cta" jsonb,
	"href" text,
	"image" text,
	"tone" text DEFAULT 'blue' NOT NULL,
	"categories" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"starts_on" date,
	"ends_on" date,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "custom_services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text DEFAULT 'service' NOT NULL,
	"slug" text NOT NULL,
	"category_slug" text NOT NULL,
	"title" text NOT NULL,
	"data" jsonb NOT NULL,
	"published" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "site_banners" ADD CONSTRAINT "site_banners_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_services" ADD CONSTRAINT "custom_services_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "site_banners_placement_idx" ON "site_banners" USING btree ("placement","active");--> statement-breakpoint
CREATE UNIQUE INDEX "custom_services_slug_unique" ON "custom_services" USING btree ("slug");
