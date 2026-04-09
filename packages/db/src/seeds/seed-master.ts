// packages/db/src/seeds/seed-master.ts
// Jalankan: npx wrangler d1 execute nexasistem-master --local --command "$(node -e 'require(\"./seed-master.js\")')"
// Atau via: npm run db:seed:master

import type { D1Database } from '../index'

export async function seedMaster(db: D1Database) {
  console.log('Seeding master database...')

  // Hash admin password (Admin@123) menggunakan PBKDF2
  // Nilai ini hardcoded untuk seed awal - ganti via dashboard setelah login
  // pbkdf2:salt:hash untuk "Admin@123"
  const adminPasswordHash = 'pbkdf2:SEED_HASH_PLACEHOLDER'

  const plans = [
    {
      id: 'plan-basic', name: 'Basic', slug: 'basic',
      description: 'Untuk bisnis kecil yang baru memulai',
      price_monthly: 99000, price_yearly: 990000,
      max_users: 5, max_modules: 1, max_branches: 1,
      features: JSON.stringify(['Kasir digital', 'Laporan dasar', 'Print struk', 'WA notifikasi', 'Support email']),
      modules: JSON.stringify(['fnb', 'retail', 'laundry', 'apotek', 'salon', 'properti']),
      sort_order: 1,
    },
    {
      id: 'plan-pro', name: 'Pro', slug: 'pro',
      description: 'Untuk bisnis yang berkembang',
      price_monthly: 299000, price_yearly: 2990000,
      max_users: 15, max_modules: 3, max_branches: 3,
      features: JSON.stringify(['Semua fitur Basic', 'Multi modul (3)', 'Multi cabang (3)', 'EMR Klinik', 'Export data CSV', 'Manajemen stok', 'Priority support']),
      modules: JSON.stringify(['fnb', 'retail', 'klinik', 'laundry', 'apotek', 'salon', 'properti']),
      sort_order: 2,
    },
    {
      id: 'plan-enterprise', name: 'Enterprise', slug: 'enterprise',
      description: 'Untuk bisnis besar dengan kebutuhan khusus',
      price_monthly: 599000, price_yearly: 5990000,
      max_users: 999, max_modules: 7, max_branches: 999,
      features: JSON.stringify(['Semua fitur Pro', 'Unlimited user & cabang', 'Semua 7 modul', 'API akses', 'SLA 99.9%', 'Dedicated support', 'Training onboarding']),
      modules: JSON.stringify(['fnb', 'retail', 'klinik', 'laundry', 'apotek', 'salon', 'properti']),
      sort_order: 3,
    },
  ]

  for (const plan of plans) {
    await db.prepare(`
      INSERT OR IGNORE INTO plans
        (id, name, slug, description, price_monthly, price_yearly, max_users, max_modules, max_branches, features, modules, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(plan.id, plan.name, plan.slug, plan.description, plan.price_monthly, plan.price_yearly,
      plan.max_users, plan.max_modules, plan.max_branches, plan.features, plan.modules, plan.sort_order).run()
  }

  const cmsItems = [
    ['hero_title', 'Kelola Bisnis UMKM Lebih Mudah', 'text'],
    ['hero_subtitle', 'Platform SaaS all-in-one untuk FnB, Retail, Klinik, Laundry, Apotek, Salon, dan Properti', 'text'],
    ['hero_cta_primary', 'Coba Gratis 14 Hari', 'text'],
    ['hero_cta_secondary', 'Lihat Demo', 'text'],
    ['contact_wa', '6281234567890', 'text'],
    ['contact_email', 'halo@nexasistem.com', 'text'],
    ['footer_tagline', 'Solusi digital untuk UMKM Indonesia', 'text'],
  ]

  for (const [key, value, type] of cmsItems) {
    await db.prepare(`
      INSERT OR IGNORE INTO cms_content (id, key, value, type)
      VALUES (lower(hex(randomblob(8))), ?, ?, ?)
    `).bind(key, value, type).run()
  }

  console.log('✓ Plans seeded (basic, pro, enterprise)')
  console.log('✓ CMS content seeded')
  console.log('\nNOTE: Admin password perlu di-set manual via:')
  console.log('wrangler d1 execute nexasistem-master --command "INSERT OR IGNORE INTO admins(id,name,email,password,role) VALUES(lower(hex(randomblob(16))),\'Super Admin\',\'admin@nexasistem.com\',\'<HASHED_PASSWORD>\',\'superadmin\')"')
  console.log('\nGunakan endpoint POST /api/admin/auth/reset-seed untuk seed admin password otomatis')
}
