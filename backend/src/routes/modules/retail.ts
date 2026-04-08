// backend/src/routes/modules/retail.ts
import { Hono } from 'hono'
import { uid } from '@nexasistem/db'
import { tenantAuth } from '../../middleware/auth'
import type { Env } from '../../index'

export const retailRoutes = new Hono<{ Bindings: Env }>()
retailRoutes.use('*', tenantAuth)

retailRoutes.get('/', async (c) => {
  const tenantId = c.get('tenantId')
  const action = c.req.query('action') || 'products'
  const db = c.env.MASTER_DB

  if (action === 'products') {
    const q = c.req.query('q') || ''
    const category = c.req.query('category') || ''
    let query = "SELECT p.*, c.name as category_name FROM tenant_products p LEFT JOIN tenant_categories c ON p.category_id=c.id WHERE p.tenant_id=? AND p.module='retail' AND p.is_active=1"
    const params: unknown[] = [tenantId]
    if (q) { query += ' AND (p.name LIKE ? OR p.barcode LIKE ? OR p.sku LIKE ?)'; params.push(`%${q}%`,`%${q}%`,`%${q}%`) }
    if (category) { query += ' AND p.category_id=?'; params.push(category) }
    const { results: products } = await db.prepare(query + ' ORDER BY p.name').bind(...params).all()
    return c.json({ ok: true, products })
  }
  if (action === 'stats') {
    const today = new Date().toISOString().slice(0,10)
    const stats = await db.prepare("SELECT COUNT(*) as total_orders, COALESCE(SUM(total),0) as total_revenue FROM tenant_orders WHERE tenant_id=? AND module='retail' AND date(created_at)=?").bind(tenantId,today).first()
    const stockAlert = await db.prepare("SELECT COUNT(*) as n FROM tenant_products WHERE tenant_id=? AND module='retail' AND stock<=min_stock AND is_active=1").bind(tenantId).first<{n:number}>()
    return c.json({ ok: true, stats, low_stock: stockAlert?.n ?? 0 })
  }
  if (action === 'stock') {
    const { results: products } = await db.prepare("SELECT p.*, c.name as category_name, CAST(p.stock*p.cost_price AS INTEGER) as stock_value FROM tenant_products p LEFT JOIN tenant_categories c ON p.category_id=c.id WHERE p.tenant_id=? AND p.module='retail' AND p.is_active=1 ORDER BY p.name").bind(tenantId).all()
    return c.json({ ok: true, products })
  }
  return c.json({ ok: false, error: 'Action tidak dikenal' }, 400)
})

retailRoutes.post('/', async (c) => {
  const tenantId = c.get('tenantId')
  const cashierId = c.get('userId')
  const body = await c.req.json()
  const { action } = body
  const db = c.env.MASTER_DB

  if (action === 'adjust_stock') {
    const { product_id, qty, type, notes } = body
    const product = await db.prepare('SELECT * FROM tenant_products WHERE id=? AND tenant_id=?').bind(product_id,tenantId).first<any>()
    if (!product) return c.json({ ok: false, error: 'Produk tidak ditemukan' }, 404)
    const qty_before = product.stock
    const qty_after = type === 'in' ? qty_before + qty : qty_before - qty
    await db.prepare('UPDATE tenant_products SET stock=? WHERE id=? AND tenant_id=?').bind(qty_after,product_id,tenantId).run()
    await db.prepare("INSERT INTO tenant_stock_movements(id,tenant_id,product_id,type,qty,qty_before,qty_after,notes) VALUES(?,?,?,?,?,?,?,?)").bind(uid(),tenantId,product_id,type,qty,qty_before,qty_after,notes||null).run()
    return c.json({ ok: true, qty_after })
  }
  return c.json({ ok: false, error: 'Action tidak dikenal' }, 400)
})
