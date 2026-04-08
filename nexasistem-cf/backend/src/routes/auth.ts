// backend/src/routes/auth.ts
import { Hono } from 'hono'
import { verifyPassword, signJwt, makeAuthCookie, clearAuthCookie, generateSessionId, setSessionInKV, deleteSessionFromKV } from '@nexasistem/auth'
import { adminAuth } from '../middleware/auth'
import type { Env } from '../index'

export const authRoutes = new Hono<{ Bindings: Env }>()

// POST /api/admin/auth/login
authRoutes.post('/login', async (c) => {
  try {
    const { email, password } = await c.req.json()
    if (!email || !password) return c.json({ ok: false, error: 'Email dan password wajib diisi' }, 400)

    const admin = await c.env.MASTER_DB
      .prepare('SELECT * FROM admins WHERE email = ? AND is_active = 1')
      .bind(email.toLowerCase().trim())
      .first<{ id: string; name: string; email: string; password: string; role: string }>()

    if (!admin) return c.json({ ok: false, error: 'Email atau password salah' }, 401)

    const valid = await verifyPassword(password, admin.password)
    if (!valid) return c.json({ ok: false, error: 'Email atau password salah' }, 401)

    // Update last_login
    await c.env.MASTER_DB
      .prepare("UPDATE admins SET last_login = datetime('now') WHERE id = ?")
      .bind(admin.id).run()

    const sessionId = generateSessionId()
    const token = await signJwt(
      { sub: admin.id, tid: 'admin', tslug: 'admin', role: admin.role as 'superadmin', type: 'admin' },
      c.env.JWT_SECRET
    )

    const adminSession = { admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role } }
    await setSessionInKV(c.env.SESSION_KV, `admin:${admin.id}`, adminSession)

    return c.json(
      { ok: true, admin: adminSession.admin, token },
      200,
      { 'Set-Cookie': makeAuthCookie(token) }
    )
  } catch (err) {
    console.error('[admin/login]', err)
    return c.json({ ok: false, error: 'Server error' }, 500)
  }
})

// GET /api/admin/auth/me
authRoutes.get('/me', adminAuth, async (c) => {
  const session = c.get('adminSession')
  return c.json({ ok: true, admin: session.admin })
})

// POST /api/admin/auth/logout
authRoutes.post('/logout', adminAuth, async (c) => {
  const adminId = c.get('adminId')
  await deleteSessionFromKV(c.env.SESSION_KV, `admin:${adminId}`)
  return c.json({ ok: true }, 200, { 'Set-Cookie': clearAuthCookie() })
})
