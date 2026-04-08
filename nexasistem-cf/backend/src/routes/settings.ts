import { Hono } from 'hono'
import { tenantAuth } from '../middleware/auth'
import type { Env } from '../index'
export const settingsRoutes = new Hono<{ Bindings: Env }>()
settingsRoutes.use('*', tenantAuth)
settingsRoutes.get('/profil', async (c) => {
  const tenantId = c.get('tenantId')
  const {results} = await c.env.MASTER_DB.prepare('SELECT key,value FROM tenant_settings WHERE tenant_id=?').bind(tenantId).all<{key:string;value:string}>()
  const profil: Record<string,string> = {}
  for (const r of results) profil[r.key] = r.value
  return c.json({ ok: true, profil })
})
settingsRoutes.post('/profil', async (c) => {
  const tenantId = c.get('tenantId')
  const body = await c.req.json()
  await Promise.all(Object.entries(body).map(([key,value]) =>
    typeof value === 'string' ? c.env.MASTER_DB.prepare("INSERT INTO tenant_settings(id,tenant_id,key,value) VALUES(lower(hex(randomblob(8))),?,?,?) ON CONFLICT(tenant_id,key) DO UPDATE SET value=excluded.value,updated_at=datetime('now')").bind(tenantId,key,value).run() : Promise.resolve()
  ))
  return c.json({ ok: true })
})
settingsRoutes.get('/branches', async (c) => {
  const tenantId = c.get('tenantId')
  const {results} = await c.env.MASTER_DB.prepare('SELECT * FROM tenant_branches WHERE tenant_id=? AND is_active=1 ORDER BY is_default DESC,name').bind(tenantId).all()
  return c.json({ ok: true, branches: results })
})
settingsRoutes.post('/branches', async (c) => {
  const tenantId = c.get('tenantId')
  const {name,code,address,city,phone} = await c.req.json()
  const {uid} = await import('@nexasistem/db')
  const id = uid()
  await c.env.MASTER_DB.prepare("INSERT INTO tenant_branches(id,tenant_id,name,code,address,city,phone) VALUES(?,?,?,?,?,?,?)").bind(id,tenantId,name,code,address||null,city||null,phone||null).run()
  return c.json({ ok: true, id }, 201)
})
