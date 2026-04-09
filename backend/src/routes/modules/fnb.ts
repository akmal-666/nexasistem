// backend/src/routes/modules/fnb.ts
import { Hono } from 'hono'
import { uid } from '@nexasistem/db'
import { tenantAuth } from '../../middleware/auth'
import type { Env } from '../../index'

export const fnbRoutes = new Hono<{ Bindings: Env }>()
fnbRoutes.use('*', tenantAuth)

fnbRoutes.get('/', async (c) => {
  const tenantId = c.get('tenantId')
  const action = c.req.query('action')
  const db = c.env.MASTER_DB

  if (action === 'tables') {
    const { results } = await db.prepare('SELECT * FROM tenant_fnb_tables WHERE tenant_id = ? ORDER BY name').bind(tenantId).all()
    return c.json({ ok: true, tables: results })
  }
  if (action === 'order_detail') {
    const order_id = c.req.query('order_id')
    const order = await db.prepare('SELECT * FROM tenant_orders WHERE id = ? AND tenant_id = ?').bind(order_id, tenantId).first<any>()
    if (!order) return c.json({ ok: false, error: 'Order tidak ditemukan' }, 404)
    const { results: items } = await db.prepare('SELECT * FROM tenant_order_items WHERE order_id = ? AND tenant_id = ?').bind(order_id, tenantId).all()
    return c.json({ ok: true, order: { ...order, meta: JSON.parse(order.meta || '{}') }, items })
  }
  if (action === 'orders') {
    const date = c.req.query('date') || new Date().toISOString().slice(0, 10)
    const status = c.req.query('status') || ''
    let query = "SELECT o.*, c.name as customer_name FROM tenant_orders o LEFT JOIN tenant_customers c ON o.customer_id = c.id WHERE o.tenant_id = ? AND o.module = 'fnb' AND date(o.created_at) = ?"
    const params: unknown[] = [tenantId, date]
    if (status) { query += ' AND o.status = ?'; params.push(status) }
    const { results: orders } = await db.prepare(query + ' ORDER BY o.created_at DESC').bind(...params).all()
    return c.json({ ok: true, orders })
  }
  if (action === 'stats') {
    const today = new Date().toISOString().slice(0, 10)
    const stats = await db.prepare("SELECT COUNT(*) as total_orders, COALESCE(SUM(total),0) as total_revenue, COUNT(CASE WHEN status='done' THEN 1 END) as done_orders FROM tenant_orders WHERE tenant_id = ? AND module = 'fnb' AND date(created_at) = ?").bind(tenantId, today).first()
    const tableStats = await db.prepare("SELECT COUNT(*) as total, COUNT(CASE WHEN status='occupied' THEN 1 END) as occupied, COUNT(CASE WHEN status='available' THEN 1 END) as available FROM tenant_fnb_tables WHERE tenant_id = ?").bind(tenantId).first()
    return c.json({ ok: true, stats, tableStats })
  }
  // Default: products
  const q = c.req.query('q') || ''
  const category = c.req.query('category') || ''
  let query = "SELECT p.*, c.name as category_name FROM tenant_products p LEFT JOIN tenant_categories c ON p.category_id = c.id WHERE p.tenant_id = ? AND p.module = 'fnb' AND p.is_active = 1"
  const params: unknown[] = [tenantId]
  if (q) { query += ' AND p.name LIKE ?'; params.push(`%${q}%`) }
  if (category) { query += ' AND p.category_id = ?'; params.push(category) }
  const { results: products } = await db.prepare(query + ' ORDER BY p.name').bind(...params).all()
  return c.json({ ok: true, products: products.map((p: any) => ({ ...p, meta: JSON.parse(p.meta || '{}') })) })
})

fnbRoutes.post('/', async (c) => {
  const tenantId = c.get('tenantId')
  const cashierId = c.get('userId')
  const body = await c.req.json()
  const { action } = body
  const db = c.env.MASTER_DB

  if (action === 'add_table') {
    const { name, capacity = 4 } = body
    if (!name) return c.json({ ok: false, error: 'Nama meja wajib' }, 400)
    const id = uid()
    await db.prepare("INSERT INTO tenant_fnb_tables (id,tenant_id,name,capacity,status) VALUES (?,?,'available',?,?)").bind(id, tenantId, name, capacity).run()
    return c.json({ ok: true, id }, 201)
  }

  if (action === 'update_table_status') {
    const { table_id, status } = body
    await db.prepare("UPDATE tenant_fnb_tables SET status=?, order_id=CASE WHEN ?='available' THEN NULL ELSE order_id END WHERE id=? AND tenant_id=?").bind(status, status, table_id, tenantId).run()
    return c.json({ ok: true })
  }

  if (action === 'create_order') {
    const { items, table_id, customer_id, discount = 0, notes } = body
    if (!items?.length) return c.json({ ok: false, error: 'Items kosong' }, 400)
    const subtotal = items.reduce((a: number, i: any) => a + i.price * i.qty, 0)
    const total = subtotal - discount
    const id = uid()
    const order_number = `FNB-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(Math.random()*9000)+1000}`
    const meta = table_id ? JSON.stringify({ table_id }) : '{}'
    await db.prepare("INSERT INTO tenant_orders(id,tenant_id,order_number,module,customer_id,cashier_id,subtotal,discount,total,payment_status,status,notes,meta) VALUES(?,?,?,'fnb',?,?,?,?,?,'unpaid','confirmed',?,?)").bind(id,tenantId,order_number,customer_id||null,cashierId,subtotal,discount,total,notes||null,meta).run()
    await Promise.all(items.map((item: any) => db.prepare("INSERT INTO tenant_order_items(id,tenant_id,order_id,product_id,name,qty,unit,price,discount,subtotal) VALUES(?,?,?,?,?,?,?,?,?,?)").bind(uid(),tenantId,id,item.product_id||null,item.name,item.qty,item.unit||'pcs',item.price,0,item.price*item.qty).run()))
    if (table_id) await db.prepare("UPDATE tenant_fnb_tables SET status='occupied',order_id=? WHERE id=? AND tenant_id=?").bind(id,table_id,tenantId).run()
    return c.json({ ok: true, id, order_number }, 201)
  }

  if (action === 'pay_order') {
    const { order_id, paid_amount, payment_method } = body
    const order = await db.prepare('SELECT * FROM tenant_orders WHERE id=? AND tenant_id=?').bind(order_id,tenantId).first<any>()
    if (!order) return c.json({ ok: false, error: 'Order tidak ditemukan' }, 404)
    if (paid_amount < order.total) return c.json({ ok: false, error: 'Bayar kurang' }, 400)
    const change = paid_amount - order.total
    await db.prepare("UPDATE tenant_orders SET status='done',payment_status='paid',payment_method=?,paid_amount=?,change_amount=?,updated_at=datetime('now') WHERE id=? AND tenant_id=?").bind(payment_method,paid_amount,change,order_id,tenantId).run()
    const meta = JSON.parse(order.meta || '{}')
    if (meta.table_id) await db.prepare("UPDATE tenant_fnb_tables SET status='available',order_id=NULL WHERE id=? AND tenant_id=?").bind(meta.table_id,tenantId).run()
    return c.json({ ok: true, change })
  }

  if (action === 'cancel_order') {
    const { order_id } = body
    const order = await db.prepare('SELECT * FROM tenant_orders WHERE id=? AND tenant_id=?').bind(order_id,tenantId).first<any>()
    if (!order) return c.json({ ok: false, error: 'Order tidak ditemukan' }, 404)
    await db.prepare("UPDATE tenant_orders SET status='cancelled',updated_at=datetime('now') WHERE id=? AND tenant_id=?").bind(order_id,tenantId).run()
    const meta = JSON.parse(order.meta || '{}')
    if (meta.table_id) await db.prepare("UPDATE tenant_fnb_tables SET status='available',order_id=NULL WHERE id=? AND tenant_id=?").bind(meta.table_id,tenantId).run()
    return c.json({ ok: true })
  }

  return c.json({ ok: false, error: 'Action tidak dikenal' }, 400)
})
