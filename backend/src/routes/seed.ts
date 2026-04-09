// backend/src/routes/seed.ts
import { Hono } from 'hono'
import { hashPassword } from '@nexasistem/auth'
import type { Env } from '../index'

export const seedRoutes = new Hono<{ Bindings: Env }>()

// POST /api/_seed/admin - buat admin pertama
seedRoutes.post('/admin', async (c) => {
  try {
    const body = await c.req.json()
    const { name, email, password, seed_secret } = body

    const SEED_SECRET = (c.env as any).SEED_SECRET
    if (!SEED_SECRET || seed_secret !== SEED_SECRET) {
      return c.json({ ok: false, error: 'Seed secret tidak valid' }, 403)
    }

    const existing = await c.env.MASTER_DB
      .prepare('SELECT COUNT(*) as n FROM admins WHERE is_active = 1')
      .first<{ n: number }>()

    if ((existing?.n ?? 0) > 0) {
      return c.json({ ok: false, error: 'Admin sudah ada. Gunakan endpoint /reset-password.' }, 409)
    }

    if (!name || !email || !password) {
      return c.json({ ok: false, error: 'name, email, password wajib diisi' }, 400)
    }

    const hashed = await hashPassword(password)
    const id = crypto.randomUUID()

    await c.env.MASTER_DB.prepare(`
      INSERT INTO admins (id, name, email, password, role)
      VALUES (?, ?, ?, ?, 'superadmin')
    `).bind(id, name, email.toLowerCase(), hashed).run()

    return c.json({ ok: true, message: 'Admin berhasil dibuat', id }, 201)
  } catch (err) {
    return c.json({ ok: false, error: String(err) }, 500)
  }
})

// GET /api/_seed/reset-password?email=X&password=Y&secret=Z
// Reset password admin tanpa terminal - langsung via browser URL
seedRoutes.get('/reset-password', async (c) => {
  try {
    const email = c.req.query('email')
    const password = c.req.query('password')
    const secret = c.req.query('secret')

    const SEED_SECRET = (c.env as any).SEED_SECRET
    if (!SEED_SECRET || secret !== SEED_SECRET) {
      return c.json({ ok: false, error: 'Secret tidak valid' }, 403)
    }

    if (!email || !password) {
      return c.json({ ok: false, error: 'email dan password wajib' }, 400)
    }

    if (password.length < 6) {
      return c.json({ ok: false, error: 'Password minimal 6 karakter' }, 400)
    }

    const admin = await c.env.MASTER_DB
      .prepare('SELECT id FROM admins WHERE email = ?')
      .bind(email.toLowerCase()).first<{ id: string }>()

    if (!admin) {
      return c.json({ ok: false, error: 'Admin tidak ditemukan' }, 404)
    }

    const hashed = await hashPassword(password)

    await c.env.MASTER_DB.prepare(`
      UPDATE admins SET password = ?, updated_at = datetime('now') WHERE email = ?
    `).bind(hashed, email.toLowerCase()).run()

    return c.json({ ok: true, message: `Password admin ${email} berhasil direset` })
  } catch (err) {
    return c.json({ ok: false, error: String(err) }, 500)
  }
})