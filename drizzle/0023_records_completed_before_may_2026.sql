UPDATE "customer_records" SET "status" = 'delivered', "status_at" = now() WHERE "record_date" < DATE '2026-05-01' AND "status" <> 'delivered';
