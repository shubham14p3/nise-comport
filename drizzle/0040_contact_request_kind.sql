-- Counter verification requests share the approvals table: kind = change | verify-email | verify-phone.
ALTER TABLE "contact_change_requests" ADD COLUMN IF NOT EXISTS "kind" text DEFAULT 'change' NOT NULL;
