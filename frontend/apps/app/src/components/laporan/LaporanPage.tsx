'use client'
import { useEffect, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { formatRp, apiFetch } from '@/lib/utils'

const PRESETS = [
  { label: 'Hari ini', days: 0 },
  { label: '7 hari', days: 6 },
  { label: '30 hari', days: 29 },
]

function getDate(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString().slice(0, 10)
}

interface Props { module: string; title: string }

export default function LaporanPage({ module, title }: Props) {
  const today = new Date().toISOString().slice(0, 10)
  const [from, setFrom] = useState(today)
  const [to, setTo] = useState(today)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [preset, setPreset] = useState(0)

  useEffect(() => {
    setLoading(true)
    apiFetch(`/api/laporan?type=summary&from=${from}&to=${to}&module=${module}`)
      .then(setData).catch(() => {}).finally(() => setLoading(false))
  }, [from, to, module])

  function applyPreset(days: number, idx: number) {
    setPreset(idx)
    setFrom(getDate(days))
    setTo(today)
  }

  return (
    <AppLayout title={title} subtitle="Analisis penjualan dan pendapatan">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Filter */}
        <div className="card" style={{ padding: '14px 20px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {PRESETS.map((p, i) => (
                <button key={p.label} onClick={() => applyPreset(p.days, i)}
                  className={`btn btn-sm ${preset === i ? 'btn-primary' : 'btn-secondary'}`}>
                  {p.label}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="date" className="form-input" value={from} onChange={e => { setFrom(e.target.value); setPreset(-1) }}
                style={{ width: 150, padding: '6px 10px', fontSize: 13 }} />
              <span style={{ color: 'var(--text-muted)' }}>—</span>
              <input type="date" className="form-input" value={to} onChange={e => { setTo(e.target.value); setPreset(-1) }}
                style={{ width: 150, padding: '6px 10px', fontSize: 13 }} />
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: 12 }}>
            {[...Array(4)].map((_,i) => <div key={i} className="skeleton" style={{ height: 90, borderRadius: 12 }} />)}
          </div>
        ) : data && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: 12 }}>
              {[
                { label: 'Total Transaksi', value: String(data.summary?.total_transactions ?? 0), color: 'var(--accent)' },
                { label: 'Gross Revenue', value: formatRp(data.summary?.gross_revenue ?? 0), color: 'var(--success)' },
                { label: 'Total Diskon', value: formatRp(data.summary?.total_discount ?? 0), color: 'var(--warning)' },
                { label: 'Net Revenue', value: formatRp(data.summary?.net_revenue ?? 0), color: 'var(--text-primary)' },
              ].map(s => (
                <div key={s.label} className="stat-card">
                  <div className="stat-label">{s.label}</div>
                  <div className="stat-value" style={{ fontSize: 22, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>

            <div className="card">
              <div className="card-header">
                <span className="card-title">Produk Terlaris</span>
              </div>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Produk</th>
                      <th>Qty</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.topProducts || []).length === 0 ? (
                      <tr><td colSpan={4}>
                        <div className="empty-state"><div className="empty-state-icon">📊</div><div className="empty-state-desc">Belum ada data</div></div>
                      </td></tr>
                    ) : (data.topProducts || []).map((p: any, i: number) => (
                      <tr key={p.name}>
                        <td style={{ color: 'var(--text-muted)', fontWeight: 700 }}>{i + 1}</td>
                        <td style={{ fontWeight: 600 }}>{p.name}</td>
                        <td><span className="badge badge-purple">{p.total_qty}x</span></td>
                        <td style={{ fontWeight: 700, color: 'var(--success)' }}>{formatRp(p.total_sales)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  )
}
