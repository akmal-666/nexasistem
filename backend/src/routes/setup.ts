// backend/src/routes/setup.ts
import { Hono } from 'hono'
import { hashPassword } from '@nexasistem/auth'
import { uid } from '@nexasistem/db'
import type { Env } from '../index'

export const setupRoutes = new Hono<{ Bindings: Env }>()

// GET /api/setup/check?slug=...
setupRoutes.get('/check', async (c) => {
  const slug = c.req.query('slug')?.toLowerCase().trim()
  if (!slug) return c.json({ ok: false, error: 'Slug wajib diisi' }, 400)

  const tenant = await c.env.MASTER_DB
    .prepare('SELECT id, name, status FROM tenants WHERE slug = ?')
    .bind(slug).first<{ id: string; name: string; status: string }>()

  if (!tenant) return c.json({ ok: false, exists: false, error: 'ID bisnis tidak ditemukan' }, 404)

  const userCount = await c.env.MASTER_DB
    .prepare('SELECT COUNT(*) as n FROM tenant_users WHERE tenant_id = ?')
    .bind(tenant.id).first<{ n: number }>()

  return c.json({
    ok: true,
    exists: true,
    has_users: (userCount?.n ?? 0) > 0,
    tenant_name: tenant.name,
    status: tenant.status,
  })
})

// POST /api/setup/init
setupRoutes.post('/init', async (c) => {
  try {
    const { slug, name, email, password } = await c.req.json()
    if (!slug || !name || !email || !password) return c.json({ ok: false, error: 'Semua field wajib diisi' }, 400)
    if (password.length < 6) return c.json({ ok: false, error: 'Password minimal 6 karakter' }, 400)

    const tenant = await c.env.MASTER_DB
      .prepare('SELECT * FROM tenants WHERE slug = ?')
      .bind(slug.toLowerCase()).first<{ id: string; name: string; business_type: string }>()
    if (!tenant) return c.json({ ok: false, error: 'Tenant tidak ditemukan' }, 404)

    const existing = await c.env.MASTER_DB
      .prepare('SELECT COUNT(*) as n FROM tenant_users WHERE tenant_id = ?')
      .bind(tenant.id).first<{ n: number }>()
    if ((existing?.n ?? 0) > 0) return c.json({ ok: false, error: 'Tenant sudah punya pengguna. Silakan login.' }, 409)

    const emailExists = await c.env.MASTER_DB
      .prepare('SELECT id FROM tenant_users WHERE tenant_id = ? AND email = ?')
      .bind(tenant.id, email.toLowerCase()).first()
    if (emailExists) return c.json({ ok: false, error: 'Email sudah digunakan' }, 409)

    const hashed = await hashPassword(password)
    const userId = uid()
    const branchId = uid()

    // Buat user owner pertama
    await c.env.MASTER_DB.prepare(`
      INSERT INTO tenant_users (id, tenant_id, name, email, password, role)
      VALUES (?, ?, ?, ?, ?, 'owner')
    `).bind(userId, tenant.id, name, email.toLowerCase(), hashed).run()

    // Buat cabang default
    await c.env.MASTER_DB.prepare(`
      INSERT INTO tenant_branches (id, tenant_id, name, code, is_active, is_default)
      VALUES (?, ?, ?, 'MAIN', 1, 1)
    `).bind(branchId, tenant.id, tenant.name).run()

    // Seed kategori default
    const defaultCategories: Record<string, string[]> = {
      fnb: ['Makanan', 'Minuman', 'Snack'],
      retail: ['Makanan & Minuman', 'Kebutuhan Rumah', 'Kebersihan'],
      klinik: ['Konsultasi', 'Tindakan', 'Laboratorium'],
      laundry: ['Cuci Kering', 'Cuci Setrika'],
      apotek: ['Obat Bebas (OTC)', 'Suplemen', 'Alat Kesehatan'],
      salon: ['Potong Rambut', 'Perawatan Rambut', 'Perawatan Wajah'],
      properti: ['Kos Standar', 'Kos Premium'],
    }

    const cats = defaultCategories[tenant.business_type] || ['Umum']
    await Promise.all(cats.map((name, i) =>
      c.env.MASTER_DB.prepare(`
        INSERT INTO tenant_categories (id, tenant_id, name, slug, module, sort_order)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(uid(), tenant.id, name,
        name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'),
        tenant.business_type, i + 1
      ).run()
    ))

    // Audit log
    await c.env.MASTER_DB.prepare(`
      INSERT INTO tenant_audit_logs (id, tenant_id, user_id, action, notes)
      VALUES (?, ?, ?, 'setup_init', 'Akun pertama dibuat via setup wizard')
    `).bind(uid(), tenant.id, userId).run()

    return c.json({ ok: true, user_id: userId }, 201)
  } catch (err) {
    console.error('[setup/init]', err)
    return c.json({ ok: false, error: 'Server error' }, 500)
  }
})
