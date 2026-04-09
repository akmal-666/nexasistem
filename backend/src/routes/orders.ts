import { Hono } from 'hono'
import { uid } from '@nexasistem/db'
import { tenantAuth } from '../middleware/auth'
import type { Env } from '../index'
export const orderRoutes = new Hono<{ Bindings: Env }>()
orderRoutes.use('*', tenantAuth)

function genOrderNumber(module: string): string {
  const prefix = { fnb:'FNB', retail:'RTL', klinik:'KLN', laundry:'LDR', apotek:'APT', salon:'SLN', properti:'PRP' }[module] || 'TRX'
  const date = new Date().toISOString().slice(0,10).replace(/-/g,'')
  const seq = String(Math.floor(Math.random()*9000)+1000)
  return `${prefix}-${date}-${seq}`
}

orderRoutes.get('/', async (c) => {
  const tenantId = c.get('tenantId')
  const module = c.req.query('module') || ''
  const status = c.req.query('status') || ''
  const from = c.req.query('from') || ''
  const to = c.req.query('to') || ''
  let where = 'o.tenant_id = ?'; const params: unknown[] = [tenantId]
  if (module) { where += ' AND o.module = ?'; params.push(module) }
  if (status) { where += ' AND o.status = ?'; params.push(status) }
  if (from) { where += ' AND date(o.created_at) >= ?'; params.push(from) }
  if (to) { where += ' AND date(o.created_at) <= ?'; params.push(to) }
  const {results} = await c.env.MASTER_DB.prepare(`SELECT o.*, c.name as customer_name FROM tenant_orders o LEFT JOIN tenant_customers c ON o.customer_id=c.id WHERE ${where} ORDER BY o.created_at DESC LIMIT 50`).bind(...params).all()
  return c.json({ ok: true, orders: results.map((o:any) => ({...o, meta: JSON.parse(o.meta||'{}')})) })
})

orderRoutes.post('/', async (c) => {
  const tenantId = c.get('tenantId')
  const cashierId = c.get('userId')
  const body = await c.req.json()
  const { module, items, customer_id, discount=0, tax=0, payment_method, paid_amount, meta={} } = body
  if (!module||!items?.length) return c.json({ ok: false, error: 'Modul dan items wajib' }, 400)
  const subtotal = items.reduce((a:number, i:any) => a + i.subtotal, 0)
  const total = subtotal - discount + tax
  const change = Math.max(0, (paid_amount||0) - total)
  const id = uid()
  const order_number = genOrderNumber(module)
  await c.env.MASTER_DB.prepare("INSERT INTO tenant_orders(id,tenant_id,order_number,module,customer_id,cashier_id,subtotal,discount,tax,total,paid_amount,change_amount,payment_method,payment_status,status,meta) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").bind(id,tenantId,order_number,module,customer_id||null,cashierId,subtotal,discount,tax,total,paid_amount||0,change,payment_method||null,(paid_amount>=total?'paid':'unpaid'),'done',JSON.stringify(meta)).run()
  await Promise.all(items.map((item:any) => c.env.MASTER_DB.prepare("INSERT INTO tenant_order_items(id,tenant_id,order_id,product_id,name,qty,unit,price,discount,subtotal) VALUES(?,?,?,?,?,?,?,?,?,?)").bind(uid(),tenantId,id,item.product_id||null,item.name,item.qty,item.unit||'pcs',item.price,item.discount||0,item.subtotal).run()))
  // Update stok
  for (const item of items) {
    if (item.product_id) {
      await c.env.MASTER_DB.prepare("UPDATE tenant_products SET stock=stock-? WHERE id=? AND tenant_id=?").bind(item.qty,item.product_id,tenantId).run()
    }
  }
  return c.json({ ok: true, id, order_number, change }, 201)
})
