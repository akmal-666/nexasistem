-- ============================================================
-- packages/db/schema/tenant.sql
-- Database per-tenant: semua data operasional bisnis
-- Setiap tenant punya D1 database sendiri
-- Deploy: wrangler d1 execute <db-name> --file=tenant.sql
-- ============================================================

-- ─── Core Tables ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  password    TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'kasir' CHECK (role IN ('owner','manager','kasir','staff')),
  phone       TEXT,
  branch_id   TEXT,
  is_active   INTEGER NOT NULL DEFAULT 1,
  last_login  TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS branches (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  code        TEXT NOT NULL UNIQUE,
  address     TEXT,
  city        TEXT,
  phone       TEXT,
  is_active   INTEGER NOT NULL DEFAULT 1,
  is_default  INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS categories (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL,
  module      TEXT NOT NULL,
  parent_id   TEXT REFERENCES categories(id),
  sort_order  INTEGER NOT NULL DEFAULT 0,
  UNIQUE(slug, module)
);

CREATE TABLE IF NOT EXISTS products (
  id          TEXT PRIMARY KEY,
  category_id TEXT REFERENCES categories(id),
  branch_id   TEXT REFERENCES branches(id),
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
  image_url   TEXT,
  is_active   INTEGER NOT NULL DEFAULT 1,
  meta        TEXT NOT NULL DEFAULT '{}',
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_products_module ON products(module);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);

CREATE TABLE IF NOT EXISTS customers (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT,
  phone         TEXT,
  address       TEXT,
  city          TEXT,
  dob           TEXT,
  gender        TEXT CHECK (gender IN ('M','F')),
  notes         TEXT,
  loyalty_point INTEGER NOT NULL DEFAULT 0,
  meta          TEXT NOT NULL DEFAULT '{}',
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS suppliers (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  phone       TEXT,
  email       TEXT,
  address     TEXT,
  city        TEXT,
  is_active   INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─── Orders & Transactions ────────────────────────────────────

CREATE TABLE IF NOT EXISTS orders (
  id              TEXT PRIMARY KEY,
  order_number    TEXT NOT NULL UNIQUE,
  branch_id       TEXT REFERENCES branches(id),
  customer_id     TEXT REFERENCES customers(id),
  module          TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'draft',
  subtotal        INTEGER NOT NULL DEFAULT 0,
  discount        INTEGER NOT NULL DEFAULT 0,
  tax             INTEGER NOT NULL DEFAULT 0,
  service_charge  INTEGER NOT NULL DEFAULT 0,
  total           INTEGER NOT NULL DEFAULT 0,
  paid_amount     INTEGER NOT NULL DEFAULT 0,
  change_amount   INTEGER NOT NULL DEFAULT 0,
  payment_method  TEXT,
  payment_status  TEXT NOT NULL DEFAULT 'unpaid',
  cashier_id      TEXT REFERENCES users(id),
  notes           TEXT,
  meta            TEXT NOT NULL DEFAULT '{}',
  printed_at      TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_orders_module ON orders(module);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

CREATE TABLE IF NOT EXISTS order_items (
  id          TEXT PRIMARY KEY,
  order_id    TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  TEXT REFERENCES products(id),
  name        TEXT NOT NULL,
  qty         REAL NOT NULL DEFAULT 1,
  unit        TEXT NOT NULL DEFAULT 'pcs',
  price       INTEGER NOT NULL DEFAULT 0,
  discount    INTEGER NOT NULL DEFAULT 0,
  subtotal    INTEGER NOT NULL DEFAULT 0,
  notes       TEXT,
  meta        TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id          TEXT PRIMARY KEY,
  product_id  TEXT NOT NULL REFERENCES products(id),
  type        TEXT NOT NULL CHECK (type IN ('in','out','adjustment','transfer')),
  qty         REAL NOT NULL,
  qty_before  REAL NOT NULL,
  qty_after   REAL NOT NULL,
  reference   TEXT,
  notes       TEXT,
  created_by  TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS purchases (
  id              TEXT PRIMARY KEY,
  purchase_number TEXT NOT NULL UNIQUE,
  supplier_id     TEXT REFERENCES suppliers(id),
  status          TEXT NOT NULL DEFAULT 'ordered' CHECK (status IN ('draft','ordered','partial','received','cancelled')),
  total           INTEGER NOT NULL DEFAULT 0,
  due_date        TEXT,
  notes           TEXT,
  created_by      TEXT REFERENCES users(id),
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS purchase_items (
  id          TEXT PRIMARY KEY,
  purchase_id TEXT NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  product_id  TEXT REFERENCES products(id),
  name        TEXT NOT NULL,
  qty         REAL NOT NULL,
  unit        TEXT NOT NULL DEFAULT 'pcs',
  cost_price  INTEGER NOT NULL DEFAULT 0,
  subtotal    INTEGER NOT NULL DEFAULT 0
);

-- ─── Module: FnB ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS fnb_tables (
  id          TEXT PRIMARY KEY,
  branch_id   TEXT REFERENCES branches(id),
  name        TEXT NOT NULL,
  capacity    INTEGER NOT NULL DEFAULT 4,
  status      TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available','occupied','reserved','closed')),
  order_id    TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─── Module: Klinik ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS klinik_doctors (
  id              TEXT PRIMARY KEY,
  user_id         TEXT REFERENCES users(id),
  name            TEXT NOT NULL,
  specialization  TEXT NOT NULL DEFAULT 'Umum',
  sip_number      TEXT,
  is_active       INTEGER NOT NULL DEFAULT 1,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS klinik_queues (
  id          TEXT PRIMARY KEY,
  branch_id   TEXT REFERENCES branches(id),
  customer_id TEXT REFERENCES customers(id),
  doctor_id   TEXT REFERENCES klinik_doctors(id),
  queue_number INTEGER NOT NULL,
  status      TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting','called','in_progress','done','skip')),
  complaint   TEXT,
  visit_date  TEXT NOT NULL DEFAULT (date('now')),
  called_at   TEXT,
  done_at     TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS klinik_emr (
  id          TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES customers(id),
  doctor_id   TEXT REFERENCES klinik_doctors(id),
  queue_id    TEXT REFERENCES klinik_queues(id),
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

CREATE TABLE IF NOT EXISTS laundry_orders (
  id            TEXT PRIMARY KEY,
  order_id      TEXT NOT NULL REFERENCES orders(id),
  customer_id   TEXT REFERENCES customers(id),
  items_count   REAL NOT NULL DEFAULT 0,
  weight_kg     REAL,
  status        TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received','washing','drying','ironing','folding','ready','delivered')),
  pickup_date   TEXT,
  estimated_done TEXT,
  actual_done   TEXT,
  notes         TEXT,
  special_care  TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─── Module: Apotek ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS apotek_recipes (
  id          TEXT PRIMARY KEY,
  customer_id TEXT REFERENCES customers(id),
  doctor_name TEXT,
  recipe_date TEXT NOT NULL DEFAULT (date('now')),
  items       TEXT NOT NULL DEFAULT '[]',
  notes       TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─── Module: Salon ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS salon_staff (
  id              TEXT PRIMARY KEY,
  user_id         TEXT REFERENCES users(id),
  name            TEXT NOT NULL,
  specialization  TEXT NOT NULL DEFAULT '[]',
  is_active       INTEGER NOT NULL DEFAULT 1,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS salon_bookings (
  id            TEXT PRIMARY KEY,
  customer_id   TEXT REFERENCES customers(id),
  staff_id      TEXT REFERENCES salon_staff(id),
  order_id      TEXT REFERENCES orders(id),
  booking_date  TEXT NOT NULL,
  booking_time  TEXT NOT NULL,
  duration_min  INTEGER NOT NULL DEFAULT 60,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','in_progress','done','cancelled')),
  notes         TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─── Module: Properti ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS properti_units (
  id          TEXT PRIMARY KEY,
  branch_id   TEXT REFERENCES branches(id),
  name        TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'kos' CHECK (type IN ('kos','apartemen','ruko','kontrakan','gudang')),
  floor       INTEGER,
  size_m2     REAL,
  price       INTEGER NOT NULL DEFAULT 0,
  deposit     INTEGER NOT NULL DEFAULT 0,
  facilities  TEXT NOT NULL DEFAULT '[]',
  status      TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available','occupied','maintenance')),
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS properti_tenants (
  id            TEXT PRIMARY KEY,
  unit_id       TEXT NOT NULL REFERENCES properti_units(id),
  customer_id   TEXT NOT NULL REFERENCES customers(id),
  start_date    TEXT NOT NULL,
  end_date      TEXT,
  monthly_rate  INTEGER NOT NULL,
  deposit_paid  INTEGER NOT NULL DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','ended','terminated')),
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS properti_billings (
  id              TEXT PRIMARY KEY,
  unit_id         TEXT NOT NULL REFERENCES properti_units(id),
  tenant_id       TEXT NOT NULL REFERENCES properti_tenants(id),
  order_id        TEXT REFERENCES orders(id),
  billing_month   TEXT NOT NULL,
  total           INTEGER NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid','paid','overdue')),
  due_date        TEXT NOT NULL,
  paid_at         TEXT,
  payment_method  TEXT,
  notes           TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─── Settings & Audit ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS settings (
  key         TEXT PRIMARY KEY,
  value       TEXT,
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS print_templates (
  id          TEXT PRIMARY KEY,
  module      TEXT,
  name        TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'receipt',
  paper_size  TEXT NOT NULL DEFAULT 'thermal80',
  content     TEXT,
  is_default  INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id          TEXT PRIMARY KEY,
  user_id     TEXT,
  action      TEXT NOT NULL,
  table_name  TEXT,
  record_id   TEXT,
  old_data    TEXT,
  new_data    TEXT,
  notes       TEXT,
  ip_address  TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
