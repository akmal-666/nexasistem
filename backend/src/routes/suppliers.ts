import { Hono } from 'hono'
import { uid } from '@nexasistem/db'
import { tenantAuth } from '../middleware/auth'
import type { Env } from '../index'
export const supplierRoutes = new Hono<{ Bindings: Env }>()
supplierRoutes.use('*', tenantAuth)
supplierRoutes.get('/', async (c) => {
  const tenantId = c.get('tenantId')
  const {results} = await c.env.MASTER_DB.prepare('SELECT * FROM tenant_suppliers WHERE tenant_id=? AND is_active=1 ORDER BY name').bind(tenantId).all()
  return c.json({ ok: true, suppliers: results })
})
supplierRoutes.post('/', async (c) => {
  const tenantId = c.get('tenantId')
  const {name,phone,email,address} = await c.req.json()
  const id = uid()
  await c.env.MASTER_DB.prepare("INSERT INTO tenant_suppliers(id,tenant_id,name,phone,email,address) VALUES(?,?,?,?,?,?)").bind(id,tenantId,name,phone||null,email||null,address||null).run()
  return c.json({ ok: true, id }, 201)
})
