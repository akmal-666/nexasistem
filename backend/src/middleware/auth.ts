// backend/src/middleware/auth.ts
import { verifyJwt } from '@nexasistem/auth'
import type { Context, Next } from 'hono'
import type { Env } from '../index'

// Ambil token dari Authorization header ATAU cookie
function extractToken(c: Context): string | null {
  // Coba Authorization: Bearer <token>
  const authHeader = c.req.header('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }
  // Fallback ke cookie
  const cookie = c.req.header('Cookie') || ''
  const match = cookie.match(/nx_auth=([^;]+)/)
  return match ? match[1] : null
}

export async function tenantAuth(c: Context<{ Bindings: Env }>, next: Next) {
  const token = extractToken(c)

  if (!token) {
    return c.json({ ok: false, error: 'Tidak terautentikasi' }, 401)
  }

  try {
    const payload = await verifyJwt(token, c.env.JWT_SECRET)
    if (!payload || payload.type !== 'tenant') {
      return c.json({ ok: false, error: 'Token tidak valid' }, 401)
    }

    c.set('tenantId', payload.tenantId)
    c.set('userId', payload.userId)
    c.set('userRole', payload.role)
    c.set('tenantSlug', payload.slug)

    await next()
  } catch {
    return c.json({ ok: false, error: 'Token expired atau tidak valid' }, 401)
  }
}

export async function adminAuth(c: Context<{ Bindings: Env }>, next: Next) {
  const token = extractToken(c)

  if (!token) {
    return c.json({ ok: false, error: 'Tidak terautentikasi' }, 401)
  }

  try {
    const payload = await verifyJwt(token, c.env.JWT_SECRET)
    if (!payload || payload.type !== 'admin') {
      return c.json({ ok: false, error: 'Akses ditolak' }, 403)
    }

    c.set('adminId', payload.adminId)
    c.set('adminRole', payload.role)

    await next()
  } catch {
    return c.json({ ok: false, error: 'Token expired atau tidak valid' }, 401)
  }
}

export async function superadminOnly(c: Context<{ Bindings: Env }>, next: Next) {
  const role = c.get('adminRole')
  if (role !== 'superadmin') {
    return c.json({ ok: false, error: 'Hanya superadmin yang bisa mengakses' }, 403)
  }
  await next()
}
