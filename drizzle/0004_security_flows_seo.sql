CREATE TABLE "rate_limits" (
	"key" text PRIMARY KEY NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "request_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_kind" text NOT NULL,
	"request_id" uuid NOT NULL,
	"actor_id" uuid,
	"from_status" text,
	"to_status" text NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "attempts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "last_error" text;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "sent_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "print_jobs" ADD COLUMN "idempotency_key" text;--> statement-breakpoint
ALTER TABLE "service_requests" ADD COLUMN "idempotency_key" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_changed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "disabled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "request_events" ADD CONSTRAINT "request_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "rate_limits_window_idx" ON "rate_limits" USING btree ("window_start");--> statement-breakpoint
CREATE INDEX "request_events_request_idx" ON "request_events" USING btree ("request_kind","request_id","created_at");--> statement-breakpoint
CREATE INDEX "notifications_status_created_idx" ON "notifications" USING btree ("status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "print_jobs_user_idempotency_idx" ON "print_jobs" USING btree ("user_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "service_requests_status_created_idx" ON "service_requests" USING btree ("status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "service_requests_user_idempotency_idx" ON "service_requests" USING btree ("user_id","idempotency_key");