'use client'
import { useEffect, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { formatRp, apiFetch } from '@/lib/utils'

const PRESETS = [
  { label: 'Hari ini', days: 0 },
  { label: '7 hari', days: 6 },
  { label: '30 hari', days: 29 },
]

function getDate(ago: number) {
  const d = new Date()
  d.setDate(d.getDate() - ago)
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
  }, [from, to])

  return (
    <AppLayout title={title} subtitle="Analisis penjualan dan pendapatan">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Filter bar */}
        <div className="card">
          <div className="card-bd" style={{ padding: '12px 18px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {PRESETS.map((p, i) => (
                  <button key={p.label} className={`btn btn-sm ${preset === i ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => { setPreset(i); setFrom(getDate(p.days)); setTo(today) }}>
                    {p.label}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
                <input type="date" className="form-input" value={from}
                  onChange={e => { setFrom(e.target.value); setPreset(-1) }}
                  style={{ width: 145, padding: '6px 10px', fontSize: 13 }} />
                <span style={{ color: 'var(--text-3)', fontSize: 13 }}>→</span>
                <input type="date" className="form-input" value={to}
                  onChange={e => { setTo(e.target.value); setPreset(-1) }}
                  style={{ width: 145, padding: '6px 10px', fontSize: 13 }} />
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        {loading ? (
          <div className="grid-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 90, borderRadius: 12 }} />
            ))}
          </div>
        ) : data && (
          <>
            <div className="grid-4">
              {[
                { label: 'Total Transaksi', value: String(data.summary?.total_transactions ?? 0), color: 'var(--accent)' },
                { label: 'Gross Revenue',   value: formatRp(data.summary?.gross_revenue ?? 0),   color: 'var(--green)' },
                { label: 'Total Diskon',    value: formatRp(data.summary?.total_discount ?? 0),   color: 'var(--yellow)' },
                { label: 'Net Revenue',     value: formatRp(data.summary?.net_revenue ?? 0),       color: 'var(--text-1)' },
              ].map(s => (
                <div key={s.label} className="stat">
                  <div className="stat-label">{s.label}</div>
                  <div className="stat-value" style={{ fontSize: 22, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Top products */}
            <div className="card">
              <div className="card-hd">
                <span className="card-hd-title">Produk Terlaris</span>
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{data.topProducts?.length ?? 0} produk</span>
              </div>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ width: 40 }}>#</th>
                      <th>Produk</th>
                      <th>Qty</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!data.topProducts?.length ? (
                      <tr><td colSpan={4}>
                        <div className="empty"><div className="empty-icon">📊</div><div className="empty-desc">Belum ada data untuk periode ini</div></div>
                      </td></tr>
                    ) : data.topProducts.map((p: any, i: number) => (
                      <tr key={p.name}>
                        <td style={{ color: 'var(--text-3)', fontWeight: 700, fontSize: 12 }}>{i + 1}</td>
                        <td style={{ fontWeight: 600 }}>{p.name}</td>
                        <td><span className="badge badge-accent">{p.total_qty}×</span></td>
                        <td style={{ fontWeight: 700, color: 'var(--green)' }}>{formatRp(p.total_sales)}</td>
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