import { Hono } from 'hono'
import { uid } from '@nexasistem/db'
import { tenantAuth } from '../middleware/auth'
import type { Env } from '../index'
export const purchaseRoutes = new Hono<{ Bindings: Env }>()
purchaseRoutes.use('*', tenantAuth)
purchaseRoutes.get('/', async (c) => {
  const tenantId = c.get('tenantId')
  const {results} = await c.env.MASTER_DB.prepare("SELECT p.*,s.name as supplier_name FROM tenant_purchases p LEFT JOIN tenant_suppliers s ON p.supplier_id=s.id WHERE p.tenant_id=? ORDER BY p.created_at DESC LIMIT 50").bind(tenantId).all()
  return c.json({ ok: true, purchases: results })
})
purchaseRoutes.post('/', async (c) => {
  const tenantId = c.get('tenantId')
  const userId = c.get('userId')
  const {supplier_id,items,due_date,notes} = await c.req.json()
  const total = (items||[]).reduce((a:number,i:any) => a + (i.qty * i.cost_price), 0)
  const id = uid()
  const pn = `PO-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(Math.random()*9000)+1000}`
  await c.env.MASTER_DB.prepare("INSERT INTO tenant_purchases(id,tenant_id,purchase_number,supplier_id,total,due_date,notes,created_by) VALUES(?,?,?,?,?,?,?,?)").bind(id,tenantId,pn,supplier_id||null,total,due_date||null,notes||null,userId).run()
  for (const item of (items||[])) {
    await c.env.MASTER_DB.prepare("INSERT INTO tenant_purchase_items(id,tenant_id,purchase_id,product_id,name,qty,unit,cost_price,subtotal) VALUES(?,?,?,?,?,?,?,?,?)").bind(uid(),tenantId,id,item.product_id||null,item.name,item.qty,item.unit||'pcs',item.cost_price,item.qty*item.cost_price).run()
    if (item.product_id) await c.env.MASTER_DB.prepare("UPDATE tenant_products SET stock=stock+? WHERE id=? AND tenant_id=?").bind(item.qty,item.product_id,tenantId).run()
  }
  return c.json({ ok: true, id, purchase_number: pn }, 201)
})
