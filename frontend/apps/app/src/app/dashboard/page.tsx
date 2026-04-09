'use client'
import { useEffect, useState, useCallback } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { apiFetch, formatRp, getTenant } from '@/lib/utils'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, Legend
} from 'recharts'

const PERIODS = [
  { label: 'Mingguan', value: 'daily', range: 6 },
  { label: 'Bulanan', value: 'weekly', range: 90 },
  { label: 'Kuartal', value: 'monthly', range: 365 },
]

const BAR_COLORS = ['#4F46E5','#818CF8','#38BDF8','#2DD4BF','#94A3B8']

function getDateRange(daysBack: number) {
  const to = new Date().toISOString().slice(0, 10)
  const from = new Date(Date.now() - daysBack * 86400000).toISOString().slice(0, 10)
  return { from, to }
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: 12, boxShadow: 'var(--shadow-md)' }}>
      <div style={{ fontWeight: 700, marginBottom: 6, color: 'var(--text-1)' }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-2)', marginBottom: 2 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: p.fill || p.color, flexShrink: 0 }} />
          <span>{p.name === 'revenue' ? 'Revenue' : p.name === 'transactions' ? 'Order' : p.name}:&nbsp;
            <strong style={{ color: 'var(--text-1)' }}>
              {p.name === 'revenue' ? formatRp(p.value) : p.value}
            </strong>
          </span>
        </div>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const tenant = getTenant()
  const module = tenant?.business_type || 'fnb'
  const moduleLabelMap: Record<string, string> = { fnb:'FnB', retail:'Retail', klinik:'Klinik', laundry:'Laundry', apotek:'Apotek', salon:'Salon', properti:'Properti' }
  const moduleLabel = moduleLabelMap[module] || 'Bisnis'

  const [periodIdx, setPeriodIdx] = useState(0)
  const [stats, setStats] = useState<any>(null)
  const [chartData, setChartData] = useState<any[]>([])
  const [topProducts, setTopProducts] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [moduleStats, setModuleStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const period = PERIODS[periodIdx]

  const loadData = useCallback(async () => {
    setLoading(true)
    const { from, to } = getDateRange(period.range)
    try {
      const [summary, ordersData, modData] = await Promise.allSettled([
        apiFetch(`/api/laporan?type=summary&from=${from}&to=${to}&module=${module}&period=${period.value}`),
        apiFetch(`/api/modules/${module}?action=orders`),
        apiFetch(`/api/modules/${module}?action=stats`),
      ])

      if (summary.status === 'fulfilled') {
        const d = (summary as any).value
        setStats(d.summary)
        setChartData(d.chartData || [])
        setTopProducts(d.topProducts || [])
      }
      if (ordersData.status === 'fulfilled') {
        setOrders(((ordersData as any).value.orders || []).slice(0, 8))
      }
      if (modData.status === 'fulfilled') {
        setModuleStats((modData as any).value)
      }
    } catch (e) {}
    setLoading(false)
  }, [module, period])

  useEffect(() => { loadData() }, [loadData])

  // Module-specific extra stats
  const extraStats = (() => {
    if (module === 'fnb') return [
      { label: 'Meja Terisi', value: moduleStats?.tableStats ? `${moduleStats.tableStats.occupied}/${moduleStats.tableStats.total}` : '0/0', color: '#F59E0B' },
    ]
    if (module === 'klinik') return [
      { label: 'Antrian Hari Ini', value: String(moduleStats?.totalQueues ?? 0), color: '#10B981' },
    ]
    if (module === 'laundry') return [
      { label: 'Order Siap', value: String(moduleStats?.stats?.ready ?? 0), color: '#8B5CF6' },
    ]
    if (module === 'properti') return [
      { label: 'Unit Dihuni', value: String(moduleStats?.summary?.occupied ?? 0), color: '#06B6D4' },
    ]
    return []
  })()

  interface StatCard { label: string; value: string; change?: string; color: string }
  const STAT_CARDS: StatCard[] = [
    { label: 'Total Revenue', value: formatRp(stats?.net_revenue ?? 0), change: '+12.5%', color: 'var(--accent)' },
    { label: 'Total Order', value: String(stats?.total_transactions ?? 0), change: '+8.3%', color: '#2DD4BF' },
    { label: 'Order Selesai', value: String(stats?.done_count ?? 0), color: '#10B981' },
    ...extraStats,
  ]

  return (
    <AppLayout title={`Dashboard ${moduleLabel}`} subtitle={today}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* ── Stat cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${STAT_CARDS.length}, 1fr)`, gap: 10 }}>
          {STAT_CARDS.map(s => (
            <div key={s.label} className="card" style={{ padding: '16px 18px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text-3)', marginBottom: 8 }}>{s.label}</div>
              {loading
                ? <div className="skeleton" style={{ height: 30, width: 120, borderRadius: 6 }} />
                : <div style={{ fontSize: 26, fontWeight: 800, color: s.color, letterSpacing: '-.04em', lineHeight: 1 }}>{s.value}</div>
              }
              {s.change && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 7 }}>
                  <span style={{ background: '#D1FAE5', color: '#059669', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>{s.change} ↗</span>
                  <span style={{ fontSize: 11, color: 'var(--text-3)' }}>vs periode lalu</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── Charts row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 12 }}>

          {/* Sales Overview bar chart */}
          <div className="card">
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-1)', marginBottom: 4 }}>Sales Overview</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-.04em', lineHeight: 1 }}>
                    {loading ? <span className="skeleton" style={{ display: 'inline-block', width: 140, height: 28, borderRadius: 6 }} /> : formatRp(stats?.net_revenue ?? 0)}
                  </div>
                  {!loading && (
                    <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
                      + {formatRp((stats?.net_revenue ?? 0) * 0.08)} peningkatan
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  {['≡ Filter','⇅ Sort','⋯'].map(b => (
                    <button key={b} style={{
                      padding: '5px 10px', borderRadius: 7, border: '1px solid var(--border)',
                      background: 'var(--bg)', fontSize: 12, color: 'var(--text-2)',
                      cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
                    }}>{b}</button>
                  ))}
                </div>
              </div>
              {/* Period tabs */}
              <div style={{ display: 'flex', gap: 4, marginTop: 12 }}>
                {PERIODS.map((p, i) => (
                  <button key={p.label} onClick={() => setPeriodIdx(i)} style={{
                    padding: '4px 12px', borderRadius: 6,
                    border: 'none', fontSize: 12, fontWeight: 600,
                    background: periodIdx === i ? 'var(--accent)' : 'var(--bg)',
                    color: periodIdx === i ? 'white' : 'var(--text-3)',
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
                  }}>{p.label}</button>
                ))}
              </div>
            </div>
            <div style={{ padding: '16px 18px 8px' }}>
              {loading ? (
                <div className="skeleton" style={{ height: 200, borderRadius: 8 }} />
              ) : chartData.length === 0 ? (
                <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', fontSize: 13 }}>
                  Belum ada data untuk periode ini
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData} barSize={20} barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="period_label" axisLine={false} tickLine={false}
                      tick={{ fontSize: 11, fill: 'var(--text-3)' }} />
                    <YAxis hide />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-hover)' }} />
                    <Bar dataKey="revenue" name="revenue" radius={[4,4,0,0]}>
                      {chartData.map((_: any, i: number) => (
                        <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Total Transaksi */}
          <div className="card">
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
                    </svg>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-1)' }}>Total Transaksi</span>
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-.04em', lineHeight: 1 }}>
                    {loading ? '–' : (stats?.total_transactions ?? 0).toLocaleString('id-ID')}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6 }}>
                    <span style={{ background: '#D1FAE5', color: '#059669', fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 99 }}>8.3% ↗</span>
                    <span style={{ fontSize: 11, color: 'var(--text-3)' }}>+ {stats?.done_count ?? 0} selesai</span>
                  </div>
                </div>
                <select onChange={e => {
                  const idx = PERIODS.findIndex(p => p.label === e.target.value)
                  if (idx >= 0) setPeriodIdx(idx)
                }} style={{
                  padding: '5px 28px 5px 10px', borderRadius: 7,
                  border: '1px solid var(--border)', background: 'var(--bg)',
                  fontSize: 12, color: 'var(--text-2)', fontFamily: 'inherit', outline: 'none', cursor: 'pointer',
                  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%239AA0B0' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
                  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', appearance: 'none',
                }}>
                  {PERIODS.map(p => <option key={p.label}>{p.label}</option>)}
                </select>
              </div>
            </div>
            <div style={{ padding: '16px 18px 8px' }}>
              {loading ? (
                <div className="skeleton" style={{ height: 170, borderRadius: 8 }} />
              ) : (
                <ResponsiveContainer width="100%" height={170}>
                  <BarChart data={chartData} barSize={24} barCategoryGap="35%">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="period_label" axisLine={false} tickLine={false}
                      tick={{ fontSize: 11, fill: 'var(--text-3)' }} />
                    <YAxis hide />
                    <Tooltip content={<CustomTooltip />} cursor={false} />
                    <Bar dataKey="transactions" name="transactions" radius={[5,5,0,0]}>
                      {chartData.map((d: any, i: number) => {
                        const isMax = d.transactions === Math.max(...chartData.map((x: any) => x.transactions || 0))
                        return <Cell key={i} fill={isMax ? '#6366F1' : 'var(--bg-hover)'} />
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* ── Tables row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 12 }}>

          {/* Top Products */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-1)' }}>Produk Terlaris</span>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Mobile App</span>
                <span style={{ width: 6, height: 6, borderRadius: 99, background: '#2DD4BF' }} />
                <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Other</span>
                <span style={{ width: 6, height: 6, borderRadius: 99, background: '#6366F1' }} />
              </div>
            </div>
            <div>
              {loading ? (
                <div style={{ padding: 16 }}>
                  {[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 44, borderRadius: 6, marginBottom: 8 }} />)}
                </div>
              ) : topProducts.length === 0 ? (
                <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>Belum ada data</div>
              ) : topProducts.slice(0, 6).map((p: any, i: number) => {
                const maxVal = Math.max(...topProducts.map((x: any) => x.total_sales || 1))
                const pct = Math.round((p.total_sales / maxVal) * 100)
                return (
                  <div key={i} style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 5 }}>{p.name}</div>
                      <div style={{ height: 4, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: pct + '%', background: i < 3 ? '#2DD4BF' : '#6366F1', borderRadius: 99, transition: 'width .4s' }} />
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>{formatRp(p.total_sales)}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{p.total_qty}×</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Recent Orders */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
                  <rect x="9" y="3" width="6" height="4" rx="1"/>
                </svg>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-1)' }}>Transaksi Terbaru</span>
              </div>
              <a href={`/${module}/laporan`} style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>Lihat Semua</a>
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: 36, padding: '9px 14px' }}>
                      <input type="checkbox" style={{ width: 13, height: 13, accentColor: 'var(--accent)', cursor: 'pointer' }} />
                    </th>
                    <th>Nomor Order</th>
                    <th>Tipe</th>
                    <th>Rate</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i}><td colSpan={5} style={{ padding: '10px 16px' }}>
                        <div className="skeleton" style={{ height: 18, borderRadius: 4 }} />
                      </td></tr>
                    ))
                  ) : orders.length === 0 ? (
                    <tr><td colSpan={5}>
                      <div style={{ padding: '28px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>Belum ada transaksi hari ini</div>
                    </td></tr>
                  ) : orders.map((o: any) => (
                    <tr key={o.id}>
                      <td style={{ padding: '10px 14px' }}>
                        <input type="checkbox" style={{ width: 13, height: 13, accentColor: 'var(--accent)', cursor: 'pointer' }} />
                      </td>
                      <td>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--text-2)' }}>{o.order_number}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                          {new Date(o.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td>
                        <span style={{
                          padding: '2px 8px', borderRadius: 99, fontSize: 11.5, fontWeight: 600,
                          background: o.status === 'done' ? '#D1FAE5' : o.status === 'confirmed' ? '#DBEAFE' : '#F5F3FF',
                          color: o.status === 'done' ? '#059669' : o.status === 'confirmed' ? '#2563EB' : '#7C3AED',
                        }}>
                          {o.status === 'done' ? 'Selesai' : o.status === 'confirmed' ? 'Diproses' : o.status}
                        </span>
                      </td>
                      <td style={{ fontSize: 12.5, color: 'var(--text-2)', textTransform: 'capitalize' }}>
                        {o.payment_method || '–'}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, fontSize: 13, color: 'var(--text-1)' }}>
                        {formatRp(o.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}