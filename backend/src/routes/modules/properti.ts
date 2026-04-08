// backend/src/routes/modules/properti.ts
import { Hono } from 'hono'
import { uid } from '@nexasistem/db'
import { tenantAuth } from '../../middleware/auth'
import type { Env } from '../../index'

export const propertiRoutes = new Hono<{ Bindings: Env }>()
propertiRoutes.use('*', tenantAuth)

propertiRoutes.get('/', async (c) => {
  const tenantId = c.get('tenantId')
  const action = c.req.query('action') || 'units'
  const db = c.env.MASTER_DB

  if (action === 'units') {
    const status = c.req.query('status') || ''
    let query = "SELECT u.*, pt.customer_id, c.name as tenant_name, c.phone as tenant_phone FROM tenant_properti_units u LEFT JOIN tenant_properti_tenants pt ON u.id=pt.unit_id AND pt.status='active' LEFT JOIN tenant_customers c ON pt.customer_id=c.id WHERE u.tenant_id=?"
    const params: unknown[] = [tenantId]
    if (status) { query += ' AND u.status=?'; params.push(status) }
    const { results: units } = await db.prepare(query + ' ORDER BY u.name').bind(...params).all()
    const summary = await db.prepare("SELECT COUNT(*) as total, COUNT(CASE WHEN status='occupied' THEN 1 END) as occupied, COUNT(CASE WHEN status='available' THEN 1 END) as available FROM tenant_properti_units WHERE tenant_id=?").bind(tenantId).first()
    return c.json({ ok: true, units: units.map((u: any) => ({ ...u, facilities: JSON.parse(u.facilities||'[]') })), summary })
  }
  if (action === 'billings') {
    const month = c.req.query('month') || new Date().toISOString().slice(0,7)
    const { results: billings } = await db.prepare("SELECT b.*,u.name as unit_name,c.name as tenant_name,c.phone as tenant_phone FROM tenant_properti_billings b JOIN tenant_properti_units u ON b.unit_id=u.id LEFT JOIN tenant_properti_tenants pt ON b.tenant_rel_id=pt.id LEFT JOIN tenant_customers c ON pt.customer_id=c.id WHERE b.tenant_id=? AND b.billing_month=? ORDER BY u.name").bind(tenantId,month).all()
    return c.json({ ok: true, billings })
  }
  return c.json({ ok: false, error: 'Action tidak dikenal' }, 400)
})

propertiRoutes.post('/', async (c) => {
  const tenantId = c.get('tenantId')
  const body = await c.req.json()
  const { action } = body
  const db = c.env.MASTER_DB

  if (action === 'add_unit') {
    const { name, type='kos', floor, size_m2, price, deposit=0, facilities=[] } = body
    const id = uid()
    await db.prepare("INSERT INTO tenant_properti_units(id,tenant_id,name,type,floor,size_m2,price,deposit,facilities,status) VALUES(?,?,?,?,?,?,?,?,?,'available')").bind(id,tenantId,name,type,floor||null,size_m2||null,price,deposit,JSON.stringify(facilities)).run()
    return c.json({ ok: true, id }, 201)
  }
  if (action === 'add_tenancy') {
    const { unit_id, customer_id, start_date, end_date, monthly_rate, deposit_paid=0 } = body
    const tenancyId = uid()
    await db.prepare("INSERT INTO tenant_properti_tenants(id,tenant_id,unit_id,customer_id,start_date,end_date,monthly_rate,deposit_paid,status) VALUES(?,?,?,?,?,?,?,?,'active')").bind(tenancyId,tenantId,unit_id,customer_id,start_date,end_date||null,monthly_rate,deposit_paid).run()
    await db.prepare("UPDATE tenant_properti_units SET status='occupied' WHERE id=? AND tenant_id=?").bind(unit_id,tenantId).run()
    return c.json({ ok: true, id: tenancyId }, 201)
  }
  if (action === 'pay_billing') {
    const { billing_id, paid_amount, payment_method } = body
    const billing = await db.prepare('SELECT * FROM tenant_properti_billings WHERE id=? AND tenant_id=?').bind(billing_id,tenantId).first<any>()
    if (!billing) return c.json({ ok: false, error: 'Tagihan tidak ditemukan' }, 404)
    await db.prepare("UPDATE tenant_properti_billings SET status='paid',paid_at=datetime('now'),payment_method=? WHERE id=? AND tenant_id=?").bind(payment_method,billing_id,tenantId).run()
    return c.json({ ok: true })
  }
  if (action === 'generate_billing') {
    const { unit_id, billing_month, due_date } = body
    const tenancy = await db.prepare("SELECT * FROM tenant_properti_tenants WHERE unit_id=? AND tenant_id=? AND status='active'").bind(unit_id,tenantId).first<any>()
    if (!tenancy) return c.json({ ok: false, error: 'Tidak ada penyewa aktif' }, 404)
    const id = uid()
    await db.prepare("INSERT INTO tenant_properti_billings(id,tenant_id,unit_id,tenant_rel_id,billing_month,total,status,due_date) VALUES(?,?,?,?,?,?,'unpaid',?)").bind(id,tenantId,unit_id,tenancy.id,billing_month,tenancy.monthly_rate,due_date).run()
    return c.json({ ok: true, id }, 201)
  }
  return c.json({ ok: false, error: 'Action tidak dikenal' }, 400)
})
