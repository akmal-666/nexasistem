// backend/src/routes/plans.ts
import { Hono } from 'hono'
import { uid } from '@nexasistem/db'
import { adminAuth } from '../middleware/auth'
import type { Env } from '../index'

export const planRoutes = new Hono<{ Bindings: Env }>()
planRoutes.use('*', adminAuth)

planRoutes.get('/', async (c) => {
  const { results: plans } = await c.env.MASTER_DB
    .prepare('SELECT * FROM plans WHERE is_active = 1 ORDER BY sort_order').all()
  return c.json({ ok: true, plans: plans.map((p: any) => ({ ...p, features: JSON.parse(p.features || '[]'), modules: JSON.parse(p.modules || '[]') })) })
})

planRoutes.post('/', async (c) => {
  const body = await c.req.json()
  const id = uid()
  await c.env.MASTER_DB.prepare(`
    INSERT INTO plans (id, name, slug, description, price_monthly, price_yearly, max_users, max_modules, max_branches, features, modules, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(id, body.name, body.slug, body.description || null, body.price_monthly || 0, body.price_yearly || 0,
    body.max_users || 5, body.max_modules || 1, body.max_branches || 1,
    JSON.stringify(body.features || []), JSON.stringify(body.modules || []), body.sort_order || 0).run()
  return c.json({ ok: true, id }, 201)
})

planRoutes.patch('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  await c.env.MASTER_DB.prepare(`
    UPDATE plans SET name=COALESCE(?,name), price_monthly=COALESCE(?,price_monthly),
    price_yearly=COALESCE(?,price_yearly), features=COALESCE(?,features),
    modules=COALESCE(?,modules), is_active=COALESCE(?,is_active) WHERE id=?
  `).bind(body.name, body.price_monthly, body.price_yearly,
    body.features ? JSON.stringify(body.features) : null,
    body.modules ? JSON.stringify(body.modules) : null,
    body.is_active, id).run()
  return c.json({ ok: true })
})
