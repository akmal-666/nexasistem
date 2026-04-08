# Nexasistem — Cloudflare Edition

Platform SaaS manajemen bisnis UMKM Indonesia, full-stack di Cloudflare.

## Stack

| Layer     | Teknologi                          | Host                |
|-----------|------------------------------------|---------------------|
| Frontend  | Next.js 14 + @cloudflare/next-on-pages | Cloudflare Pages |
| Backend   | Hono.js                            | Cloudflare Workers  |
| Database  | Cloudflare D1 (SQLite)             | Cloudflare D1       |
| Session   | Cloudflare KV + JWT                | Cloudflare KV       |
| Storage   | Cloudflare R2                      | Cloudflare R2       |
| CI/CD     | GitHub Actions                     | GitHub → Cloudflare |
| Domain    | nexasistem.com (Niagahoster NS → CF)| Cloudflare DNS      |

## Struktur

```
nexasistem-cf/
├── backend/                    Hono.js API (Cloudflare Workers)
│   ├── src/
│   │   ├── index.ts            Entry point
│   │   ├── middleware/auth.ts  JWT + KV auth guards
│   │   └── routes/             API routes (RESTful)
│   │       ├── auth.ts         Admin auth
│   │       ├── tenant-auth.ts  Tenant auth
│   │       ├── setup.ts        Setup wizard
│   │       ├── products.ts     Produk CRUD
│   │       ├── orders.ts       Transaksi
│   │       ├── laporan.ts      Laporan + export CSV
│   │       ├── tenants.ts      Admin: kelola tenant
│   │       ├── billing.ts      Invoice + Midtrans
│   │       └── modules/        Module-specific routes
│   └── wrangler.toml           Workers + D1 + KV config
│
├── frontend/
│   └── apps/
│       ├── web/                nexasistem.com (Landing page)
│       ├── app/                app.nexasistem.com (Tenant app)
│       └── admin/              admin.nexasistem.com (Admin panel)
│
├── packages/
│   ├── shared/src/index.ts     TypeScript types + utilities
│   ├── auth/src/index.ts       JWT + PBKDF2 (Workers-compatible)
│   └── db/
│       ├── schema/master.sql   D1 schema: admin, plans, billing
│       ├── schema/tenant_flat.sql  D1 schema: semua tenant data
│       └── src/index.ts        D1 helpers
│
├── .github/workflows/
│   ├── deploy.yml              CD: push main → deploy semua
│   └── preview.yml             PR preview deploy
│
├── SETUP.md                    Panduan setup lengkap
└── package.json                Workspace root
```

## Quick Start (Development)

```bash
# 1. Clone & install
git clone https://github.com/USERNAME/nexasistem.git
cd nexasistem
npm install

# 2. Setup local D1
cd backend
wrangler d1 execute nexasistem-master \
  --local --file=../packages/db/schema/master.sql
wrangler d1 execute nexasistem-master \
  --local --file=../packages/db/schema/tenant_flat.sql

# 3. Jalankan backend local
npm run dev:backend    # http://localhost:8787

# 4. Jalankan frontend (terminal berbeda)
npm run dev:app        # http://localhost:3001
npm run dev:admin      # http://localhost:3002
npm run dev:web        # http://localhost:3000
```

## Deploy Production

```bash
# 1. Setup Cloudflare resources (ikuti SETUP.md)
# 2. Push ke main → GitHub Actions deploy otomatis
git push origin main

# Atau deploy manual:
npm run deploy:backend
npm run deploy:app
npm run deploy:admin
npm run deploy:web
```

## Modul Bisnis

| Modul      | Kasir | Stok | EMR | Booking | Laporan |
|------------|-------|------|-----|---------|---------|
| FnB        | ✓     | ✓    |     |         | ✓       |
| Retail     | ✓     | ✓    |     |         | ✓       |
| Klinik     | ✓     |      | ✓   |         | ✓       |
| Laundry    | ✓     |      |     |         | ✓       |
| Apotek     | ✓     | ✓    |     |         | ✓       |
| Salon      | ✓     |      |     | ✓       | ✓       |
| Properti   | ✓     |      |     |         | ✓       |

## URL Produksi

- Landing: https://nexasistem.com
- App: https://app.nexasistem.com
- Admin: https://admin.nexasistem.com
- API: https://api.nexasistem.com

## Login Default (Setelah Setup)

| Role  | URL                           | Kredensial                    |
|-------|-------------------------------|-------------------------------|
| Admin | admin.nexasistem.com/login     | admin@nexasistem.com / Admin@123 |
| Tenant | app.nexasistem.com/setup      | Setup wizard dengan slug bisnis |
