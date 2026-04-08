-- packages/db/schema/tenant_flat.sql
-- Schema tenant yang sudah di-flatten dengan prefix tenant_ di setiap tabel
-- Ini adalah versi final yang compatible dengan pendekatan single D1 database
-- di mana semua tenant share satu database dengan tenant_id sebagai partition key
-- Jalankan: wrangler d1 execute nexasistem-master --file=packages/db/schema/tenant_flat.sql

-- ─── Core Tenant Tables ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS tenant_users (
  id          TEXT PRIMARY KEY,
  tenant_id   TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  password    TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'kasir' CHECK (role IN ('owner','manager','kasir','staff')),
  phone       TEXT,
  is_active   INTEGER NOT NULL DEFAULT 1,
  last_login  TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(tenant_id, email)
);
CREATE INDEX IF NOT EXISTS idx_tu_tenant ON tenant_users(tenant_id);

CREATE TABLE IF NOT EXISTS tenant_branches (
  id          TEXT PRIMARY KEY,
  tenant_id   TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  code        TEXT NOT NULL,
  address     TEXT,
  city        TEXT,
  phone       TEXT,
  is_active   INTEGER NOT NULL DEFAULT 1,
  is_default  INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(tenant_id, code)
);

CREATE TABLE IF NOT EXISTS tenant_categories (
  id          TEXT PRIMARY KEY,
  tenant_id   TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL,
  module      TEXT NOT NULL,
  parent_id   TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  UNIQUE(tenant_id, slug, module)
);
CREATE INDEX IF NOT EXISTS idx_tc_tenant_module ON tenant_categories(tenant_id, module);

CREATE TABLE IF NOT EXISTS tenant_products (
  id          TEXT PRIMARY KEY,
  tenant_id   TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category_id TEXT,
  branch_id   TEXT,
  module      TEXT NOT NULL,
  name        TEXT NOT NULL,
  sku         TEXT,
  barcode     TEXT,
  description TEXT,
  price       INTEGER NOT NULL DEFAULT 0,
  cost_price  INTEGER NOT NULL DEFAULT 0,
  stock       REAL NOT NULL DEFAULT 0,
  unit        TEXT NOT NULL DEFAULT 'pcs',
  min_stock   REAL NOT NULL DEFAULT 0,
  is_active   INTEGER NOT NULL DEFAULT 1,
  meta        TEXT NOT NULL DEFAULT '{}',
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_tp_tenant_module ON tenant_products(tenant_id, module);
CREATE INDEX IF NOT EXISTS idx_tp_barcode ON tenant_products(tenant_id, barcode);

CREATE TABLE IF NOT EXISTS tenant_customers (
  id            TEXT PRIMARY KEY,
  tenant_id     TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  email         TEXT,
  phone         TEXT,
  address       TEXT,
  city          TEXT,
  dob           TEXT,
  gender        TEXT,
  notes         TEXT,
  loyalty_point INTEGER NOT NULL DEFAULT 0,
  meta          TEXT NOT NULL DEFAULT '{}',
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_tcust_tenant ON tenant_customers(tenant_id);

CREATE TABLE IF NOT EXISTS tenant_suppliers (
  id          TEXT PRIMARY KEY,
  tenant_id   TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  phone       TEXT,
  email       TEXT,
  address     TEXT,
  is_active   INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─── Orders ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tenant_orders (
  id              TEXT PRIMARY KEY,
  tenant_id       TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_number    TEXT NOT NULL,
  branch_id       TEXT,
  customer_id     TEXT,
  module          TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'done',
  subtotal        INTEGER NOT NULL DEFAULT 0,
  discount        INTEGER NOT NULL DEFAULT 0,
  tax             INTEGER NOT NULL DEFAULT 0,
  service_charge  INTEGER NOT NULL DEFAULT 0,
  total           INTEGER NOT NULL DEFAULT 0,
  paid_amount     INTEGER NOT NULL DEFAULT 0,
  change_amount   INTEGER NOT NULL DEFAULT 0,
  payment_method  TEXT,
  payment_status  TEXT NOT NULL DEFAULT 'unpaid',
  cashier_id      TEXT,
  notes           TEXT,
  meta            TEXT NOT NULL DEFAULT '{}',
  printed_at      TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(tenant_id, order_number)
);
CREATE INDEX IF NOT EXISTS idx_to_tenant_module ON tenant_orders(tenant_id, module);
CREATE INDEX IF NOT EXISTS idx_to_created ON tenant_orders(tenant_id, created_at);

CREATE TABLE IF NOT EXISTS tenant_order_items (
  id          TEXT PRIMARY KEY,
  tenant_id   TEXT NOT NULL,
  order_id    TEXT NOT NULL REFERENCES tenant_orders(id) ON DELETE CASCADE,
  product_id  TEXT,
  name        TEXT NOT NULL,
  qty         REAL NOT NULL DEFAULT 1,
  unit        TEXT NOT NULL DEFAULT 'pcs',
  price       INTEGER NOT NULL DEFAULT 0,
  discount    INTEGER NOT NULL DEFAULT 0,
  subtotal    INTEGER NOT NULL DEFAULT 0,
  notes       TEXT,
  meta        TEXT NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_toi_order ON tenant_order_items(order_id);

CREATE TABLE IF NOT EXISTS tenant_stock_movements (
  id          TEXT PRIMARY KEY,
  tenant_id   TEXT NOT NULL,
  product_id  TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('in','out','adjustment','transfer')),
  qty         REAL NOT NULL,
  qty_before  REAL NOT NULL DEFAULT 0,
  qty_after   REAL NOT NULL DEFAULT 0,
  reference   TEXT,
  notes       TEXT,
  created_by  TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tenant_purchases (
  id              TEXT PRIMARY KEY,
  tenant_id       TEXT NOT NULL,
  purchase_number TEXT NOT NULL,
  supplier_id     TEXT,
  status          TEXT NOT NULL DEFAULT 'ordered',
  total           INTEGER NOT NULL DEFAULT 0,
  due_date        TEXT,
  notes           TEXT,
  created_by      TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(tenant_id, purchase_number)
);

CREATE TABLE IF NOT EXISTS tenant_purchase_items (
  id          TEXT PRIMARY KEY,
  tenant_id   TEXT NOT NULL,
  purchase_id TEXT NOT NULL,
  product_id  TEXT,
  name        TEXT NOT NULL,
  qty         REAL NOT NULL,
  unit        TEXT NOT NULL DEFAULT 'pcs',
  cost_price  INTEGER NOT NULL DEFAULT 0,
  subtotal    INTEGER NOT NULL DEFAULT 0
);

-- ─── Module: FnB ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tenant_fnb_tables (
  id          TEXT PRIMARY KEY,
  tenant_id   TEXT NOT NULL,
  branch_id   TEXT,
  name        TEXT NOT NULL,
  capacity    INTEGER NOT NULL DEFAULT 4,
  status      TEXT NOT NULL DEFAULT 'available',
  order_id    TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─── Module: Klinik ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tenant_klinik_doctors (
  id              TEXT PRIMARY KEY,
  tenant_id       TEXT NOT NULL,
  user_id         TEXT,
  name            TEXT NOT NULL,
  specialization  TEXT NOT NULL DEFAULT 'Umum',
  sip_number      TEXT,
  is_active       INTEGER NOT NULL DEFAULT 1,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tenant_klinik_queues (
  id            TEXT PRIMARY KEY,
  tenant_id     TEXT NOT NULL,
  branch_id     TEXT,
  customer_id   TEXT,
  doctor_id     TEXT,
  queue_number  INTEGER NOT NULL,
  status        TEXT NOT NULL DEFAULT 'waiting',
  complaint     TEXT,
  visit_date    TEXT NOT NULL DEFAULT (date('now')),
  called_at     TEXT,
  done_at       TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_tkq_tenant_date ON tenant_klinik_queues(tenant_id, visit_date);

CREATE TABLE IF NOT EXISTS tenant_klinik_emr (
  id          TEXT PRIMARY KEY,
  tenant_id   TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  doctor_id   TEXT,
  queue_id    TEXT,
  visit_date  TEXT NOT NULL DEFAULT (date('now')),
  subjective  TEXT,
  objective   TEXT,
  assessment  TEXT,
  plan        TEXT,
  icd10_codes TEXT NOT NULL DEFAULT '[]',
  icd9_codes  TEXT NOT NULL DEFAULT '[]',
  vital_signs TEXT NOT NULL DEFAULT '{}',
  notes       TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─── Module: Laundry ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tenant_laundry_orders (
  id              TEXT PRIMARY KEY,
  tenant_id       TEXT NOT NULL,
  order_id        TEXT NOT NULL,
  customer_id     TEXT,
  items_count     REAL NOT NULL DEFAULT 0,
  weight_kg       REAL,
  status          TEXT NOT NULL DEFAULT 'received',
  estimated_done  TEXT,
  actual_done     TEXT,
  notes           TEXT,
  special_care    TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─── Module: Apotek ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tenant_apotek_recipes (
  id          TEXT PRIMARY KEY,
  tenant_id   TEXT NOT NULL,
  customer_id TEXT,
  doctor_name TEXT,
  recipe_date TEXT NOT NULL DEFAULT (date('now')),
  items       TEXT NOT NULL DEFAULT '[]',
  notes       TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─── Module: Salon ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tenant_salon_staff (
  id              TEXT PRIMARY KEY,
  tenant_id       TEXT NOT NULL,
  user_id         TEXT,
  name            TEXT NOT NULL,
  specialization  TEXT NOT NULL DEFAULT '[]',
  is_active       INTEGER NOT NULL DEFAULT 1,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tenant_salon_bookings (
  id            TEXT PRIMARY KEY,
  tenant_id     TEXT NOT NULL,
  customer_id   TEXT,
  staff_id      TEXT,
  order_id      TEXT,
  booking_date  TEXT NOT NULL,
  booking_time  TEXT NOT NULL,
  duration_min  INTEGER NOT NULL DEFAULT 60,
  status        TEXT NOT NULL DEFAULT 'pending',
  notes         TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_tsb_tenant_date ON tenant_salon_bookings(tenant_id, booking_date);

-- ─── Module: Properti ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tenant_properti_units (
  id          TEXT PRIMARY KEY,
  tenant_id   TEXT NOT NULL,
  branch_id   TEXT,
  name        TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'kos',
  floor       INTEGER,
  size_m2     REAL,
  price       INTEGER NOT NULL DEFAULT 0,
  deposit     INTEGER NOT NULL DEFAULT 0,
  facilities  TEXT NOT NULL DEFAULT '[]',
  status      TEXT NOT NULL DEFAULT 'available',
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tenant_properti_tenants (
  id            TEXT PRIMARY KEY,
  tenant_id     TEXT NOT NULL,
  unit_id       TEXT NOT NULL,
  customer_id   TEXT NOT NULL,
  start_date    TEXT NOT NULL,
  end_date      TEXT,
  monthly_rate  INTEGER NOT NULL,
  deposit_paid  INTEGER NOT NULL DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'active',
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tenant_properti_billings (
  id              TEXT PRIMARY KEY,
  tenant_id       TEXT NOT NULL,
  unit_id         TEXT NOT NULL,
  tenant_rel_id   TEXT NOT NULL,
  order_id        TEXT,
  billing_month   TEXT NOT NULL,
  total           INTEGER NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'unpaid',
  due_date        TEXT NOT NULL,
  paid_at         TEXT,
  payment_method  TEXT,
  notes           TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─── Settings ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tenant_settings (
  id          TEXT PRIMARY KEY,
  tenant_id   TEXT NOT NULL,
  key         TEXT NOT NULL,
  value       TEXT,
  updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(tenant_id, key)
);

CREATE TABLE IF NOT EXISTS tenant_audit_logs (
  id          TEXT PRIMARY KEY,
  tenant_id   TEXT NOT NULL,
  user_id     TEXT,
  action      TEXT NOT NULL,
  table_name  TEXT,
  record_id   TEXT,
  notes       TEXT,
  ip_address  TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_tal_tenant ON tenant_audit_logs(tenant_id, created_at);
