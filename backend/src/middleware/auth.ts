// backend/src/middleware/auth.ts
import type { Context, Next } from 'hono'
import { getTokenFromRequest, verifyJwt, getSessionFromKV } from '@nexasistem/auth'
import type { Env } from '../index'

// ─── Tenant Auth Middleware ────────────────────────────────────
export async function tenantAuth(c: Context<{ Bindings: Env }>, next: Next) {
  const token = getTokenFromRequest(c.req.raw)
  if (!token) return c.json({ ok: false, error: 'Unauthorized', code: 'AUTH_REQUIRED' }, 401)

  const payload = await verifyJwt(token, c.env.JWT_SECRET)
  if (!payload || payload.type !== 'tenant') {
    return c.json({ ok: false, error: 'Token tidak valid', code: 'INVALID_TOKEN' }, 401)
  }

  // Ambil full session dari KV
  const session = await getSessionFromKV(c.env.SESSION_KV, payload.sub + ':' + payload.tid)
  if (!session || !('user' in session)) {
    return c.json({ ok: false, error: 'Sesi berakhir, silakan login kembali', code: 'SESSION_EXPIRED' }, 401)
  }

  c.set('session', session)
  c.set('userId', payload.sub)
  c.set('tenantId', payload.tid)
  c.set('tenantSlug', payload.tslug)
  c.set('userRole', payload.role)

  await next()
}

// ─── Admin Auth Middleware ─────────────────────────────────────
export async function adminAuth(c: Context<{ Bindings: Env }>, next: Next) {
  const token = getTokenFromRequest(c.req.raw)
  if (!token) return c.json({ ok: false, error: 'Unauthorized', code: 'AUTH_REQUIRED' }, 401)

  const payload = await verifyJwt(token, c.env.JWT_SECRET)
  if (!payload || payload.type !== 'admin') {
    return c.json({ ok: false, error: 'Token tidak valid', code: 'INVALID_TOKEN' }, 401)
  }

  const session = await getSessionFromKV(c.env.SESSION_KV, 'admin:' + payload.sub)
  if (!session || !('admin' in session)) {
    return c.json({ ok: false, error: 'Sesi berakhir', code: 'SESSION_EXPIRED' }, 401)
  }

  c.set('adminSession', session)
  c.set('adminId', payload.sub)
  await next()
}

// ─── Superadmin Guard ──────────────────────────────────────────
export async function superadminOnly(c: Context<{ Bindings: Env }>, next: Next) {
  const session = c.get('adminSession')
  if (!session?.admin || session.admin.role !== 'superadmin') {
    return c.json({ ok: false, error: 'Hanya superadmin yang bisa akses', code: 'FORBIDDEN' }, 403)
  }
  await next()
}

// ─── Role Guard ────────────────────────────────────────────────
export function requireRole(...roles: string[]) {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const userRole = c.get('userRole')
    if (!roles.includes(userRole)) {
      return c.json({ ok: false, error: 'Tidak punya akses', code: 'FORBIDDEN' }, 403)
    }
    await next()
  }
}

// ─── D1 Tenant DB Helper ───────────────────────────────────────
// Karena Cloudflare tidak support dynamic D1 binding,
// kita pakai single-DB dengan tenant isolation via tenant_id prefix
// Setiap query menyertakan tenant_id sebagai filter

export function getTenantDb(c: Context<{ Bindings: Env }>): D1Database {
  // Dalam implementasi real: gunakan MASTER_DB dengan tenant isolation
  // atau Cloudflare Durable Objects untuk per-tenant storage
  return c.env.MASTER_DB
}
