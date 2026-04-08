// packages/auth/src/index.ts
import type { UserRole, TenantSession, AdminSession } from '@nexasistem/shared'

// ─── JWT Helpers ──────────────────────────────────────────────
export interface JwtPayload {
  sub: string        // user id
  tid: string        // tenant id
  tslug: string      // tenant slug
  role: UserRole
  type: 'tenant' | 'admin'
  iat: number
  exp: number
}

export async function signJwt(payload: Omit<JwtPayload, 'iat' | 'exp'>, secret: string, expiresInSec = 60 * 60 * 24 * 7): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const body: JwtPayload = { ...payload, iat: now, exp: now + expiresInSec }

  const enc = (obj: object) => btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  const data = `${enc(header)}.${enc(body)}`
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  return `${data}.${sigB64}`
}

export async function verifyJwt(token: string, secret: string): Promise<JwtPayload | null> {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const [headerB64, bodyB64, sigB64] = parts
    const data = `${headerB64}.${bodyB64}`
    const key = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false, ['verify']
    )
    const sig = Uint8Array.from(atob(sigB64.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0))
    const valid = await crypto.subtle.verify('HMAC', key, sig, new TextEncoder().encode(data))
    if (!valid) return null

    const payload: JwtPayload = JSON.parse(atob(bodyB64.replace(/-/g, '+').replace(/_/g, '/')))
    if (payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}

export function getTokenFromRequest(request: Request): string | null {
  // Coba dari cookie dulu
  const cookieHeader = request.headers.get('Cookie') || ''
  const match = cookieHeader.match(/(?:^|;\s*)nx_token=([^;]+)/)
  if (match) return decodeURIComponent(match[1])

  // Fallback ke Authorization header
  const auth = request.headers.get('Authorization')
  if (auth?.startsWith('Bearer ')) return auth.slice(7)

  return null
}

export function makeAuthCookie(token: string, maxAgeSec = 60 * 60 * 24 * 7): string {
  return `nx_token=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAgeSec}`
}

export function clearAuthCookie(): string {
  return 'nx_token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'
}

// ─── Password Hashing (PBKDF2 — runs in Workers) ─────────────
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, keyMaterial, 256)
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('')
  const hashHex = Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('')
  return `pbkdf2:${saltHex}:${hashHex}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    if (stored.startsWith('pbkdf2:')) {
      const [, saltHex, hashHex] = stored.split(':')
      const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map(h => parseInt(h, 16)))
      const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
      const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, keyMaterial, 256)
      const testHex = Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('')
      return testHex === hashHex
    }
    return false
  } catch {
    return false
  }
}

// ─── KV Session Store ─────────────────────────────────────────
export type KVNamespace = {
  get(key: string): Promise<string | null>
  put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>
  delete(key: string): Promise<void>
}

export async function getSessionFromKV(kv: KVNamespace, sessionId: string): Promise<TenantSession | AdminSession | null> {
  const raw = await kv.get(`session:${sessionId}`)
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

export async function setSessionInKV(kv: KVNamespace, sessionId: string, data: TenantSession | AdminSession, ttlSec = 60 * 60 * 24 * 7): Promise<void> {
  await kv.put(`session:${sessionId}`, JSON.stringify(data), { expirationTtl: ttlSec })
}

export async function deleteSessionFromKV(kv: KVNamespace, sessionId: string): Promise<void> {
  await kv.delete(`session:${sessionId}`)
}

export function generateSessionId(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join('')
}
