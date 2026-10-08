UPDATE "customer_records" SET "status" = CASE "status"
  WHEN 'new' THEN 'open'
  WHEN 'in_progress' THEN 'pending'
  WHEN 'waiting_documents' THEN 'document_required'
  WHEN 'submitted' THEN 'verification'
  WHEN 'completed' THEN 'delivered'
  WHEN 'cancelled' THEN 'draft'
  ELSE "status" END;--> statement-breakpoint
ALTER TABLE "customer_records" ALTER COLUMN "status" SET DEFAULT 'open';
