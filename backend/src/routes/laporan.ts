// backend/src/routes/laporan.ts
import { Hono } from 'hono'
import { tenantAuth } from '../middleware/auth'
import type { Env } from '../index'

export const laporanRoutes = new Hono<{ Bindings: Env }>()
laporanRoutes.use('*', tenantAuth)

// GET /api/laporan?type=summary&from=&to=&module=
laporanRoutes.get('/', async (c) => {
  const tenantId = c.get('tenantId')
  const type = c.req.query('type') || 'summary'
  const from = c.req.query('from') || new Date().toISOString().slice(0, 10)
  const to = c.req.query('to') || new Date().toISOString().slice(0, 10)
  const module = c.req.query('module') || ''

  if (type === 'summary') {
    let where = 'o.tenant_id = ? AND o.payment_status = ? AND date(o.created_at) BETWEEN ? AND ?'
    const params: unknown[] = [tenantId, 'paid', from, to]
    if (module) { where += ' AND o.module = ?'; params.push(module) }

    const summary = await c.env.MASTER_DB.prepare(`
      SELECT
        COUNT(*) as total_transactions,
        COALESCE(SUM(o.subtotal), 0) as gross_revenue,
        COALESCE(SUM(o.discount), 0) as total_discount,
        COALESCE(SUM(o.total), 0) as net_revenue
      FROM tenant_orders o
      WHERE ${where}
    `).bind(...params).first()

    const byDay = await c.env.MASTER_DB.prepare(`
      SELECT
        date(o.created_at) as date,
        COUNT(*) as count,
        COALESCE(SUM(o.total), 0) as revenue
      FROM tenant_orders o
      WHERE ${where}
      GROUP BY date(o.created_at)
      ORDER BY date
    `).bind(...params).all()

    const byPayment = await c.env.MASTER_DB.prepare(`
      SELECT
        o.payment_method,
        COUNT(*) as count,
        COALESCE(SUM(o.total), 0) as revenue
      FROM tenant_orders o
      WHERE ${where}
      GROUP BY o.payment_method
      ORDER BY revenue DESC
    `).bind(...params).all()

    const topProducts = await c.env.MASTER_DB.prepare(`
      SELECT
        oi.name,
        SUM(oi.qty) as total_qty,
        SUM(oi.subtotal) as total_sales
      FROM tenant_order_items oi
      JOIN tenant_orders o ON oi.order_id = o.id
      WHERE ${where}
      GROUP BY oi.name
      ORDER BY total_sales DESC
      LIMIT 10
    `).bind(...params).all()

    return c.json({
      ok: true,
      summary,
      byDay: byDay.results,
      byPaymentMethod: byPayment.results,
      topProducts: topProducts.results,
    })
  }

  if (type === 'stock') {
    let where = 'p.tenant_id = ? AND p.is_active = 1'
    const params: unknown[] = [tenantId]
    if (module) { where += ' AND p.module = ?'; params.push(module) }

    const products = await c.env.MASTER_DB.prepare(`
      SELECT
        p.*,
        c.name as category_name,
        CAST(p.stock * p.cost_price AS INTEGER) as stock_value
      FROM tenant_products p
      LEFT JOIN tenant_categories c ON p.category_id = c.id
      WHERE ${where}
      ORDER BY p.name
    `).bind(...params).all()

    const all = products.results as any[]
    const summary = {
      total_products: all.length,
      low_stock: all.filter(p => p.stock <= p.min_stock).length,
      total_stock_value: all.reduce((a, p) => a + (p.stock_value || 0), 0),
    }

    return c.json({ ok: true, products: all, summary })
  }

  return c.json({ ok: false, error: 'Type tidak dikenal' }, 400)
})

// GET /api/laporan/export?type=transactions&from=&to=&module=
laporanRoutes.get('/export', async (c) => {
  const tenantId = c.get('tenantId')
  const type = c.req.query('type') || 'transactions'
  const from = c.req.query('from') || new Date().toISOString().slice(0, 10)
  const to = c.req.query('to') || new Date().toISOString().slice(0, 10)
  const module = c.req.query('module') || ''

  let csv = ''
  if (type === 'transactions') {
    let where = 'o.tenant_id = ? AND date(o.created_at) BETWEEN ? AND ?'
    const params: unknown[] = [tenantId, from, to]
    if (module) { where += ' AND o.module = ?'; params.push(module) }

    const { results } = await c.env.MASTER_DB.prepare(`
      SELECT
        o.order_number, o.module, o.status, o.payment_method,
        o.subtotal, o.discount, o.total, o.paid_amount,
        o.created_at, c.name as customer_name
      FROM tenant_orders o
      LEFT JOIN tenant_customers c ON o.customer_id = c.id
      WHERE ${where}
      ORDER BY o.created_at DESC
    `).bind(...params).all()

    csv = 'No. Order,Modul,Status,Metode Bayar,Subtotal,Diskon,Total,Dibayar,Pelanggan,Tanggal\n'
    csv += results.map((r: any) =>
      `${r.order_number},${r.module},${r.status},${r.payment_method || ''},${r.subtotal},${r.discount},${r.total},${r.paid_amount},${r.customer_name || ''},${r.created_at}`
    ).join('\n')
  } else if (type === 'top_products') {
    let where = 'o.tenant_id = ? AND date(o.created_at) BETWEEN ? AND ?'
    const params: unknown[] = [tenantId, from, to]
    if (module) { where += ' AND o.module = ?'; params.push(module) }

    const { results } = await c.env.MASTER_DB.prepare(`
      SELECT oi.name, SUM(oi.qty) as total_qty, SUM(oi.subtotal) as total_sales
      FROM tenant_order_items oi
      JOIN tenant_orders o ON oi.order_id = o.id
      WHERE ${where}
      GROUP BY oi.name
      ORDER BY total_sales DESC
    `).bind(...params).all()

    csv = 'Produk,Qty Terjual,Total Penjualan\n'
    csv += results.map((r: any) => `${r.name},${r.total_qty},${r.total_sales}`).join('\n')
  }

  const filename = `nexasistem_${type}_${from}_${to}.csv`
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    }
  })
})
