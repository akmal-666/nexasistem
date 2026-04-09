import { Hono } from 'hono'
import { tenantAuth } from '../middleware/auth'
import type { Env } from '../index'
export const waRoutes = new Hono<{ Bindings: Env }>()
waRoutes.use('*', tenantAuth)
waRoutes.get('/', async (c) => {
  const configured = !!(c.env.WA_API_URL && c.env.WA_API_TOKEN)
  return c.json({ ok: true, configured, api_url: c.env.WA_API_URL ? '***set***' : null })
})
waRoutes.post('/', async (c) => {
  const { type, data } = await c.req.json()
  if (!c.env.WA_API_URL || !c.env.WA_API_TOKEN) return c.json({ ok: false, error: 'WA API belum dikonfigurasi' }, 500)
  const phone = data?.phone?.replace(/[^0-9]/g,'').replace(/^0/,'62')
  const messages: Record<string,string> = {
    custom: data?.message || '-',
    laundry_ready: `Halo ${data?.customer_name||'Pelanggan'}, laundry Anda sudah siap diambil. Terima kasih!`,
    booking_reminder: `Halo ${data?.customer_name||'Pelanggan'}, pengingat booking Anda besok pukul ${data?.time||''}. Terima kasih!`,
    billing_reminder: `Halo ${data?.customer_name||'Pelanggan'}, tagihan sewa bulan ini sebesar ${data?.amount||''} jatuh tempo ${data?.due_date||''}. Terima kasih!`,
  }
  const message = messages[type] || data?.message || '-'
  const res = await fetch(c.env.WA_API_URL, { method:'POST', headers:{'Authorization':c.env.WA_API_TOKEN,'Content-Type':'application/json'}, body: JSON.stringify({target:phone, message}) })
  const result = await res.json() as any
  return c.json({ ok: result.status||res.ok, result })
})
