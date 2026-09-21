CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('OWNER','STAFF','CUSTOMER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE print_order_status AS ENUM (
    'DRAFT','AWAITING_PAYMENT','PAID','QUEUED','PRINTING',
    'NEEDS_CUSTOMER_CONFIRMATION','READY_FOR_PICKUP','OUT_FOR_DELIVERY',
    'COMPLETED','CANCELLED','REFUNDED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role user_role NOT NULL DEFAULT 'CUSTOMER',
  name TEXT NOT NULL,
  mobile TEXT UNIQUE,
  email TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  marketing_consent BOOLEAN NOT NULL DEFAULT FALSE,
  whatsapp_consent BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'Home',
  line1 TEXT NOT NULL,
  line2 TEXT,
  landmark TEXT,
  city TEXT NOT NULL DEFAULT 'Jamshedpur',
  state TEXT NOT NULL DEFAULT 'Jharkhand',
  postal_code TEXT NOT NULL,
  latitude NUMERIC,
  longitude NUMERIC,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS service_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO service_config(key,value) VALUES
('print_pricing','{"strategy":"flat","bw":[{"min":1,"max":10,"paise":500},{"min":11,"max":50,"paise":300},{"min":51,"max":999999,"paise":200}],"colorPaise":1000,"cashbackPercent":5}'::jsonb),
('delivery','{"enabled":true,"flatFeePaise":5000,"freeAbovePaise":50000,"allowedPostalCodes":[]}'::jsonb),
('pickup','{"slotMinutes":60,"capacity":12,"openingHour":9,"closingHour":20}'::jsonb),
('uploads','{"maxFiles":20,"maxFileSizeMb":25,"retentionDays":7}'::jsonb)
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('flat','percent')),
  value INTEGER NOT NULL CHECK (value > 0),
  min_order_paise INTEGER NOT NULL DEFAULT 0,
  max_discount_paise INTEGER,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  max_uses INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pickup_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 12,
  booked_count INTEGER NOT NULL DEFAULT 0,
  blocked BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE(starts_at,ends_at)
);

CREATE TABLE IF NOT EXISTS print_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES users(id),
  status print_order_status NOT NULL DEFAULT 'DRAFT',
  fulfilment TEXT NOT NULL CHECK (fulfilment IN ('pickup','delivery')),
  pickup_slot_id UUID REFERENCES pickup_slots(id),
  delivery_address JSONB,
  printing_subtotal_paise INTEGER NOT NULL DEFAULT 0,
  delivery_fee_paise INTEGER NOT NULL DEFAULT 0,
  wallet_redeemed_paise INTEGER NOT NULL DEFAULT 0,
  discount_paise INTEGER NOT NULL DEFAULT 0,
  total_paise INTEGER NOT NULL DEFAULT 0,
  cashback_paise INTEGER NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  payment_provider TEXT,
  payment_reference TEXT,
  coupon_code TEXT,
  acquisition_source TEXT,
  customer_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS print_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES print_orders(id) ON DELETE CASCADE,
  original_name TEXT NOT NULL,
  storage_key TEXT NOT NULL,
  prepared_storage_key TEXT,
  prepared_bw_key TEXT,
  prepared_color_key TEXT,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  total_pages INTEGER,
  conversion_status TEXT NOT NULL DEFAULT 'ready',
  delete_after TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS print_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  print_file_id UUID NOT NULL REFERENCES print_files(id) ON DELETE CASCADE,
  page_selection TEXT NOT NULL,
  colour_mode TEXT NOT NULL CHECK (colour_mode IN ('bw','color')),
  copies INTEGER NOT NULL DEFAULT 1 CHECK (copies > 0),
  sides TEXT NOT NULL CHECK (sides IN ('single','double')),
  paper_size TEXT NOT NULL,
  orientation TEXT NOT NULL DEFAULT 'portrait'
);

CREATE TABLE IF NOT EXISTS order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES print_orders(id) ON DELETE CASCADE,
  status print_order_status NOT NULL,
  actor_user_id UUID REFERENCES users(id),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wallet_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  order_id UUID REFERENCES print_orders(id),
  amount_paise INTEGER NOT NULL,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('cashback','referral','promotion','redemption','reversal','manual')),
  reason TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES print_orders(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('in_app','whatsapp','email','sms')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  provider_reference TEXT,
  sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_print_orders_customer ON print_orders(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_print_orders_status ON print_orders(status, created_at);
CREATE INDEX IF NOT EXISTS idx_print_files_delete_after ON print_files(delete_after);
CREATE INDEX IF NOT EXISTS idx_wallet_user ON wallet_ledger(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pickup_slots_starts ON pickup_slots(starts_at);
