// backend/src/routes/cms-public.ts
import { Hono } from 'hono'
import type { Env } from '../index'

export const cmsPublicRoutes = new Hono<{ Bindings: Env }>()

// GET /api/cms/public - no auth, untuk landing page
cmsPublicRoutes.get('/', async (c) => {
  const { results } = await c.env.MASTER_DB
    .prepare('SELECT key, value FROM cms_content ORDER BY key')
    .all<{ key: string; value: string }>()

  const content: Record<string, string> = {}
  for (const r of results) content[r.key] = r.value

  return c.json({ ok: true, content })
})

// GET /api/cms/plans-public - plans untuk landing page
cmsPublicRoutes.get('/plans', async (c) => {
  const { results: plans } = await c.env.MASTER_DB
    .prepare('SELECT id, name, slug, description, price_monthly, price_yearly, features, modules, sort_order FROM plans WHERE is_active = 1 ORDER BY sort_order')
    .all()

  return c.json({
    ok: true,
    plans: plans.map((p: any) => ({
      ...p,
      features: JSON.parse(p.features || '[]'),
      modules: JSON.parse(p.modules || '[]'),
    }))
  })
})
