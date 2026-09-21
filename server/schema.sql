CREATE TYPE user_role AS ENUM ('OWNER','STAFF','CUSTOMER');
CREATE TYPE print_order_status AS ENUM ('DRAFT','AWAITING_PAYMENT','PAID','QUEUED','PRINTING','NEEDS_CUSTOMER_CONFIRMATION','READY_FOR_PICKUP','OUT_FOR_DELIVERY','COMPLETED','CANCELLED','REFUNDED');

CREATE TABLE users (
  id UUID PRIMARY KEY,
  role user_role NOT NULL DEFAULT 'CUSTOMER',
  name TEXT NOT NULL,
  mobile TEXT UNIQUE,
  email TEXT UNIQUE,
  password_hash TEXT,
  marketing_consent BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE print_orders (
  id UUID PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES users(id),
  status print_order_status NOT NULL DEFAULT 'DRAFT',
  fulfilment TEXT NOT NULL CHECK (fulfilment IN ('pickup','delivery')),
  pickup_slot_start TIMESTAMPTZ,
  pickup_slot_end TIMESTAMPTZ,
  delivery_address JSONB,
  printing_subtotal_paise INTEGER NOT NULL DEFAULT 0,
  delivery_fee_paise INTEGER NOT NULL DEFAULT 0,
  wallet_redeemed_paise INTEGER NOT NULL DEFAULT 0,
  discount_paise INTEGER NOT NULL DEFAULT 0,
  total_paise INTEGER NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  acquisition_source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE print_files (
  id UUID PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES print_orders(id) ON DELETE CASCADE,
  original_name TEXT NOT NULL,
  storage_key TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  total_pages INTEGER,
  delete_after TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE print_segments (
  id UUID PRIMARY KEY,
  print_file_id UUID NOT NULL REFERENCES print_files(id) ON DELETE CASCADE,
  page_selection TEXT NOT NULL,
  colour_mode TEXT NOT NULL CHECK (colour_mode IN ('bw','color')),
  copies INTEGER NOT NULL DEFAULT 1 CHECK (copies > 0),
  sides TEXT NOT NULL CHECK (sides IN ('single','double')),
  paper_size TEXT NOT NULL,
  orientation TEXT NOT NULL DEFAULT 'portrait'
);

CREATE TABLE order_status_history (
  id UUID PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES print_orders(id) ON DELETE CASCADE,
  status print_order_status NOT NULL,
  actor_user_id UUID REFERENCES users(id),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE wallet_ledger (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  order_id UUID REFERENCES print_orders(id),
  amount_paise INTEGER NOT NULL,
  entry_type TEXT NOT NULL,
  reason TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_print_orders_customer ON print_orders(customer_id, created_at DESC);
CREATE INDEX idx_print_orders_status ON print_orders(status, created_at);
CREATE INDEX idx_print_files_delete_after ON print_files(delete_after);
CREATE INDEX idx_wallet_user ON wallet_ledger(user_id, created_at DESC);
