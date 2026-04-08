// backend/src/routes/tenant-auth.ts
import { Hono } from 'hono'
import { verifyPassword, hashPassword, signJwt, makeAuthCookie, clearAuthCookie, setSessionInKV, deleteSessionFromKV, generateSessionId } from '@nexasistem/auth'
import { uid } from '@nexasistem/db'
import { DEFAULT_PERMISSIONS } from '@nexasistem/shared'
import { tenantAuth } from '../middleware/auth'
import type { Env } from '../index'

export const tenantAuthRoutes = new Hono<{ Bindings: Env }>()

// POST /api/auth/login
tenantAuthRoutes.post('/login', async (c) => {
  try {
    const { slug, email, password } = await c.req.json()
    if (!slug || !email || !password) return c.json({ ok: false, error: 'Slug, email, dan password wajib diisi' }, 400)

    // Cek tenant
    const tenant = await c.env.MASTER_DB
      .prepare('SELECT * FROM tenants WHERE slug = ?')
      .bind(slug.toLowerCase().trim())
      .first<{ id: string; name: string; slug: string; status: string; business_type: string }>()

    if (!tenant) return c.json({ ok: false, error: 'Bisnis tidak ditemukan' }, 404)
    if (tenant.status === 'suspended') return c.json({ ok: false, error: 'Akun bisnis ditangguhkan. Hubungi admin.' }, 403)

    // Cek user di tenant DB (pakai tenant_id sebagai partition key)
    const user = await c.env.MASTER_DB
      .prepare('SELECT * FROM tenant_users WHERE tenant_id = ? AND email = ? AND is_active = 1')
      .bind(tenant.id, email.toLowerCase().trim())
      .first<{ id: string; name: string; email: string; password: string; role: string; permissions: string }>()

    if (!user) return c.json({ ok: false, error: 'Email atau password salah' }, 401)

    const valid = await verifyPassword(password, user.password)
    if (!valid) return c.json({ ok: false, error: 'Email atau password salah' }, 401)

    // Ambil modules aktif
    const modulesResult = await c.env.MASTER_DB
      .prepare('SELECT module FROM tenant_modules WHERE tenant_id = ? AND is_active = 1')
      .bind(tenant.id).all<{ module: string }>()
    const modules = modulesResult.results.map(m => m.module)

    // Ambil plan
    const plan = tenant.plan_id ? await c.env.MASTER_DB
      .prepare('SELECT name FROM plans WHERE id = ?')
      .bind(tenant.plan_id).first<{ name: string }>() : null

    const sessionData = {
      user: {
        id: user.id, name: user.name, email: user.email,
        role: user.role as 'owner',
        permissions: DEFAULT_PERMISSIONS[user.role as 'owner'] || [],
        tenantId: tenant.id, tenantSlug: tenant.slug, tenantName: tenant.name,
      },
      tenant: {
        id: tenant.id, slug: tenant.slug, name: tenant.name,
        status: tenant.status as 'active',
        modules: modules as 'fnb'[],
        plan_name: plan?.name,
      },
    }

    const token = await signJwt(
      { sub: user.id, tid: tenant.id, tslug: tenant.slug, role: user.role as 'owner', type: 'tenant' },
      c.env.JWT_SECRET
    )

    await setSessionInKV(c.env.SESSION_KV, `${user.id}:${tenant.id}`, sessionData)

    // Update last_login
    await c.env.MASTER_DB
      .prepare("UPDATE tenant_users SET last_login = datetime('now') WHERE id = ?")
      .bind(user.id).run()

    return c.json({ ok: true, ...sessionData, token }, 200, { 'Set-Cookie': makeAuthCookie(token) })
  } catch (err) {
    console.error('[tenant/login]', err)
    return c.json({ ok: false, error: 'Server error' }, 500)
  }
})

// GET /api/auth/me
tenantAuthRoutes.get('/me', tenantAuth, async (c) => {
  const session = c.get('session')
  return c.json({ ok: true, ...session })
})

// POST /api/auth/logout
tenantAuthRoutes.post('/logout', tenantAuth, async (c) => {
  const userId = c.get('userId')
  const tenantId = c.get('tenantId')
  await deleteSessionFromKV(c.env.SESSION_KV, `${userId}:${tenantId}`)
  return c.json({ ok: true }, 200, { 'Set-Cookie': clearAuthCookie() })
})
