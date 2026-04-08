import { Hono } from 'hono'
import { uid } from '@nexasistem/db'
import { hashPassword } from '@nexasistem/auth'
import { adminAuth, superadminOnly } from '../middleware/auth'
import type { Env } from '../index'
export const adminRoutes = new Hono<{ Bindings: Env }>()
adminRoutes.use('*', adminAuth, superadminOnly)
adminRoutes.get('/', async (c) => {
  const {results} = await c.env.MASTER_DB.prepare('SELECT id,name,email,role,is_active,last_login,created_at FROM admins ORDER BY created_at').all()
  return c.json({ ok: true, admins: results })
})
adminRoutes.post('/', async (c) => {
  const { name, email, password, role } = await c.req.json()
  if (!name||!email||!password) return c.json({ ok: false, error: 'Semua field wajib' }, 400)
  const exists = await c.env.MASTER_DB.prepare('SELECT id FROM admins WHERE email=?').bind(email).first()
  if (exists) return c.json({ ok: false, error: 'Email sudah digunakan' }, 409)
  const id = uid()
  const hashed = await hashPassword(password)
  await c.env.MASTER_DB.prepare("INSERT INTO admins(id,name,email,password,role) VALUES(?,?,?,?,?)").bind(id,name,email,hashed,role||'staff').run()
  return c.json({ ok: true, id }, 201)
})
adminRoutes.patch('/:id', async (c) => {
  const id = c.req.param('id')
  const adminId = c.get('adminId')
  if (id === adminId) return c.json({ ok: false, error: 'Tidak bisa mengubah akun sendiri' }, 400)
  const { is_active, role } = await c.req.json()
  await c.env.MASTER_DB.prepare("UPDATE admins SET is_active=COALESCE(?,is_active),role=COALESCE(?,role),updated_at=datetime('now') WHERE id=?").bind(is_active,role,id).run()
  return c.json({ ok: true })
})
