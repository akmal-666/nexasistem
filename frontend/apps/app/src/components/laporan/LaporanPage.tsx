// backend/src/routes/laporan.ts
import { Hono } from 'hono'
import { tenantAuth } from '../middleware/auth'
import type { Env } from '../index'

export const laporanRoutes = new Hono<{ Bindings: Env }>()
laporanRoutes.use('*', tenantAuth)

laporanRoutes.get('/', async (c) => {
  const tenantId = c.get('tenantId')
  const db = c.env.MASTER_DB
  const type = c.req.query('type') || 'summary'
  const module = c.req.query('module') || ''
  const from = c.req.query('from') || new Date().toISOString().slice(0, 10)
  const to = c.req.query('to') || new Date().toISOString().slice(0, 10)
  const period = c.req.query('period') || 'daily' // daily | weekly | monthly | quarterly

  const modFilter = module ? \`AND module = '\${module}'\` : ''

  if (type === 'summary') {
    const summary = await db.prepare(\`
      SELECT
        COUNT(*) as total_transactions,
        COALESCE(SUM(subtotal), 0) as gross_revenue,
        COALESCE(SUM(discount), 0) as total_discount,
        COALESCE(SUM(total), 0) as net_revenue,
        COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total ELSE 0 END), 0) as paid_revenue,
        COUNT(CASE WHEN status = 'done' THEN 1 END) as done_count
      FROM tenant_orders
      WHERE tenant_id = ? AND status != 'cancelled'
        AND date(created_at) BETWEEN ? AND ?
        \${modFilter}
    \`).bind(tenantId, from, to).first()

    // Chart data berdasarkan period
    let chartQuery = ''
    if (period === 'daily') {
      chartQuery = \`
        SELECT date(created_at) as period_key,
          strftime('%d %b', created_at) as period_label,
          COUNT(*) as transactions,
          COALESCE(SUM(total), 0) as revenue
        FROM tenant_orders
        WHERE tenant_id = ? AND status != 'cancelled'
          AND date(created_at) BETWEEN ? AND ? \${modFilter}
        GROUP BY date(created_at)
        ORDER BY date(created_at)
      \`
    } else if (period === 'weekly') {
      chartQuery = \`
        SELECT strftime('%W-%Y', created_at) as period_key,
          'W' || strftime('%W', created_at) as period_label,
          COUNT(*) as transactions,
          COALESCE(SUM(total), 0) as revenue
        FROM tenant_orders
        WHERE tenant_id = ? AND status != 'cancelled'
          AND date(created_at) >= date('now', '-84 days') \${modFilter}
        GROUP BY strftime('%W-%Y', created_at)
        ORDER BY period_key
        LIMIT 12
      \`
    } else if (period === 'monthly') {
      chartQuery = \`
        SELECT strftime('%m-%Y', created_at) as period_key,
          strftime('%b %Y', created_at) as period_label,
          COUNT(*) as transactions,
          COALESCE(SUM(total), 0) as revenue
        FROM tenant_orders
        WHERE tenant_id = ? AND status != 'cancelled'
          AND date(created_at) >= date('now', '-365 days') \${modFilter}
        GROUP BY strftime('%m-%Y', created_at)
        ORDER BY period_key
        LIMIT 12
      \`
    } else {
      chartQuery = \`
        SELECT strftime('%m-%Y', created_at) as period_key,
          'Q' || ((CAST(strftime('%m', created_at) AS INT) - 1) / 3 + 1) || ' ' || strftime('%Y', created_at) as period_label,
          COUNT(*) as transactions,
          COALESCE(SUM(total), 0) as revenue
        FROM tenant_orders
        WHERE tenant_id = ? AND status != 'cancelled'
          AND date(created_at) >= date('now', '-548 days') \${modFilter}
        GROUP BY strftime('%Y', created_at), ((CAST(strftime('%m', created_at) AS INT) - 1) / 3)
        ORDER BY period_key
        LIMIT 8
      \`
    }

    const { results: chartData } = await db.prepare(chartQuery).bind(tenantId, from, to).all()

    const { results: topProducts } = await db.prepare(\`
      SELECT oi.name, SUM(oi.qty) as total_qty, SUM(oi.subtotal) as total_sales
      FROM tenant_order_items oi
      JOIN tenant_orders o ON oi.order_id = o.id
      WHERE o.tenant_id = ? AND o.status != 'cancelled'
        AND date(o.created_at) BETWEEN ? AND ? \${modFilter}
      GROUP BY oi.name
      ORDER BY total_sales DESC
      LIMIT 10
    \`).bind(tenantId, from, to).all()

    const { results: byPaymentMethod } = await db.prepare(\`
      SELECT payment_method, COUNT(*) as count, COALESCE(SUM(total), 0) as revenue
      FROM tenant_orders
      WHERE tenant_id = ? AND payment_status = 'paid'
        AND date(created_at) BETWEEN ? AND ? \${modFilter}
      GROUP BY payment_method
    \`).bind(tenantId, from, to).all()

    return c.json({ ok: true, summary, chartData, topProducts, byPaymentMethod })
  }

  // Stock report
  if (type === 'stock') {
    const { results: products } = await db.prepare(\`
      SELECT p.*, c.name as category_name,
        CAST(p.stock * p.cost_price AS INTEGER) as stock_value
      FROM tenant_products p
      LEFT JOIN tenant_categories c ON p.category_id = c.id
      WHERE p.tenant_id = ? AND p.is_active = 1
        \${modFilter}
      ORDER BY p.stock ASC
    \`).bind(tenantId).all()

    const summary = await db.prepare(\`
      SELECT COUNT(*) as total_products,
        SUM(CASE WHEN stock <= min_stock THEN 1 ELSE 0 END) as low_stock,
        SUM(CASE WHEN stock = 0 THEN 1 ELSE 0 END) as out_of_stock,
        COALESCE(SUM(CAST(stock * cost_price AS INTEGER)), 0) as total_stock_value
      FROM tenant_products
      WHERE tenant_id = ? AND is_active = 1 \${modFilter}
    \`).bind(tenantId).first()

    return c.json({ ok: true, products, summary })
  }

  return c.json({ ok: false, error: 'Type tidak dikenal' }, 400)
})

laporanRoutes.get('/export', async (c) => {
  const tenantId = c.get('tenantId')
  const db = c.env.MASTER_DB
  const module = c.req.query('module') || ''
  const from = c.req.query('from') || new Date().toISOString().slice(0, 10)
  const to = c.req.query('to') || new Date().toISOString().slice(0, 10)
  const modFilter = module ? \`AND o.module = '\${module}'\` : ''

  const { results: orders } = await db.prepare(\`
    SELECT o.order_number, o.module, o.total, o.payment_method,
      o.payment_status, o.status, o.created_at,
      c.name as customer_name
    FROM tenant_orders o
    LEFT JOIN tenant_customers c ON o.customer_id = c.id
    WHERE o.tenant_id = ? AND o.status != 'cancelled'
      AND date(o.created_at) BETWEEN ? AND ? \${modFilter}
    ORDER BY o.created_at DESC
  \`).bind(tenantId, from, to).all()

  const header = 'No. Order,Modul,Customer,Total,Metode,Status,Tanggal\n'
  const rows = orders.map((o: any) =>
    \`\${o.order_number},\${o.module},\${o.customer_name || '-'},\${o.total},\${o.payment_method || '-'},\${o.status},\${o.created_at}\`
  ).join('\n')

  return new Response(header + rows, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': \`attachment; filename="laporan-\${from}-\${to}.csv"\`,
    },
  })
})