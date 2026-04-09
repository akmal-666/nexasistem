// backend/src/routes/modules/salon.ts
import { Hono } from 'hono'
import { uid } from '@nexasistem/db'
import { tenantAuth } from '../../middleware/auth'
import type { Env } from '../../index'

export const salonRoutes = new Hono<{ Bindings: Env }>()
salonRoutes.use('*', tenantAuth)

salonRoutes.get('/', async (c) => {
  const tenantId = c.get('tenantId')
  const action = c.req.query('action') || 'bookings'
  const db = c.env.MASTER_DB

  if (action === 'bookings') {
    const date = c.req.query('date') || new Date().toISOString().slice(0,10)
    const { results: bookings } = await db.prepare("SELECT b.*,c.name as customer_name,c.phone as customer_phone,s.name as staff_name FROM tenant_salon_bookings b LEFT JOIN tenant_customers c ON b.customer_id=c.id LEFT JOIN tenant_salon_staff s ON b.staff_id=s.id WHERE b.tenant_id=? AND b.booking_date=? ORDER BY b.booking_time").bind(tenantId,date).all()
    const { results: staff } = await db.prepare('SELECT * FROM tenant_salon_staff WHERE tenant_id=? AND is_active=1').bind(tenantId).all()
    const { results: services } = await db.prepare("SELECT * FROM tenant_products WHERE tenant_id=? AND module='salon' AND is_active=1").bind(tenantId).all()
    return c.json({ ok: true, bookings, staff, services: services.map((s: any) => ({ ...s, meta: JSON.parse(s.meta||'{}') })) })
  }
  if (action === 'staff') {
    const { results: staff } = await db.prepare('SELECT * FROM tenant_salon_staff WHERE tenant_id=? ORDER BY name').bind(tenantId).all()
    return c.json({ ok: true, staff })
  }
  if (action === 'services') {
    const { results: services } = await db.prepare("SELECT p.*,c.name as category_name FROM tenant_products p LEFT JOIN tenant_categories c ON p.category_id=c.id WHERE p.tenant_id=? AND p.module='salon' AND p.is_active=1 ORDER BY p.name").bind(tenantId).all()
    return c.json({ ok: true, services: services.map((s: any) => ({ ...s, meta: JSON.parse(s.meta||'{}') })) })
  }
  return c.json({ ok: false, error: 'Action tidak dikenal' }, 400)
})

salonRoutes.post('/', async (c) => {
  const tenantId = c.get('tenantId')
  const cashierId = c.get('userId')
  const body = await c.req.json()
  const { action } = body
  const db = c.env.MASTER_DB

  if (action === 'add_booking') {
    const { customer_id, staff_id, booking_date, booking_time, duration_min=60, notes } = body
    const id = uid()
    await db.prepare("INSERT INTO tenant_salon_bookings(id,tenant_id,customer_id,staff_id,booking_date,booking_time,duration_min,status,notes) VALUES(?,?,?,?,?,?,?,'pending',?)").bind(id,tenantId,customer_id||null,staff_id||null,booking_date,booking_time,duration_min,notes||null).run()
    return c.json({ ok: true, id }, 201)
  }
  if (action === 'update_booking_status') {
    const { booking_id, status } = body
    await db.prepare("UPDATE tenant_salon_bookings SET status=?,updated_at=datetime('now') WHERE id=? AND tenant_id=?").bind(status,booking_id,tenantId).run()
    return c.json({ ok: true })
  }
  if (action === 'checkout') {
    const { booking_id, customer_id, items, paid_amount, payment_method } = body
    const subtotal = items.reduce((a: number, i: any) => a + i.price * i.qty, 0)
    const change = paid_amount - subtotal
    const id = uid()
    const order_number = `SLN-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(Math.random()*9000)+1000}`
    await db.prepare("INSERT INTO tenant_orders(id,tenant_id,order_number,module,customer_id,cashier_id,subtotal,discount,total,paid_amount,change_amount,payment_method,payment_status,status) VALUES(?,?,?,'salon',?,?,?,0,?,?,?,?,'paid','done')").bind(id,tenantId,order_number,customer_id||null,cashierId,subtotal,subtotal,paid_amount,change,payment_method).run()
    await Promise.all(items.map((item: any) => db.prepare("INSERT INTO tenant_order_items(id,tenant_id,order_id,product_id,name,qty,unit,price,discount,subtotal) VALUES(?,?,?,?,?,?,?,?,0,?)").bind(uid(),tenantId,id,item.product_id||null,item.name,item.qty,'layanan',item.price,item.price).run()))
    if (booking_id) await db.prepare("UPDATE tenant_salon_bookings SET status='done',order_id=?,updated_at=datetime('now') WHERE id=? AND tenant_id=?").bind(id,booking_id,tenantId).run()
    return c.json({ ok: true, id, order_number, change }, 201)
  }
  return c.json({ ok: false, error: 'Action tidak dikenal' }, 400)
})
