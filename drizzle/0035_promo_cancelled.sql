-- Cancelled festival / Team India / hand-made promotions. Cancelling also switches the code off.
ALTER TABLE "coupons" ADD COLUMN IF NOT EXISTS "cancelled" boolean NOT NULL DEFAULT false;
