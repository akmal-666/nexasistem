import { Hono } from 'hono'
import { uid } from '@nexasistem/db'
import { tenantAuth } from '../middleware/auth'
import type { Env } from '../index'
export const categoryRoutes = new Hono<{ Bindings: Env }>()
categoryRoutes.use('*', tenantAuth)
categoryRoutes.get('/', async (c) => {
  const tenantId = c.get('tenantId')
  const module = c.req.query('module') || ''
  let where = 'tenant_id = ?'; const params: unknown[] = [tenantId]
  if (module) { where += ' AND module = ?'; params.push(module) }
  const {results} = await c.env.MASTER_DB.prepare(`SELECT * FROM tenant_categories WHERE ${where} ORDER BY module, sort_order, name`).bind(...params).all()
  return c.json({ ok: true, categories: results })
})
categoryRoutes.post('/', async (c) => {
  const tenantId = c.get('tenantId')
  const { name, module, sort_order } = await c.req.json()
  if (!name||!module) return c.json({ ok: false, error: 'Nama dan modul wajib' }, 400)
  const id = uid()
  const slug = name.toLowerCase().replace(/[^a-z0-9]/g,'-').replace(/-+/g,'-')
  await c.env.MASTER_DB.prepare("INSERT INTO tenant_categories(id,tenant_id,name,slug,module,sort_order) VALUES(?,?,?,?,?,?)").bind(id,tenantId,name,slug,module,sort_order||0).run()
  return c.json({ ok: true, id }, 201)
})
categoryRoutes.delete('/:id', async (c) => {
  const tenantId = c.get('tenantId')
  const id = c.req.param('id')
  const inUse = await c.env.MASTER_DB.prepare('SELECT COUNT(*) as n FROM tenant_products WHERE category_id=? AND tenant_id=?').bind(id,tenantId).first<{n:number}>()
  if ((inUse?.n??0) > 0) return c.json({ ok: false, error: `Kategori masih digunakan ${inUse?.n} produk` }, 409)
  await c.env.MASTER_DB.prepare('DELETE FROM tenant_categories WHERE id=? AND tenant_id=?').bind(id,tenantId).run()
  return c.json({ ok: true })
})
