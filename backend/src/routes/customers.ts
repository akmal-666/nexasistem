import { Hono } from 'hono'
import { uid, paginate } from '@nexasistem/db'
import { tenantAuth } from '../middleware/auth'
import type { Env } from '../index'
export const customerRoutes = new Hono<{ Bindings: Env }>()
customerRoutes.use('*', tenantAuth)
customerRoutes.get('/', async (c) => {
  const tenantId = c.get('tenantId')
  const q = c.req.query('q') || ''
  const limit = parseInt(c.req.query('limit') || '20')
  const page = parseInt(c.req.query('page') || '1')
  const { limit: lim, offset } = paginate(page, limit)
  let where = 'tenant_id = ?'; const params: unknown[] = [tenantId]
  if (q) { where += ' AND (name LIKE ? OR phone LIKE ? OR email LIKE ?)'; params.push(`%${q}%`,`%${q}%`,`%${q}%`) }
  const total = await c.env.MASTER_DB.prepare(`SELECT COUNT(*) as n FROM tenant_customers WHERE ${where}`).bind(...params).first<{n:number}>()
  const {results} = await c.env.MASTER_DB.prepare(`SELECT * FROM tenant_customers WHERE ${where} ORDER BY name LIMIT ? OFFSET ?`).bind(...params,lim,offset).all()
  return c.json({ ok: true, customers: results, total: total?.n??0 })
})
customerRoutes.post('/', async (c) => {
  const tenantId = c.get('tenantId')
  const body = await c.req.json()
  const id = uid()
  await c.env.MASTER_DB.prepare("INSERT INTO tenant_customers(id,tenant_id,name,email,phone,address,city,notes) VALUES(?,?,?,?,?,?,?,?)").bind(id,tenantId,body.name,body.email||null,body.phone||null,body.address||null,body.city||null,body.notes||null).run()
  return c.json({ ok: true, id }, 201)
})
customerRoutes.patch('/:id', async (c) => {
  const tenantId = c.get('tenantId')
  const id = c.req.param('id')
  const body = await c.req.json()
  await c.env.MASTER_DB.prepare("UPDATE tenant_customers SET name=COALESCE(?,name),phone=COALESCE(?,phone),email=COALESCE(?,email),city=COALESCE(?,city),address=COALESCE(?,address),notes=COALESCE(?,notes),updated_at=datetime('now') WHERE id=? AND tenant_id=?").bind(body.name,body.phone,body.email,body.city,body.address,body.notes,id,tenantId).run()
  return c.json({ ok: true })
})
