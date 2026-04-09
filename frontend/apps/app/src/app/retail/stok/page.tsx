'use client'
import { useEffect, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { formatRp, apiFetch } from '@/lib/utils'

export default function RetailStokPage() {
  const [products, setProducts] = useState<any[]>([])
  const [summary, setSummary] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [q, setQ] = useState('')

  useEffect(() => {
    apiFetch('/api/laporan?type=stock&module=retail')
      .then(d => { setProducts(d.products || []); setSummary(d.summary || {}) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = products.filter(p => {
    const matchQ = !q || p.name.toLowerCase().includes(q.toLowerCase())
    const matchFilter = filter === 'all' || (filter === 'low' && p.stock <= p.min_stock) || (filter === 'out' && p.stock <= 0)
    return matchQ && matchFilter
  })

  return (
    <AppLayout title="Manajemen Stok" subtitle="Monitor stok dan nilai inventaris">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
          {[
            { label: 'Total Produk', value: summary.total_products ?? 0, color: 'var(--accent)' },
            { label: 'Stok Normal',  value: (summary.total_products ?? 0) - (summary.low_stock ?? 0), color: '#10B981' },
            { label: 'Stok Menipis', value: summary.low_stock ?? 0, color: '#F59E0B' },
            { label: 'Nilai Stok',   value: formatRp(summary.total_stock_value ?? 0), color: 'var(--text-1)' },
          ].map(s => (
            <div key={s.label} className="stat" style={{ padding: '14px 16px' }}>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value" style={{ fontSize: s.label === 'Nilai Stok' ? 18 : 26, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <input className="form-input" placeholder="Cari produk..." value={q}
            onChange={e => setQ(e.target.value)} style={{ flex: 1, minWidth: 200 }} />
          <div style={{ display: 'flex', gap: 6 }}>
            {[{ v: 'all', l: 'Semua' }, { v: 'low', l: 'Menipis' }, { v: 'out', l: 'Habis' }].map(f => (
              <button key={f.v} onClick={() => setFilter(f.v)}
                className={`btn btn-sm ${filter === f.v ? 'btn-primary' : 'btn-secondary'}`}>{f.l}</button>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Produk</th>
                  <th>SKU</th>
                  <th>Stok</th>
                  <th>Min. Stok</th>
                  <th>Nilai</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}><td colSpan={6}><div className="skeleton" style={{ height: 18, borderRadius: 4 }} /></td></tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6}>
                    <div className="empty"><div className="empty-icon">📦</div><div className="empty-desc">Tidak ada produk</div></div>
                  </td></tr>
                ) : filtered.map((p: any) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-3)' }}>{p.sku || '–'}</td>
                    <td style={{ fontWeight: 700, color: p.stock <= 0 ? '#EF4444' : p.stock <= p.min_stock ? '#F59E0B' : 'var(--text-1)' }}>
                      {p.stock} {p.unit}
                    </td>
                    <td style={{ color: 'var(--text-3)' }}>{p.min_stock}</td>
                    <td style={{ fontWeight: 600 }}>{formatRp(p.stock_value || 0)}</td>
                    <td>
                      <span className={`badge ${p.stock <= 0 ? 'badge-red' : p.stock <= p.min_stock ? 'badge-yellow' : 'badge-green'}`}>
                        {p.stock <= 0 ? 'Habis' : p.stock <= p.min_stock ? 'Menipis' : 'Normal'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}