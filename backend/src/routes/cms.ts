import { Hono } from 'hono'
import { adminAuth } from '../middleware/auth'
import type { Env } from '../index'
export const cmsRoutes = new Hono<{ Bindings: Env }>()
cmsRoutes.use('*', adminAuth)
cmsRoutes.get('/', async (c) => {
  const {results} = await c.env.MASTER_DB.prepare('SELECT * FROM cms_content ORDER BY key').all()
  const content: Record<string,string> = {}
  for (const r of results as any[]) content[r.key] = r.value
  return c.json({ ok: true, content })
})
cmsRoutes.post('/', async (c) => {
  const body = await c.req.json()
  await Promise.all(Object.entries(body).map(([key, value]) =>
    c.env.MASTER_DB.prepare("INSERT INTO cms_content(id,key,value,updated_at) VALUES(lower(hex(randomblob(8))),?,?,datetime('now')) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at").bind(key, value).run()
  ))
  return c.json({ ok: true })
})
