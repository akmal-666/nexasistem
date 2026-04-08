-- ============================================================
-- packages/db/schema/master.sql
-- Database master: tenant, plans, billing, admins, CMS
-- Deploy ke: Cloudflare D1 binding MASTER_DB
-- ============================================================

CREATE TABLE IF NOT EXISTS admins (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  password    TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('superadmin', 'staff')),
  is_active   INTEGER NOT NULL DEFAULT 1,
  last_login  TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS plans (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  description     TEXT,
  price_monthly   INTEGER NOT NULL DEFAULT 0,
  price_yearly    INTEGER NOT NULL DEFAULT 0,
  max_users       INTEGER NOT NULL DEFAULT 5,
  max_modules     INTEGER NOT NULL DEFAULT 1,
  max_branches    INTEGER NOT NULL DEFAULT 1,
  features        TEXT NOT NULL DEFAULT '[]',
  modules         TEXT NOT NULL DEFAULT '[]',
  is_active       INTEGER NOT NULL DEFAULT 1,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tenants (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  business_type   TEXT NOT NULL,
  owner_name      TEXT NOT NULL,
  owner_email     TEXT NOT NULL,
  owner_phone     TEXT,
  plan_id         TEXT REFERENCES plans(id),
  status          TEXT NOT NULL DEFAULT 'trial' CHECK (status IN ('trial','active','suspended','cancelled')),
  trial_ends_at   TEXT,
  logo_url        TEXT,
  address         TEXT,
  city            TEXT,
  -- D1 database name untuk tenant ini (format: nexasistem_<slug>)
  d1_database_id  TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);

CREATE TABLE IF NOT EXISTS tenant_modules (
  id          TEXT PRIMARY KEY,
  tenant_id   TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  module      TEXT NOT NULL,
  is_active   INTEGER NOT NULL DEFAULT 1,
  activated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(tenant_id, module)
);

CREATE TABLE IF NOT EXISTS invoices (
  id                  TEXT PRIMARY KEY,
  invoice_number      TEXT NOT NULL UNIQUE,
  tenant_id           TEXT NOT NULL REFERENCES tenants(id),
  amount              INTEGER NOT NULL DEFAULT 0,
  tax                 INTEGER NOT NULL DEFAULT 0,
  total               INTEGER NOT NULL DEFAULT 0,
  status              TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid','paid','void')),
  due_date            TEXT NOT NULL,
  paid_at             TEXT,
  payment_method      TEXT,
  midtrans_order_id   TEXT,
  midtrans_url        TEXT,
  notes               TEXT,
  created_at          TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at          TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS demo_requests (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  phone       TEXT,
  business_name TEXT,
  business_type TEXT,
  message     TEXT,
  status      TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','converted','closed')),
  notes       TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS cms_content (
  id          TEXT PRIMARY KEY,
  key         TEXT NOT NULL UNIQUE,
  value       TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'text',
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─── Seed Data ────────────────────────────────────────────────

INSERT OR IGNORE INTO plans (id, name, slug, description, price_monthly, price_yearly, max_users, max_modules, max_branches, features, modules, sort_order) VALUES
  ('plan-basic', 'Basic', 'basic', 'Untuk bisnis kecil', 99000, 990000, 5, 1, 1,
   '["Kasir digital","Laporan dasar","Print struk","WA notifikasi"]',
   '["fnb","retail","laundry","apotek","salon","properti"]', 1),
  ('plan-pro', 'Pro', 'pro', 'Untuk bisnis berkembang', 299000, 2990000, 15, 3, 3,
   '["Semua fitur Basic","Multi cabang","Multi modul","EMR Klinik","Export data","Priority support"]',
   '["fnb","retail","klinik","laundry","apotek","salon","properti"]', 2),
  ('plan-enterprise', 'Enterprise', 'enterprise', 'Untuk bisnis besar', 599000, 5990000, 99, 7, 99,
   '["Semua fitur Pro","Unlimited user","Semua modul","Custom domain","Dedicated support","SLA 99.9%"]',
   '["fnb","retail","klinik","laundry","apotek","salon","properti"]', 3);

INSERT OR IGNORE INTO admins (id, name, email, password, role) VALUES
  ('admin-001', 'Super Admin', 'admin@nexasistem.com',
   'pbkdf2:CHANGEME_RUN_SEED_SCRIPT', 'superadmin');

INSERT OR IGNORE INTO cms_content (id, key, value, type) VALUES
  ('cms-001', 'hero_title', 'Kelola Bisnis UMKM Lebih Mudah', 'text'),
  ('cms-002', 'hero_subtitle', 'Platform SaaS all-in-one untuk FnB, Retail, Klinik, Laundry, Apotek, Salon, dan Properti', 'text'),
  ('cms-003', 'hero_cta', 'Coba Gratis 14 Hari', 'text'),
  ('cms-004', 'contact_wa', '6281234567890', 'text'),
  ('cms-005', 'contact_email', 'halo@nexasistem.com', 'text');
