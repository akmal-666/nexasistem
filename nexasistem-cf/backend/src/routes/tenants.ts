// backend/src/routes/tenants.ts
import { Hono } from 'hono'
import { uid } from '@nexasistem/db'
import { adminAuth, superadminOnly } from '../middleware/auth'
import type { Env } from '../index'

export const tenantRoutes = new Hono<{ Bindings: Env }>()
tenantRoutes.use('*', adminAuth)

// GET /api/admin/tenants
tenantRoutes.get('/', async (c) => {
  const q = c.req.query('q') || ''
  const status = c.req.query('status') || ''
  const page = parseInt(c.req.query('page') || '1')
  const limit = 20

  let where = '1=1'
  const params: unknown[] = []
  if (q) { where += ' AND (t.name LIKE ? OR t.slug LIKE ? OR t.owner_email LIKE ?)'; params.push(`%${q}%`, `%${q}%`, `%${q}%`) }
  if (status) { where += ' AND t.status = ?'; params.push(status) }

  const total = await c.env.MASTER_DB
    .prepare(`SELECT COUNT(*) as n FROM tenants t WHERE ${where}`).bind(...params)
    .first<{ n: number }>()

  const { results: tenants } = await c.env.MASTER_DB.prepare(`
    SELECT t.*, p.name as plan_name
    FROM tenants t
    LEFT JOIN plans p ON t.plan_id = p.id
    WHERE ${where}
    ORDER BY t.created_at DESC
    LIMIT ? OFFSET ?
  `).bind(...params, limit, (page - 1) * limit).all()

  // Get modules per tenant
  const tenantIds = tenants.map((t: any) => t.id)
  let modulesMap: Record<string, string[]> = {}
  if (tenantIds.length) {
    const placeholders = tenantIds.map(() => '?').join(',')
    const { results: mods } = await c.env.MASTER_DB
      .prepare(`SELECT tenant_id, module FROM tenant_modules WHERE tenant_id IN (${placeholders}) AND is_active = 1`)
      .bind(...tenantIds).all<{ tenant_id: string; module: string }>()
    for (const m of mods) {
      if (!modulesMap[m.tenant_id]) modulesMap[m.tenant_id] = []
      modulesMap[m.tenant_id].push(m.module)
    }
  }

  return c.json({
    ok: true,
    tenants: tenants.map((t: any) => ({ ...t, modules: modulesMap[t.id] || [] })),
    total: total?.n ?? 0, page,
  })
})

// GET /api/admin/tenants/:id
tenantRoutes.get('/:id', async (c) => {
  const id = c.req.param('id')
  const tenant = await c.env.MASTER_DB
    .prepare('SELECT t.*, p.name as plan_name FROM tenants t LEFT JOIN plans p ON t.plan_id = p.id WHERE t.id = ?')
    .bind(id).first()
  if (!tenant) return c.json({ ok: false, error: 'Tenant tidak ditemukan' }, 404)

  const { results: modules } = await c.env.MASTER_DB
    .prepare('SELECT * FROM tenant_modules WHERE tenant_id = ?').bind(id).all()
  const { results: invoices } = await c.env.MASTER_DB
    .prepare('SELECT * FROM invoices WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 10').bind(id).all()

  return c.json({ ok: true, tenant, modules, invoices })
})

// POST /api/admin/tenants
tenantRoutes.post('/', superadminOnly, async (c) => {
  try {
    const body = await c.req.json()
    const { name, slug, business_type, owner_name, owner_email, owner_phone, plan_id } = body
    if (!name || !slug || !business_type || !owner_email) {
      return c.json({ ok: false, error: 'Nama, slug, jenis bisnis, dan email wajib diisi' }, 400)
    }

    const exists = await c.env.MASTER_DB
      .prepare('SELECT id FROM tenants WHERE slug = ?').bind(slug).first()
    if (exists) return c.json({ ok: false, error: 'Slug sudah digunakan' }, 409)

    const id = uid()
    const trialEnds = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

    await c.env.MASTER_DB.prepare(`
      INSERT INTO tenants (id, name, slug, business_type, owner_name, owner_email, owner_phone, plan_id, status, trial_ends_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'trial', ?)
    `).bind(id, name, slug, business_type, owner_name || '', owner_email, owner_phone || null, plan_id || null, trialEnds).run()

    // Aktifkan modul default dari plan
    if (plan_id) {
      const plan = await c.env.MASTER_DB
        .prepare('SELECT modules FROM plans WHERE id = ?').bind(plan_id).first<{ modules: string }>()
      if (plan) {
        const modules = JSON.parse(plan.modules || '[]') as string[]
        await Promise.all(modules.map(m =>
          c.env.MASTER_DB.prepare('INSERT OR IGNORE INTO tenant_modules (id, tenant_id, module) VALUES (?, ?, ?)')
            .bind(uid(), id, m).run()
        ))
      }
    }

    return c.json({ ok: true, id }, 201)
  } catch (err) {
    return c.json({ ok: false, error: String(err) }, 500)
  }
})

// PATCH /api/admin/tenants/:id
tenantRoutes.patch('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const { action } = body

    if (action === 'update_status') {
      await c.env.MASTER_DB
        .prepare("UPDATE tenants SET status = ?, updated_at = datetime('now') WHERE id = ?")
        .bind(body.status, id).run()
      return c.json({ ok: true })
    }

    if (action === 'update_plan') {
      await c.env.MASTER_DB
        .prepare("UPDATE tenants SET plan_id = ?, updated_at = datetime('now') WHERE id = ?")
        .bind(body.plan_id || null, id).run()

      if (body.modules && Array.isArray(body.modules)) {
        await c.env.MASTER_DB.prepare('DELETE FROM tenant_modules WHERE tenant_id = ?').bind(id).run()
        await Promise.all(body.modules.map((m: string) =>
          c.env.MASTER_DB.prepare('INSERT INTO tenant_modules (id, tenant_id, module) VALUES (?, ?, ?)')
            .bind(uid(), id, m).run()
        ))
      }
      return c.json({ ok: true })
    }

    return c.json({ ok: false, error: 'Action tidak dikenal' }, 400)
  } catch (err) {
    return c.json({ ok: false, error: String(err) }, 500)
  }
})
