// backend/src/routes/modules/klinik.ts
import { Hono } from 'hono'
import { uid } from '@nexasistem/db'
import { tenantAuth } from '../../middleware/auth'
import type { Env } from '../../index'

export const klinikRoutes = new Hono<{ Bindings: Env }>()
klinikRoutes.use('*', tenantAuth)

klinikRoutes.get('/', async (c) => {
  const tenantId = c.get('tenantId')
  const action = c.req.query('action') || 'queues'
  const db = c.env.MASTER_DB

  if (action === 'queues') {
    const date = c.req.query('date') || new Date().toISOString().slice(0,10)
    const { results: queues } = await db.prepare("SELECT q.*,c.name as customer_name,c.phone as customer_phone,d.name as doctor_name FROM tenant_klinik_queues q LEFT JOIN tenant_customers c ON q.customer_id=c.id LEFT JOIN tenant_klinik_doctors d ON q.doctor_id=d.id WHERE q.tenant_id=? AND q.visit_date=? ORDER BY q.queue_number").bind(tenantId,date).all()
    return c.json({ ok: true, queues })
  }
  if (action === 'doctors') {
    const { results: doctors } = await db.prepare('SELECT * FROM tenant_klinik_doctors WHERE tenant_id=? AND is_active=1 ORDER BY name').bind(tenantId).all()
    return c.json({ ok: true, doctors })
  }
  if (action === 'services') {
    const { results: services } = await db.prepare("SELECT p.*,c.name as category_name FROM tenant_products p LEFT JOIN tenant_categories c ON p.category_id=c.id WHERE p.tenant_id=? AND p.module='klinik' AND p.is_active=1 ORDER BY p.name").bind(tenantId).all()
    return c.json({ ok: true, services })
  }
  if (action === 'stats_today') {
    const today = new Date().toISOString().slice(0,10)
    const stats = await db.prepare("SELECT COUNT(*) as totalQueues, COUNT(CASE WHEN status='done' THEN 1 END) as doneQueues, COUNT(CASE WHEN status='waiting' THEN 1 END) as waitingQueues FROM tenant_klinik_queues WHERE tenant_id=? AND visit_date=?").bind(tenantId,today).first()
    const revenue = await db.prepare("SELECT COALESCE(SUM(total),0) as revenue FROM tenant_orders WHERE tenant_id=? AND module='klinik' AND payment_status='paid' AND date(created_at)=?").bind(tenantId,today).first<{revenue:number}>()
    return c.json({ ok: true, ...stats, revenue: revenue?.revenue ?? 0 })
  }
  if (action === 'emr') {
    const customer_id = c.req.query('customer_id')
    if (!customer_id) return c.json({ ok: false, error: 'customer_id wajib' }, 400)
    const { results: emrs } = await db.prepare("SELECT e.*,d.name as doctor_name FROM tenant_klinik_emr e LEFT JOIN tenant_klinik_doctors d ON e.doctor_id=d.id WHERE e.tenant_id=? AND e.customer_id=? ORDER BY e.visit_date DESC LIMIT 20").bind(tenantId,customer_id).all()
    return c.json({ ok: true, emrs: emrs.map((e: any) => ({ ...e, icd10_codes: JSON.parse(e.icd10_codes||'[]'), vital_signs: JSON.parse(e.vital_signs||'{}') })) })
  }
  return c.json({ ok: false, error: 'Action tidak dikenal' }, 400)
})

klinikRoutes.post('/', async (c) => {
  const tenantId = c.get('tenantId')
  const cashierId = c.get('userId')
  const body = await c.req.json()
  const { action } = body
  const db = c.env.MASTER_DB

  if (action === 'add_queue') {
    const { customer_id, doctor_id, complaint } = body
    const today = new Date().toISOString().slice(0,10)
    const last = await db.prepare('SELECT MAX(queue_number) as n FROM tenant_klinik_queues WHERE tenant_id=? AND visit_date=?').bind(tenantId,today).first<{n:number}>()
    const queue_number = (last?.n ?? 0) + 1
    const id = uid()
    await db.prepare("INSERT INTO tenant_klinik_queues(id,tenant_id,customer_id,doctor_id,queue_number,status,complaint,visit_date) VALUES(?,?,?,?,?,'waiting',?,?)").bind(id,tenantId,customer_id||null,doctor_id||null,queue_number,complaint||null,today).run()
    return c.json({ ok: true, id, queue_number }, 201)
  }

  if (action === 'update_queue') {
    const { queue_id, status } = body
    const extra = status === 'called' ? ", called_at=datetime('now')" : status === 'done' ? ", done_at=datetime('now')" : ''
    await db.prepare(`UPDATE tenant_klinik_queues SET status=?${extra} WHERE id=? AND tenant_id=?`).bind(status,queue_id,tenantId).run()
    return c.json({ ok: true })
  }

  if (action === 'save_emr') {
    const { customer_id, doctor_id, queue_id, subjective, objective, assessment, plan, icd10_codes=[], vital_signs={}, notes } = body
    const id = uid()
    await db.prepare("INSERT INTO tenant_klinik_emr(id,tenant_id,customer_id,doctor_id,queue_id,subjective,objective,assessment,plan,icd10_codes,vital_signs,notes) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)").bind(id,tenantId,customer_id,doctor_id||null,queue_id||null,subjective||null,objective||null,assessment||null,plan||null,JSON.stringify(icd10_codes),JSON.stringify(vital_signs),notes||null).run()
    if (queue_id) await db.prepare("UPDATE tenant_klinik_queues SET status='in_progress' WHERE id=? AND tenant_id=?").bind(queue_id,tenantId).run()
    return c.json({ ok: true, id }, 201)
  }

  if (action === 'kasir') {
    const { customer_id, items, discount=0, paid_amount, payment_method, queue_id } = body
    const subtotal = items.reduce((a: number, i: any) => a + i.price * i.qty, 0)
    const total = subtotal - discount
    const change = paid_amount - total
    const id = uid()
    const order_number = `KLN-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(Math.random()*9000)+1000}`
    await db.prepare("INSERT INTO tenant_orders(id,tenant_id,order_number,module,customer_id,cashier_id,subtotal,discount,total,paid_amount,change_amount,payment_method,payment_status,status) VALUES(?,?,?,'klinik',?,?,?,?,?,?,?,?,'paid','done')").bind(id,tenantId,order_number,customer_id||null,cashierId,subtotal,discount,total,paid_amount,change,payment_method).run()
    await Promise.all(items.map((item: any) => db.prepare("INSERT INTO tenant_order_items(id,tenant_id,order_id,product_id,name,qty,unit,price,discount,subtotal) VALUES(?,?,?,?,?,?,?,?,0,?)").bind(uid(),tenantId,id,item.product_id||null,item.name,item.qty,'layanan',item.price,item.subtotal).run()))
    if (queue_id) await db.prepare("UPDATE tenant_klinik_queues SET status='done',done_at=datetime('now') WHERE id=? AND tenant_id=?").bind(queue_id,tenantId).run()
    return c.json({ ok: true, id, order_number, change }, 201)
  }

  if (action === 'add_doctor') {
    const { name, specialization='Umum', sip_number } = body
    const id = uid()
    await db.prepare("INSERT INTO tenant_klinik_doctors(id,tenant_id,name,specialization,sip_number) VALUES(?,?,?,?,?)").bind(id,tenantId,name,specialization,sip_number||null).run()
    return c.json({ ok: true, id }, 201)
  }

  return c.json({ ok: false, error: 'Action tidak dikenal' }, 400)
})
