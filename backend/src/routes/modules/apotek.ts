// backend/src/routes/modules/apotek.ts
import { Hono } from 'hono'
import { uid } from '@nexasistem/db'
import { tenantAuth } from '../../middleware/auth'
import type { Env } from '../../index'

export const apotekRoutes = new Hono<{ Bindings: Env }>()
apotekRoutes.use('*', tenantAuth)

apotekRoutes.get('/', async (c) => {
  const tenantId = c.get('tenantId')
  const action = c.req.query('action') || 'drugs'
  const db = c.env.MASTER_DB

  if (action === 'drugs') {
    const q = c.req.query('q') || ''
    let query = "SELECT p.*,c.name as category_name FROM tenant_products p LEFT JOIN tenant_categories c ON p.category_id=c.id WHERE p.tenant_id=? AND p.module='apotek' AND p.is_active=1"
    const params: unknown[] = [tenantId]
    if (q) { query += ' AND (p.name LIKE ? OR p.sku LIKE ?)'; params.push(`%${q}%`,`%${q}%`) }
    const { results: drugs } = await db.prepare(query + ' ORDER BY p.name').bind(...params).all()
    return c.json({ ok: true, drugs: drugs.map((d: any) => ({ ...d, meta: JSON.parse(d.meta||'{}') })) })
  }
  if (action === 'recipes') {
    const { results: recipes } = await db.prepare("SELECT r.*,c.name as customer_name FROM tenant_apotek_recipes r LEFT JOIN tenant_customers c ON r.customer_id=c.id WHERE r.tenant_id=? ORDER BY r.created_at DESC LIMIT 50").bind(tenantId).all()
    return c.json({ ok: true, recipes: recipes.map((r: any) => ({ ...r, items: JSON.parse(r.items||'[]') })) })
  }
  return c.json({ ok: false, error: 'Action tidak dikenal' }, 400)
})

apotekRoutes.post('/', async (c) => {
  const tenantId = c.get('tenantId')
  const cashierId = c.get('userId')
  const body = await c.req.json()
  const { action } = body
  const db = c.env.MASTER_DB

  if (action === 'checkout') {
    const { customer_id, items, discount=0, paid_amount, payment_method } = body
    const subtotal = items.reduce((a: number, i: any) => a + i.price * i.qty, 0)
    const total = subtotal - discount
    const change = paid_amount - total
    const id = uid()
    const order_number = `APT-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(Math.random()*9000)+1000}`
    await db.prepare("INSERT INTO tenant_orders(id,tenant_id,order_number,module,customer_id,cashier_id,subtotal,discount,total,paid_amount,change_amount,payment_method,payment_status,status) VALUES(?,?,?,'apotek',?,?,?,?,?,?,?,?,'paid','done')").bind(id,tenantId,order_number,customer_id||null,cashierId,subtotal,discount,total,paid_amount,change,payment_method).run()
    await Promise.all(items.map((item: any) => db.prepare("INSERT INTO tenant_order_items(id,tenant_id,order_id,product_id,name,qty,unit,price,discount,subtotal) VALUES(?,?,?,?,?,?,?,?,0,?)").bind(uid(),tenantId,id,item.product_id||null,item.name,item.qty,item.unit||'strip',item.price,item.price*item.qty).run()))
    for (const item of items) {
      if (item.product_id) await db.prepare('UPDATE tenant_products SET stock=stock-? WHERE id=? AND tenant_id=?').bind(item.qty,item.product_id,tenantId).run()
    }
    return c.json({ ok: true, id, order_number, change }, 201)
  }
  return c.json({ ok: false, error: 'Action tidak dikenal' }, 400)
})
