// backend/src/index.ts
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { secureHeaders } from 'hono/secure-headers'

import { authRoutes } from './routes/auth'
import { tenantAuthRoutes } from './routes/tenant-auth'
import { tenantRoutes } from './routes/tenants'
import { planRoutes } from './routes/plans'
import { billingRoutes } from './routes/billing'
import { cmsRoutes } from './routes/cms'
import { adminRoutes } from './routes/admin'

// Module routes
import { fnbRoutes } from './routes/modules/fnb'
import { retailRoutes } from './routes/modules/retail'
import { klinikRoutes } from './routes/modules/klinik'
import { laundryRoutes } from './routes/modules/laundry'
import { apotekRoutes } from './routes/modules/apotek'
import { salonRoutes } from './routes/modules/salon'
import { propertiRoutes } from './routes/modules/properti'

// Shared routes
import { productRoutes } from './routes/products'
import { customerRoutes } from './routes/customers'
import { categoryRoutes } from './routes/categories'
import { orderRoutes } from './routes/orders'
import { laporanRoutes } from './routes/laporan'
import { supplierRoutes } from './routes/suppliers'
import { purchaseRoutes } from './routes/purchases'
import { settingsRoutes } from './routes/settings'
import { setupRoutes } from './routes/setup'
import { waRoutes } from './routes/wa'

import { seedRoutes } from './routes/seed'
import { cmsPublicRoutes } from './routes/cms-public'

// ─── Cloudflare Env Types ──────────────────────────────────────
export interface Env {
  // D1 Databases
  MASTER_DB: D1Database
  // KV
  SESSION_KV: KVNamespace
  CACHE_KV: KVNamespace
  // R2
  STORAGE: R2Bucket
  // Secrets
  JWT_SECRET: string
  MIDTRANS_SERVER_KEY: string
  MIDTRANS_CLIENT_KEY: string
  MIDTRANS_IS_PRODUCTION: string
  WA_API_URL: string
  WA_API_TOKEN: string
  // Vars
  ENVIRONMENT: string
  APP_URL: string
  ADMIN_URL: string
  WEB_URL: string
}

// ─── App ───────────────────────────────────────────────────────
const app = new Hono<{ Bindings: Env }>()

// ─── Global Middleware ─────────────────────────────────────────
app.use('*', logger())
app.use('*', prettyJSON())
app.use('*', secureHeaders())
app.use('*', cors({
  origin: (origin) => {
    const allowed = [
      'https://nexasistem.com',
      'https://www.nexasistem.com',
      'https://app.nexasistem.com',
      'https://admin.nexasistem.com',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
    ]
    return allowed.includes(origin) ? origin : allowed[0]
  },
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposeHeaders: ['Set-Cookie'],
}))

// ─── Health Check ──────────────────────────────────────────────
app.get('/health', (c) => c.json({ ok: true, env: c.env.ENVIRONMENT, ts: Date.now() }))

// ─── Public routes (no auth) ──────────────────────────────────
app.route('/api/cms', cmsPublicRoutes)

// ─── Seed (one-time setup) ────────────────────────────────────
app.route('/api/_seed', seedRoutes)

// ─── Admin Auth Routes ─────────────────────────────────────────
app.route('/api/admin/auth', authRoutes)
app.route('/api/admin/tenants', tenantRoutes)
app.route('/api/admin/plans', planRoutes)
app.route('/api/admin/billing', billingRoutes)
app.route('/api/admin/cms', cmsRoutes)
app.route('/api/admin/admins', adminRoutes)

// ─── Tenant Auth Routes ────────────────────────────────────────
app.route('/api/auth', tenantAuthRoutes)
app.route('/api/setup', setupRoutes)

// ─── Tenant API Routes ─────────────────────────────────────────
app.route('/api/products', productRoutes)
app.route('/api/customers', customerRoutes)
app.route('/api/categories', categoryRoutes)
app.route('/api/orders', orderRoutes)
app.route('/api/laporan', laporanRoutes)
app.route('/api/suppliers', supplierRoutes)
app.route('/api/purchases', purchaseRoutes)
app.route('/api/settings', settingsRoutes)
app.route('/api/wa', waRoutes)

// ─── Module Routes ─────────────────────────────────────────────
app.route('/api/modules/fnb', fnbRoutes)
app.route('/api/modules/retail', retailRoutes)
app.route('/api/modules/klinik', klinikRoutes)
app.route('/api/modules/laundry', laundryRoutes)
app.route('/api/modules/apotek', apotekRoutes)
app.route('/api/modules/salon', salonRoutes)
app.route('/api/modules/properti', propertiRoutes)

// ─── 404 ───────────────────────────────────────────────────────
app.notFound((c) => c.json({ ok: false, error: 'Route tidak ditemukan' }, 404))
app.onError((err, c) => {
  console.error('[error]', err)
  return c.json({ ok: false, error: err.message || 'Internal server error' }, 500)
})

export default app
