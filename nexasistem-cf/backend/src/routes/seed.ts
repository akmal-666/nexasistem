// backend/src/routes/seed.ts
// One-time setup endpoint untuk buat admin pertama
// HAPUS atau DISABLE setelah admin dibuat!

import { Hono } from 'hono'
import { hashPassword } from '@nexasistem/auth'
import type { Env } from '../index'

export const seedRoutes = new Hono<{ Bindings: Env }>()

// POST /api/_seed/admin
// Body: { name, email, password, seed_secret }
// seed_secret harus cocok dengan SEED_SECRET environment variable
seedRoutes.post('/admin', async (c) => {
  try {
    const body = await c.req.json()
    const { name, email, password, seed_secret } = body

    // Validasi seed secret (set via wrangler secret put SEED_SECRET)
    const SEED_SECRET = (c.env as any).SEED_SECRET
    if (!SEED_SECRET || seed_secret !== SEED_SECRET) {
      return c.json({ ok: false, error: 'Seed secret tidak valid' }, 403)
    }

    // Cek apakah sudah ada admin
    const existing = await c.env.MASTER_DB
      .prepare('SELECT COUNT(*) as n FROM admins WHERE is_active = 1')
      .first<{ n: number }>()

    if ((existing?.n ?? 0) > 0) {
      return c.json({ ok: false, error: 'Admin sudah ada. Endpoint ini hanya untuk setup pertama.' }, 409)
    }

    if (!name || !email || !password) {
      return c.json({ ok: false, error: 'name, email, password wajib diisi' }, 400)
    }

    if (password.length < 8) {
      return c.json({ ok: false, error: 'Password minimal 8 karakter' }, 400)
    }

    const hashed = await hashPassword(password)
    const id = crypto.randomUUID()

    await c.env.MASTER_DB.prepare(`
      INSERT INTO admins (id, name, email, password, role)
      VALUES (?, ?, ?, ?, 'superadmin')
    `).bind(id, name, email.toLowerCase(), hashed).run()

    return c.json({
      ok: true,
      message: 'Admin berhasil dibuat. HAPUS endpoint ini dari produksi!',
      id,
    }, 201)
  } catch (err) {
    return c.json({ ok: false, error: String(err) }, 500)
  }
})
