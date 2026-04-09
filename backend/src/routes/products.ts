// backend/src/routes/products.ts
import { Hono } from 'hono'
import { uid, paginate } from '@nexasistem/db'
import { tenantAuth } from '../middleware/auth'
import type { Env } from '../index'

export const productRoutes = new Hono<{ Bindings: Env }>()
productRoutes.use('*', tenantAuth)

// GET /api/products
productRoutes.get('/', async (c) => {
  const tenantId = c.get('tenantId')
  const q = c.req.query('q') || ''
  const module = c.req.query('module') || ''
  const category = c.req.query('category') || ''
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '50')
  const { limit: lim, offset } = paginate(page, limit)

  let query = `
    SELECT p.*, c.name as category_name
    FROM tenant_products p
    LEFT JOIN tenant_categories c ON p.category_id = c.id
    WHERE p.tenant_id = ? AND p.is_active = 1
  `
  const params: unknown[] = [tenantId]

  if (q) { query += ' AND (p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ?)'; params.push(`%${q}%`, `%${q}%`, `%${q}%`) }
  if (module) { query += ' AND p.module = ?'; params.push(module) }
  if (category) { query += ' AND p.category_id = ?'; params.push(category) }

  const countQuery = query.replace('SELECT p.*, c.name as category_name', 'SELECT COUNT(*) as n')
  const total = await c.env.MASTER_DB.prepare(countQuery + ' LIMIT 1').bind(...params).first<{ n: number }>()

  query += ` ORDER BY p.name LIMIT ? OFFSET ?`
  params.push(lim, offset)

  const { results: products } = await c.env.MASTER_DB.prepare(query).bind(...params).all()

  return c.json({
    ok: true,
    products: products.map((p: any) => ({ ...p, meta: JSON.parse(p.meta || '{}') })),
    total: total?.n ?? 0,
    page, limit: lim,
  })
})

// POST /api/products
productRoutes.post('/', async (c) => {
  try {
    const tenantId = c.get('tenantId')
    const body = await c.req.json()
    const { name, module, category_id, price = 0, cost_price = 0, stock = 0, unit = 'pcs', min_stock = 0, sku, barcode, description, meta } = body
    if (!name || !module) return c.json({ ok: false, error: 'Nama dan modul wajib diisi' }, 400)

    const id = uid()
    await c.env.MASTER_DB.prepare(`
      INSERT INTO tenant_products
        (id, tenant_id, category_id, module, name, sku, barcode, description, price, cost_price, stock, unit, min_stock, meta)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(id, tenantId, category_id || null, module, name, sku || null, barcode || null,
      description || null, price, cost_price, stock, unit, min_stock,
      JSON.stringify(meta || {})).run()

    return c.json({ ok: true, id }, 201)
  } catch (err) {
    return c.json({ ok: false, error: String(err) }, 500)
  }
})

// PATCH /api/products/:id
productRoutes.patch('/:id', async (c) => {
  try {
    const tenantId = c.get('tenantId')
    const id = c.req.param('id')
    const body = await c.req.json()

    const existing = await c.env.MASTER_DB
      .prepare('SELECT id FROM tenant_products WHERE id = ? AND tenant_id = ?')
      .bind(id, tenantId).first()
    if (!existing) return c.json({ ok: false, error: 'Produk tidak ditemukan' }, 404)

    const updates: string[] = []
    const vals: unknown[] = []
    const allowed = ['name','category_id','price','cost_price','stock','unit','min_stock','sku','barcode','description','is_active','meta']
    for (const field of allowed) {
      if (body[field] !== undefined) {
        updates.push(`${field} = ?`)
        vals.push(field === 'meta' ? JSON.stringify(body[field]) : body[field])
      }
    }
    if (!updates.length) return c.json({ ok: false, error: 'Tidak ada field yang diupdate' }, 400)
    updates.push("updated_at = datetime('now')")
    vals.push(id, tenantId)

    await c.env.MASTER_DB.prepare(
      `UPDATE tenant_products SET ${updates.join(', ')} WHERE id = ? AND tenant_id = ?`
    ).bind(...vals).run()

    return c.json({ ok: true })
  } catch (err) {
    return c.json({ ok: false, error: String(err) }, 500)
  }
})

// DELETE /api/products/:id
productRoutes.delete('/:id', async (c) => {
  const tenantId = c.get('tenantId')
  const id = c.req.param('id')
  await c.env.MASTER_DB
    .prepare('UPDATE tenant_products SET is_active = 0 WHERE id = ? AND tenant_id = ?')
    .bind(id, tenantId).run()
  return c.json({ ok: true })
})
