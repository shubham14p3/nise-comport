-- SMS message log. Sending by SMS is not live yet; the table is ready for when it is.
-- WhatsApp messages keep using whatsapp_messages (0023), and mobile codes use phone_otps (0025).
CREATE TABLE IF NOT EXISTS "sms_messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "phone" text NOT NULL,
  "purpose" text NOT NULL,
  "body" text NOT NULL,
  "status" text DEFAULT 'queued' NOT NULL,
  "provider" text,
  "provider_message_id" text,
  "error" text,
  "sent_by_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "sent_at" timestamp with time zone
);
CREATE INDEX IF NOT EXISTS "sms_messages_status_idx" ON "sms_messages" ("status", "created_at");
CREATE INDEX IF NOT EXISTS "sms_messages_phone_idx" ON "sms_messages" ("phone");

-- Sales invoices. Money is stored in paise (1 rupee = 100), as elsewhere in the app.
CREATE TABLE IF NOT EXISTS "sales_invoices" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "invoice_number" text NOT NULL,
  "invoice_date" date NOT NULL,
  "customer_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "customer_name" text NOT NULL,
  "customer_phone" text,
  "customer_gstin" text,
  "subtotal_paise" integer DEFAULT 0 NOT NULL,
  "gst_paise" integer DEFAULT 0 NOT NULL,
  "total_paise" integer DEFAULT 0 NOT NULL,
  "payment_mode" text DEFAULT 'cash' NOT NULL,
  "payment_status" text DEFAULT 'unpaid' NOT NULL,
  "paid_paise" integer DEFAULT 0 NOT NULL,
  "notes" text,
  "created_by_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "cancelled_at" timestamp with time zone
);
CREATE UNIQUE INDEX IF NOT EXISTS "sales_invoices_number_unique" ON "sales_invoices" ("invoice_number");
CREATE INDEX IF NOT EXISTS "sales_invoices_date_idx" ON "sales_invoices" ("invoice_date");

CREATE TABLE IF NOT EXISTS "sales_invoice_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "invoice_id" uuid NOT NULL REFERENCES "sales_invoices"("id") ON DELETE CASCADE,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "description" text NOT NULL,
  "hsn_code" text,
  "quantity" numeric(12,3) DEFAULT 1 NOT NULL,
  "unit_price_paise" integer NOT NULL,
  "gst_rate" numeric(5,2) DEFAULT 0 NOT NULL,
  "line_total_paise" integer NOT NULL,
  "gst_paise" integer DEFAULT 0 NOT NULL
);
CREATE INDEX IF NOT EXISTS "sales_invoice_items_invoice_idx" ON "sales_invoice_items" ("invoice_id");

-- Purchase bills. Each bill needs approval by a second person (status pending -> approved or rejected).
CREATE TABLE IF NOT EXISTS "purchase_bills" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "bill_number" text NOT NULL,
  "bill_date" date NOT NULL,
  "supplier_name" text NOT NULL,
  "supplier_gstin" text,
  "supplier_phone" text,
  "subtotal_paise" integer DEFAULT 0 NOT NULL,
  "gst_paise" integer DEFAULT 0 NOT NULL,
  "total_paise" integer DEFAULT 0 NOT NULL,
  "payment_mode" text DEFAULT 'cash' NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "notes" text,
  "created_by_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "approved_by_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "approved_at" timestamp with time zone,
  "decision_note" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "purchase_bills_supplier_number_unique" ON "purchase_bills" ("supplier_name", "bill_number");
CREATE INDEX IF NOT EXISTS "purchase_bills_date_idx" ON "purchase_bills" ("bill_date");
CREATE INDEX IF NOT EXISTS "purchase_bills_status_idx" ON "purchase_bills" ("status", "created_at");

CREATE TABLE IF NOT EXISTS "purchase_bill_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "bill_id" uuid NOT NULL REFERENCES "purchase_bills"("id") ON DELETE CASCADE,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "description" text NOT NULL,
  "hsn_code" text,
  "quantity" numeric(12,3) DEFAULT 1 NOT NULL,
  "unit_cost_paise" integer NOT NULL,
  "gst_rate" numeric(5,2) DEFAULT 0 NOT NULL,
  "line_total_paise" integer NOT NULL,
  "gst_paise" integer DEFAULT 0 NOT NULL
);
CREATE INDEX IF NOT EXISTS "purchase_bill_items_bill_idx" ON "purchase_bill_items" ("bill_id");
