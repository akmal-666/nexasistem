# Nexasistem — Panduan Setup Cloudflare + Niagahoster

## Gambaran Umum

```
nexasistem.com        → Cloudflare Pages  (Landing page)
app.nexasistem.com    → Cloudflare Pages  (Tenant app)
admin.nexasistem.com  → Cloudflare Pages  (Admin panel)
api.nexasistem.com    → Cloudflare Workers (Backend API)
```

Semua infrastruktur di Cloudflare — tidak ada VPS, tidak ada server.

---

## Langkah 1 — Siapkan Akun

### 1.1 Cloudflare
1. Daftar di [cloudflare.com](https://cloudflare.com) (gratis)
2. Masuk ke dashboard
3. Catat **Account ID** (ada di sidebar kanan dashboard, atau Settings → Account ID)

### 1.2 GitHub
1. Buat repo baru: `github.com/new`
2. Nama repo: `nexasistem`
3. Visibility: **Private**
4. Jangan initialize (kita akan push dari lokal)

---

## Langkah 2 — Pindahkan Domain dari Niagahoster ke Cloudflare

### 2.1 Tambahkan Domain di Cloudflare
1. Di Cloudflare dashboard → klik **Add a Site**
2. Masukkan domain: `nexasistem.com`
3. Pilih plan **Free**
4. Cloudflare akan scan DNS records yang ada — klik **Continue**
5. Cloudflare akan memberikan 2 nameserver, contoh:
   ```
   carter.ns.cloudflare.com
   liz.ns.cloudflare.com
   ```
   (Nama NS Anda mungkin berbeda — gunakan yang diberikan Cloudflare)

### 2.2 Update Nameserver di Niagahoster
1. Login ke [niagahoster.co.id](https://niagahoster.co.id)
2. Masuk ke **My Products** → pilih domain `nexasistem.com`
3. Klik **Manage** → **Nameserver**
4. Pilih **Custom Nameserver**
5. Isi dengan nameserver dari Cloudflare:
   ```
   NS 1: carter.ns.cloudflare.com
   NS 2: liz.ns.cloudflare.com
   ```
6. Klik **Save**
7. Propagasi NS: **15 menit – 24 jam** (biasanya < 1 jam)

### 2.3 Verifikasi
Di Cloudflare dashboard, status domain berubah dari **Pending** ke **Active** (ada centang hijau).

---

## Langkah 3 — Cloudflare SSL & Security

Di Cloudflare dashboard → klik domain `nexasistem.com`:

1. **SSL/TLS** → Overview → Mode: **Full (strict)**
2. **SSL/TLS** → Edge Certificates:
   - Always Use HTTPS: **ON**
   - Minimum TLS Version: **TLS 1.2**
   - Automatic HTTPS Rewrites: **ON**
3. **Security** → Settings → Security Level: **Medium**

---

## Langkah 4 — Setup Cloudflare D1, KV, dan R2

Buka terminal di folder project, lalu jalankan:

### 4.1 Install Wrangler
```bash
npm install -g wrangler
wrangler login
# Browser akan terbuka → authorize → kembali ke terminal
```

### 4.2 Buat D1 Database
```bash
# Database master (admin, plans, billing, semua tenant data)
wrangler d1 create nexasistem-master

# Output:
# ✅ Successfully created DB 'nexasistem-master'
# database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

Salin `database_id` → update di `backend/wrangler.toml`:
```toml
[[d1_databases]]
binding = "MASTER_DB"
database_name = "nexasistem-master"
database_id = "PASTE_ID_DI_SINI"
```

### 4.3 Buat KV Namespaces
```bash
# Session storage
wrangler kv:namespace create SESSION_KV
# → id = "xxx"
# Preview (untuk dev)
wrangler kv:namespace create SESSION_KV --preview
# → preview_id = "yyy"

# Cache
wrangler kv:namespace create CACHE_KV
wrangler kv:namespace create CACHE_KV --preview
```

Update `backend/wrangler.toml` dengan ID yang didapat.

### 4.4 Buat R2 Bucket
```bash
wrangler r2 bucket create nexasistem-storage
```

### 4.5 Run Database Migrations
```bash
# Masuk ke folder backend
cd backend

# Run master schema
wrangler d1 execute nexasistem-master \
  --file=../packages/db/schema/master.sql --remote

# Run tenant flat schema
wrangler d1 execute nexasistem-master \
  --file=../packages/db/schema/tenant_flat.sql --remote

# Seed data awal (plans, CMS)
wrangler d1 execute nexasistem-master \
  --command="INSERT OR IGNORE INTO plans (id, name, slug, description, price_monthly, price_yearly, max_users, max_modules, max_branches, features, modules, sort_order) VALUES ('plan-basic', 'Basic', 'basic', 'Untuk bisnis kecil', 99000, 990000, 5, 1, 1, '[\"Kasir digital\",\"Laporan dasar\",\"Print struk\"]', '[\"fnb\",\"retail\",\"laundry\",\"apotek\",\"salon\",\"properti\"]', 1)" --remote

wrangler d1 execute nexasistem-master \
  --command="INSERT OR IGNORE INTO plans (id, name, slug, description, price_monthly, price_yearly, max_users, max_modules, max_branches, features, modules, sort_order) VALUES ('plan-pro', 'Pro', 'pro', 'Untuk bisnis berkembang', 299000, 2990000, 15, 3, 3, '[\"Semua fitur Basic\",\"Multi modul\",\"EMR Klinik\",\"Export CSV\"]', '[\"fnb\",\"retail\",\"klinik\",\"laundry\",\"apotek\",\"salon\",\"properti\"]', 2)" --remote

wrangler d1 execute nexasistem-master \
  --command="INSERT OR IGNORE INTO plans (id, name, slug, description, price_monthly, price_yearly, max_users, max_modules, max_branches, features, modules, sort_order) VALUES ('plan-enterprise', 'Enterprise', 'enterprise', 'Untuk bisnis besar', 599000, 5990000, 999, 7, 999, '[\"Semua fitur Pro\",\"Unlimited user\",\"Semua modul\",\"SLA 99.9%\"]', '[\"fnb\",\"retail\",\"klinik\",\"laundry\",\"apotek\",\"salon\",\"properti\"]', 3)" --remote
```

---

## Langkah 5 — Set Cloudflare Secrets

```bash
cd backend

# JWT Secret (buat sendiri: openssl rand -hex 32)
wrangler secret put JWT_SECRET
# → Masukkan nilai: <random 32+ karakter>

# Midtrans (jika pakai billing otomatis)
wrangler secret put MIDTRANS_SERVER_KEY
wrangler secret put MIDTRANS_CLIENT_KEY
wrangler secret put MIDTRANS_IS_PRODUCTION
# → Masukkan: false (untuk testing), true (production)

# WhatsApp (Fonnte)
wrangler secret put WA_API_URL
# → https://api.fonnte.com/send
wrangler secret put WA_API_TOKEN
# → token dari fonnte.com
```

---

## Langkah 6 — Buat Admin Pertama

```bash
# Hash password Admin@123 (ganti nanti!)
# Jalankan script ini untuk generate hash dan insert admin
cd backend

# Option A: Pakai wrangler d1 execute langsung
# Anda perlu hash password dulu - jalankan via local dev:
wrangler dev --local &
# Kemudian hit endpoint:
curl -X POST http://localhost:8787/api/admin/auth/seed \
  -H "Content-Type: application/json" \
  -d '{"name":"Super Admin","email":"admin@nexasistem.com","password":"Admin@123","secret":"SEED_SECRET_FROM_ENV"}'

# Option B: Insert via wrangler d1 (password sudah di-hash via tools)
# Gunakan bcrypt online tool untuk hash "Admin@123" lalu:
wrangler d1 execute nexasistem-master \
  --command="INSERT OR IGNORE INTO admins(id,name,email,password,role) VALUES(lower(hex(randomblob(16))),'Super Admin','admin@nexasistem.com','HASH_DI_SINI','superadmin')" \
  --remote
```

> **Cara termudah**: Deploy backend dulu (langkah 7), lalu jalankan endpoint `/api/admin/auth/setup-first` yang ada di backend untuk buat admin pertama.

---

## Langkah 7 — Deploy Backend ke Cloudflare Workers

```bash
cd backend
wrangler deploy

# Output:
# ✅ Deployed nexasistem-api (0.08 sec)
# https://nexasistem-api.<account>.workers.dev

# Tambahkan custom route di Cloudflare dashboard:
# Workers & Pages → nexasistem-api → Settings → Triggers
# → Add Custom Domain: api.nexasistem.com
```

### Verifikasi backend:
```bash
curl https://api.nexasistem.com/health
# → {"ok":true,"env":"production","ts":1234567890}
```

---

## Langkah 8 — Buat Cloudflare Pages Projects

Di Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages**:

### 8.1 nexasistem-web (Landing Page)
- Connect to Git → pilih repo `nexasistem`
- Production branch: `main`
- Framework preset: **Next.js**
- Build command: `cd frontend/apps/web && npx @cloudflare/next-on-pages`
- Build output directory: `frontend/apps/web/.vercel/output/static`
- Environment variables:
  ```
  NEXT_PUBLIC_API_URL=https://api.nexasistem.com
  NEXT_PUBLIC_APP_URL=https://app.nexasistem.com
  ```
- Klik **Save and Deploy**

Setelah deploy → **Custom Domains** → Add domain: `nexasistem.com` dan `www.nexasistem.com`

### 8.2 nexasistem-app (Tenant App)
- Connect to Git → repo yang sama
- Build command: `cd frontend/apps/app && npx @cloudflare/next-on-pages`
- Build output: `frontend/apps/app/.vercel/output/static`
- Environment variables:
  ```
  NEXT_PUBLIC_API_URL=https://api.nexasistem.com
  NEXT_PUBLIC_APP_URL=https://app.nexasistem.com
  ```
- Custom domain: `app.nexasistem.com`

### 8.3 nexasistem-admin (Admin Panel)
- Build command: `cd frontend/apps/admin && npx @cloudflare/next-on-pages`
- Build output: `frontend/apps/admin/.vercel/output/static`
- Environment variables:
  ```
  NEXT_PUBLIC_API_URL=https://api.nexasistem.com
  NEXT_PUBLIC_ADMIN_URL=https://admin.nexasistem.com
  ```
- Custom domain: `admin.nexasistem.com`

---

## Langkah 9 — Setup GitHub Actions (CI/CD)

### 9.1 Buat API Token Cloudflare
1. Cloudflare dashboard → **My Profile** → **API Tokens** → **Create Token**
2. Template: **Edit Cloudflare Workers**
3. Permissions tambahkan:
   - Zone → DNS → Edit
   - Cloudflare Pages → Edit
   - D1 → Edit
4. Klik **Continue to Summary** → **Create Token**
5. Salin token (hanya tampil sekali!)

### 9.2 Tambahkan Secrets ke GitHub
Di repo GitHub → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:

```
CLOUDFLARE_API_TOKEN  = <token dari langkah 9.1>
CLOUDFLARE_ACCOUNT_ID = <Account ID dari Cloudflare>
```

### 9.3 Push ke GitHub
```bash
cd /path/to/nexasistem-cf

# Init git
git init
git add .
git commit -m "feat: initial Cloudflare deployment setup"

# Push ke GitHub
git remote add origin https://github.com/USERNAME/nexasistem.git
git branch -M main
git push -u origin main
```

GitHub Actions akan otomatis deploy ke Cloudflare setiap push ke `main`.

---

## Langkah 10 — DNS Records di Cloudflare

Di Cloudflare dashboard → domain `nexasistem.com` → **DNS** → **Records**:

Cloudflare Pages dan Workers otomatis menambahkan CNAME saat kamu set custom domain.
Jika perlu manual:

| Type  | Name    | Content                              | Proxy |
|-------|---------|--------------------------------------|-------|
| CNAME | `@`     | `nexasistem-web.pages.dev`           | ✓     |
| CNAME | `www`   | `nexasistem-web.pages.dev`           | ✓     |
| CNAME | `app`   | `nexasistem-app.pages.dev`           | ✓     |
| CNAME | `admin` | `nexasistem-admin.pages.dev`         | ✓     |
| CNAME | `api`   | `nexasistem-api.<acct>.workers.dev`  | ✓     |

> **Penting**: Pastikan proxy (awan oranye) aktif untuk semua record — ini yang bikin Cloudflare SSL dan WAF aktif.

---

## Langkah 11 — Test Final

```bash
# Backend health
curl https://api.nexasistem.com/health

# Test admin login
curl -X POST https://api.nexasistem.com/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@nexasistem.com","password":"Admin@123"}'

# Cek landing page
open https://nexasistem.com

# Cek app
open https://app.nexasistem.com/login

# Cek admin
open https://admin.nexasistem.com
```

---

## Membuat Tenant Pertama (Test End-to-End)

```bash
# 1. Login sebagai admin
curl -X POST https://api.nexasistem.com/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"admin@nexasistem.com","password":"Admin@123"}'

# 2. Buat tenant
curl -X POST https://api.nexasistem.com/api/admin/tenants \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name": "Warung Makan Pak Budi",
    "slug": "warung-pak-budi",
    "business_type": "fnb",
    "owner_name": "Pak Budi",
    "owner_email": "budi@warung.com",
    "plan_id": "plan-basic"
  }'

# 3. Setup akun tenant
open https://app.nexasistem.com/setup
# → Masukkan ID bisnis: warung-pak-budi
# → Buat akun pertama
```

---

## Estimasi Biaya Cloudflare

| Layanan              | Free Tier                         | Biaya jika overrun |
|----------------------|-----------------------------------|--------------------|
| Workers              | 100K req/hari                     | $5/10M req         |
| Pages                | Unlimited request & bandwidth     | Gratis             |
| D1                   | 5M reads, 100K writes/hari, 5GB   | $0.001/100K reads  |
| KV                   | 100K reads, 1K writes/hari, 1GB   | $0.50/1M reads     |
| R2                   | 10GB storage, 10M ops/bulan       | $0.015/GB storage  |

**Untuk awal**: **Semua gratis** selama < 100K request/hari.
**Saat scaling**: Workers paid plan $5/bulan sudah lebih dari cukup untuk ribuan tenant aktif.

---

## Troubleshooting

### Build gagal di GitHub Actions
```bash
# Cek log di GitHub Actions tab
# Error umum: module not found
# Fix: pastikan semua packages ada di dependencies (bukan devDependencies) jika dipakai di runtime
```

### Workers error: "D1 binding not found"
```bash
# Pastikan database_id di wrangler.toml sudah benar
wrangler d1 list
# Salin ID yang sesuai ke wrangler.toml
```

### CORS error di browser
```bash
# Pastikan URL frontend sudah ada di allowlist CORS di backend/src/index.ts
# Cek Network tab browser → lihat response header Access-Control-Allow-Origin
```

### Domain belum aktif
```bash
# Cek propagasi NS:
dig NS nexasistem.com
# Harus menampilkan NS Cloudflare, bukan Niagahoster
# Tunggu 15 menit - 24 jam
```

### Next.js build error dengan @cloudflare/next-on-pages
```bash
# Pastikan semua routes pakai edge runtime jika ada API routes di Next.js
# Tambahkan di setiap route file:
# export const runtime = 'edge'
# 
# Atau gunakan semua fetch ke backend Workers (tidak ada API routes di frontend)
# — ini adalah pendekatan yang dipakai Nexasistem
```

---

## Checklist Sebelum Go-Live

- [ ] Domain NS sudah pointing ke Cloudflare (status Active)
- [ ] SSL mode: Full (strict)
- [ ] D1 migrations sudah dijalankan (master.sql + tenant_flat.sql)
- [ ] Backend Workers deployed dan health check OK
- [ ] Semua 3 Cloudflare Pages deployed
- [ ] Custom domains sudah ditambahkan ke masing-masing Pages
- [ ] JWT_SECRET sudah di-set via `wrangler secret put`
- [ ] Admin pertama sudah dibuat
- [ ] GitHub Actions secrets sudah ditambahkan
- [ ] Test end-to-end: buat tenant → setup → login → kasir
- [ ] Password admin default sudah diganti
- [ ] Midtrans dikonfigurasi (jika pakai billing otomatis)
- [ ] WA API dikonfigurasi (jika pakai notifikasi WA)
