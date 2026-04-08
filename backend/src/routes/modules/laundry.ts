// backend/src/routes/modules/laundry.ts
import { Hono } from 'hono'
import { uid } from '@nexasistem/db'
import { tenantAuth } from '../../middleware/auth'
import type { Env } from '../../index'

export const laundryRoutes = new Hono<{ Bindings: Env }>()
laundryRoutes.use('*', tenantAuth)

const LAUNDRY_STATUSES = ['received','washing','drying','ironing','folding','ready','delivered']

laundryRoutes.get('/', async (c) => {
  const tenantId = c.get('tenantId')
  const action = c.req.query('action') || 'orders'
  const db = c.env.MASTER_DB

  if (action === 'orders') {
    const status = c.req.query('status') || ''
    const date = c.req.query('date') || ''
    let query = "SELECT lo.*, o.order_number, o.total, o.payment_status, c.name as customer_name, c.phone as customer_phone FROM tenant_laundry_orders lo JOIN tenant_orders o ON lo.order_id=o.id LEFT JOIN tenant_customers c ON lo.customer_id=c.id WHERE lo.tenant_id=?"
    const params: unknown[] = [tenantId]
    if (status) { query += ' AND lo.status=?'; params.push(status) }
    if (date) { query += ' AND date(lo.created_at)=?'; params.push(date) }
    const { results: orders } = await db.prepare(query + ' ORDER BY lo.created_at DESC').bind(...params).all()
    return c.json({ ok: true, orders })
  }
  if (action === 'stats') {
    const today = new Date().toISOString().slice(0,10)
    const stats = await db.prepare("SELECT COUNT(*) as total, COUNT(CASE WHEN status='ready' THEN 1 END) as ready, COUNT(CASE WHEN status='delivered' THEN 1 END) as delivered FROM tenant_laundry_orders WHERE tenant_id=? AND date(created_at)=?").bind(tenantId,today).first()
    return c.json({ ok: true, stats })
  }
  return c.json({ ok: false, error: 'Action tidak dikenal' }, 400)
})

laundryRoutes.post('/', async (c) => {
  const tenantId = c.get('tenantId')
  const cashierId = c.get('userId')
  const body = await c.req.json()
  const { action } = body
  const db = c.env.MASTER_DB

  if (action === 'create_order') {
    const { customer_id, items, weight_kg, estimated_done, notes, special_care, discount=0 } = body
    if (!items?.length) return c.json({ ok: false, error: 'Items kosong' }, 400)
    const subtotal = items.reduce((a: number, i: any) => a + i.price * i.qty, 0)
    const total = subtotal - discount
    const orderId = uid()
    const order_number = `LDR-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(Math.random()*9000)+1000}`
    await db.prepare("INSERT INTO tenant_orders(id,tenant_id,order_number,module,customer_id,cashier_id,subtotal,discount,total,payment_status,status) VALUES(?,?,?,'laundry',?,?,?,?,?,'unpaid','confirmed')").bind(orderId,tenantId,order_number,customer_id||null,cashierId,subtotal,discount,total).run()
    await Promise.all(items.map((item: any) => db.prepare("INSERT INTO tenant_order_items(id,tenant_id,order_id,product_id,name,qty,unit,price,discount,subtotal) VALUES(?,?,?,?,?,?,?,?,0,?)").bind(uid(),tenantId,orderId,item.product_id||null,item.name,item.qty,item.unit||'kg',item.price,item.price*item.qty).run()))
    const laundryId = uid()
    await db.prepare("INSERT INTO tenant_laundry_orders(id,tenant_id,order_id,customer_id,items_count,weight_kg,status,estimated_done,notes,special_care) VALUES(?,?,?,?,?,?,'received',?,?,?)").bind(laundryId,tenantId,orderId,customer_id||null,items.length,weight_kg||null,estimated_done||null,notes||null,special_care||null).run()
    return c.json({ ok: true, id: laundryId, order_id: orderId, order_number }, 201)
  }

  if (action === 'update_status') {
    const { laundry_id, status } = body
    if (!LAUNDRY_STATUSES.includes(status)) return c.json({ ok: false, error: 'Status tidak valid' }, 400)
    const extra = status === 'delivered' ? ", actual_done=datetime('now')" : ''
    await db.prepare(`UPDATE tenant_laundry_orders SET status=?, updated_at=datetime('now')${extra} WHERE id=? AND tenant_id=?`).bind(status,laundry_id,tenantId).run()
    return c.json({ ok: true })
  }

  if (action === 'pay') {
    const { order_id, paid_amount, payment_method } = body
    const order = await db.prepare('SELECT * FROM tenant_orders WHERE id=? AND tenant_id=?').bind(order_id,tenantId).first<any>()
    if (!order) return c.json({ ok: false, error: 'Order tidak ditemukan' }, 404)
    const change = paid_amount - order.total
    await db.prepare("UPDATE tenant_orders SET status='done',payment_status='paid',payment_method=?,paid_amount=?,change_amount=?,updated_at=datetime('now') WHERE id=? AND tenant_id=?").bind(payment_method,paid_amount,change,order_id,tenantId).run()
    return c.json({ ok: true, change })
  }
  return c.json({ ok: false, error: 'Action tidak dikenal' }, 400)
})
