import { Hono } from 'hono'
import { uid } from '@nexasistem/db'
import { adminAuth } from '../middleware/auth'
import type { Env } from '../index'

export const billingRoutes = new Hono<{ Bindings: Env }>()
billingRoutes.use('*', adminAuth)

billingRoutes.get('/', async (c) => {
  const q = c.req.query('q') || ''
  const status = c.req.query('status') || ''
  const page = parseInt(c.req.query('page') || '1')
  let where = '1=1'; const params: unknown[] = []
  if (q) { where += ' AND (i.invoice_number LIKE ? OR t.name LIKE ?)'; params.push(`%${q}%`, `%${q}%`) }
  if (status) { where += ' AND i.status = ?'; params.push(status) }
  const total = await c.env.MASTER_DB.prepare(`SELECT COUNT(*) as n FROM invoices i JOIN tenants t ON i.tenant_id=t.id WHERE ${where}`).bind(...params).first<{n:number}>()
  const {results} = await c.env.MASTER_DB.prepare(`SELECT i.*, t.name as tenant_name, t.owner_email FROM invoices i JOIN tenants t ON i.tenant_id=t.id WHERE ${where} ORDER BY i.created_at DESC LIMIT 20 OFFSET ?`).bind(...params, (page-1)*20).all()
  return c.json({ ok: true, invoices: results, total: total?.n ?? 0, page })
})

billingRoutes.post('/', async (c) => {
  const body = await c.req.json()
  const { tenant_id, amount, due_date, notes } = body
  if (!tenant_id || !amount || !due_date) return c.json({ ok: false, error: 'tenant_id, amount, due_date wajib' }, 400)
  const id = uid()
  const today = new Date()
  const year = today.getFullYear().toString().slice(-2)
  const month = String(today.getMonth()+1).padStart(2,'0')
  const seq = Math.floor(Math.random()*9000)+1000
  const invoice_number = `INV-${year}${month}-${seq}`
  const tax = Math.round(amount * 0.11)
  const total = amount + tax
  await c.env.MASTER_DB.prepare(`INSERT INTO invoices (id,invoice_number,tenant_id,amount,tax,total,status,due_date,notes) VALUES (?,?,?,?,?,?,'unpaid',?,?)`).bind(id,invoice_number,tenant_id,amount,tax,total,due_date,notes||null).run()
  return c.json({ ok: true, id, invoice_number }, 201)
})

billingRoutes.patch('/:id', async (c) => {
  const id = c.req.param('id')
  const { action, payment_method } = await c.req.json()
  if (action === 'mark_paid') {
    await c.env.MASTER_DB.prepare("UPDATE invoices SET status='paid', paid_at=datetime('now'), payment_method=?, updated_at=datetime('now') WHERE id=?").bind(payment_method||'manual', id).run()
    const inv = await c.env.MASTER_DB.prepare('SELECT tenant_id FROM invoices WHERE id=?').bind(id).first<{tenant_id:string}>()
    if (inv) await c.env.MASTER_DB.prepare("UPDATE tenants SET status='active', updated_at=datetime('now') WHERE id=?").bind(inv.tenant_id).run()
    return c.json({ ok: true })
  }
  return c.json({ ok: false, error: 'Action tidak dikenal' }, 400)
})
