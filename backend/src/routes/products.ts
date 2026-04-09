// backend/src/routes/products.ts
import { Hono } from 'hono'
import { tenantAuth } from '../middleware/auth'
import { uid } from '@nexasistem/db'
import type { Env } from '../index'

export const productRoutes = new Hono<{ Bindings: Env }>()
productRoutes.use('*', tenantAuth)

// GET /api/products
productRoutes.get('/', async (c) => {
  const tenantId = c.get('tenantId')
  const db = c.env.MASTER_DB
  const module = c.req.query('module') || ''
  const q = c.req.query('q') || ''
  const category = c.req.query('category') || ''
  const limit = parseInt(c.req.query('limit') || '100')
  const offset = parseInt(c.req.query('offset') || '0')

  let query = `SELECT p.*, c.name as category_name
    FROM tenant_products p
    LEFT JOIN tenant_categories c ON p.category_id = c.id
    WHERE p.tenant_id = ?`
  const params: unknown[] = [tenantId]

  if (module) { query += ' AND p.module = ?'; params.push(module) }
  if (q) { query += ' AND (p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ?)'; params.push(`%${q}%`, `%${q}%`, `%${q}%`) }
  if (category) { query += ' AND p.category_id = ?'; params.push(category) }

  query += ' ORDER BY p.name LIMIT ? OFFSET ?'
  params.push(limit, offset)

  const { results: products } = await db.prepare(query).bind(...params).all()
  const count = await db.prepare(`SELECT COUNT(*) as n FROM tenant_products WHERE tenant_id = ?${module ? ` AND module = '${module}'` : ''}`).bind(tenantId).first<{n:number}>()

  return c.json({ ok: true, products: products.map((p: any) => ({ ...p, meta: JSON.parse(p.meta || '{}') })), total: count?.n ?? 0 })
})

// GET /api/products/:id
productRoutes.get('/:id', async (c) => {
  const tenantId = c.get('tenantId')
  const id = c.req.param('id')
  const product = await c.env.MASTER_DB.prepare(
    'SELECT p.*, c.name as category_name FROM tenant_products p LEFT JOIN tenant_categories c ON p.category_id = c.id WHERE p.id = ? AND p.tenant_id = ?'
  ).bind(id, tenantId).first<any>()
  if (!product) return c.json({ ok: false, error: 'Produk tidak ditemukan' }, 404)
  return c.json({ ok: true, product: { ...product, meta: JSON.parse(product.meta || '{}') } })
})

// POST /api/products
productRoutes.post('/', async (c) => {
  const tenantId = c.get('tenantId')
  const body = await c.req.json()
  const { name, module, sku, barcode, description, price, cost_price = 0, stock = 0, unit = 'pcs', min_stock = 0, category_id, is_active = 1, meta = {} } = body

  if (!name || !module) return c.json({ ok: false, error: 'name dan module wajib diisi' }, 400)
  if (price === undefined || price === null || price < 0) return c.json({ ok: false, error: 'Harga tidak valid' }, 400)

  const id = uid()
  await c.env.MASTER_DB.prepare(`
    INSERT INTO tenant_products (id, tenant_id, module, name, sku, barcode, description, price, cost_price, stock, unit, min_stock, category_id, is_active, meta)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(id, tenantId, module, name, sku || null, barcode || null, description || null, price, cost_price, stock, unit, min_stock, category_id || null, is_active ? 1 : 0, JSON.stringify(meta)).run()

  return c.json({ ok: true, id }, 201)
})

// PATCH /api/products/:id
productRoutes.patch('/:id', async (c) => {
  const tenantId = c.get('tenantId')
  const id = c.req.param('id')
  const body = await c.req.json()

  const existing = await c.env.MASTER_DB.prepare('SELECT id FROM tenant_products WHERE id = ? AND tenant_id = ?').bind(id, tenantId).first()
  if (!existing) return c.json({ ok: false, error: 'Produk tidak ditemukan' }, 404)

  const fields: string[] = []
  const vals: unknown[] = []

  const allowed = ['name','sku','barcode','description','price','cost_price','stock','unit','min_stock','category_id','is_active','meta']
  for (const key of allowed) {
    if (key in body) {
      fields.push(`${key} = ?`)
      vals.push(key === 'meta' ? JSON.stringify(body[key]) : key === 'is_active' ? (body[key] ? 1 : 0) : body[key])
    }
  }

  if (!fields.length) return c.json({ ok: false, error: 'Tidak ada field yang diupdate' }, 400)

  fields.push("updated_at = datetime('now')")
  vals.push(id, tenantId)

  await c.env.MASTER_DB.prepare(`UPDATE tenant_products SET ${fields.join(', ')} WHERE id = ? AND tenant_id = ?`).bind(...vals).run()
  return c.json({ ok: true })
})

// DELETE /api/products/:id
productRoutes.delete('/:id', async (c) => {
  const tenantId = c.get('tenantId')
  const id = c.req.param('id')
  await c.env.MASTER_DB.prepare('UPDATE tenant_products SET is_active = 0 WHERE id = ? AND tenant_id = ?').bind(id, tenantId).run()
  return c.json({ ok: true })
})