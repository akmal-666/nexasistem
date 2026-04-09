'use client'
import { useEffect, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { apiFetch, formatRp } from '@/lib/utils'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell
} from 'recharts'

// ─── Mock chart data (akan diganti dengan data real dari API) ───
const generateBarData = () => {
  const days = ['Sen','Sel','Rab','Kam','Jum','Sab','Min']
  return days.map(d => ({
    day: d,
    China:  Math.floor(Math.random() * 400) + 100,
    UE:     Math.floor(Math.random() * 300) + 80,
    USA:    Math.floor(Math.random() * 500) + 150,
    Canada: Math.floor(Math.random() * 200) + 50,
    Other:  Math.floor(Math.random() * 150) + 30,
  }))
}

const generateLineData = () => {
  const days = ['Min','Sen','Sel','Rab','Kam','Jum','Sab']
  return days.map((d, i) => ({
    day: d,
    value: Math.floor(Math.random() * 3000) + 1000,
    isToday: i === 2,
  }))
}

// ─── Custom Tooltip ─────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 8, padding: '10px 14px', fontSize: 12,
    }}>
      <div style={{ fontWeight: 700, marginBottom: 6, color: 'var(--text-1)' }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-2)', marginBottom: 2 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: p.fill || p.color, flexShrink: 0 }} />
          <span>{p.name}: <strong style={{ color: 'var(--text-1)' }}>{formatRp(p.value)}</strong></span>
        </div>
      ))}
    </div>
  )
}

const BAR_COLORS = ['#6366F1','#818CF8','#38BDF8','#2DD4BF','#94A3B8']
const PERIODS = ['Weekly','Monthly','Yearly']

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [barData] = useState(generateBarData)
  const [lineData] = useState(generateLineData)
  const [barPeriod, setBarPeriod] = useState('Weekly')
  const [linePeriod, setLinePeriod] = useState('Weekly')
  const [orders, setOrders] = useState<any[]>([])
  const [topProducts, setTopProducts] = useState<any[]>([])
  const [loadingStats, setLoadingStats] = useState(true)
  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  useEffect(() => {
    // Load stats
    Promise.allSettled([
      apiFetch('/api/modules/fnb?action=stats'),
      apiFetch('/api/modules/fnb?action=orders'),
      apiFetch('/api/laporan?type=summary&from=' + new Date().toISOString().slice(0,10) + '&to=' + new Date().toISOString().slice(0,10) + '&module=fnb'),
    ]).then(([s, o, l]) => {
      if (s.status === 'fulfilled') setStats((s as any).value)
      if (o.status === 'fulfilled') setOrders(((o as any).value.orders || []).slice(0, 8))
      if (l.status === 'fulfilled') setTopProducts(((l as any).value.topProducts || []).slice(0, 8))
    }).finally(() => setLoadingStats(false))
  }, [])

  const STATS = [
    { label: 'Sales Overview', value: formatRp(stats?.stats?.total_revenue ?? 0), change: '+12.5%', up: true },
    { label: 'Total Subscriber', value: String(stats?.stats?.total_orders ?? 0), change: '+8.3%', up: true },
    { label: 'Meja Aktif', value: stats?.tableStats ? `${stats.tableStats.occupied}/${stats.tableStats.total}` : '0/0', change: '', up: true },
    { label: 'Order Selesai', value: String(stats?.stats?.done_orders ?? 0), change: '', up: true },
  ]

  return (
    <AppLayout title="Dashboard" subtitle={today}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── Row 1: Stats ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
          {STATS.map(s => (
            <div key={s.label} className="card" style={{ padding: '16px 18px' }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--text-3)', marginBottom: 10 }}>{s.label}</div>
              {loadingStats
                ? <div className="skeleton" style={{ height: 28, width: 100 }} />
                : <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-.03em', lineHeight: 1.1 }}>{s.value}</div>
              }
              {s.change && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6 }}>
                  <span style={{
                    background: s.up ? '#D1FAE5' : '#FEE2E2',
                    color: s.up ? '#059669' : '#DC2626',
                    fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 99,
                  }}>{s.change} {s.up ? '↗' : '↘'}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-3)' }}>vs minggu lalu</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── Row 2: Charts ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 12 }}>

          {/* Bar chart - Sales Overview */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-1)' }}>Sales Overview</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-.03em', marginTop: 2 }}>
                  {formatRp(stats?.stats?.total_revenue ?? 0)}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 2 }}>+ {formatRp(143500)} peningkatan</div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {[{ icon: '≡', label: 'Filter' }, { icon: '⇅', label: 'Sort' }, { icon: '⋯', label: 'More' }].map(b => (
                  <button key={b.label} style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '5px 10px', borderRadius: 7,
                    border: '1px solid var(--border)', background: 'var(--bg)',
                    fontSize: 12, color: 'var(--text-2)', cursor: 'pointer', fontFamily: 'inherit',
                  }}>{b.icon} {b.label !== 'More' ? b.label : ''}</button>
                ))}
              </div>
            </div>
            <div style={{ padding: '16px 18px 12px' }}>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData} barSize={12} barGap={2} barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-3)' }} />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-hover)' }} />
                  {['China','UE','USA','Canada','Other'].map((k, i) => (
                    <Bar key={k} dataKey={k} stackId="a" fill={BAR_COLORS[i]}
                      radius={i === 4 ? [4,4,0,0] : [0,0,0,0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 4 }}>
                {['China','UE','USA','Canada','Other'].map((k, i) => (
                  <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-3)' }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: BAR_COLORS[i] }} />
                    {k}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Line chart - Total Subscriber */}
          <div className="card">
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
                    </svg>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-1)' }}>Total Transaksi</span>
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-.03em' }}>
                    {stats?.stats?.total_orders ?? 0}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5 }}>
                    <span style={{ background: '#D1FAE5', color: '#059669', fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 99 }}>8.3% ↗</span>
                    <span style={{ fontSize: 11, color: 'var(--text-3)' }}>+ 12 peningkatan</span>
                  </div>
                </div>
                <select style={{
                  padding: '5px 28px 5px 10px', borderRadius: 7,
                  border: '1px solid var(--border)', background: 'var(--bg)',
                  fontSize: 12, color: 'var(--text-2)', cursor: 'pointer',
                  fontFamily: 'inherit', outline: 'none',
                  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%239AA0B0' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
                  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center',
                  appearance: 'none',
                }} value={linePeriod} onChange={e => setLinePeriod(e.target.value)}>
                  {PERIODS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div style={{ padding: '16px 18px 12px' }}>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={lineData} barSize={28} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-3)' }} />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} cursor={false} />
                  <Bar dataKey="value" radius={[6,6,0,0]}>
                    {lineData.map((entry, i) => (
                      <Cell key={i} fill={entry.isToday ? '#6366F1' : 'var(--bg-hover)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ── Row 3: Tables ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 12 }}>

          {/* Distribution / Top Products */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-1)' }}>Produk Terlaris</span>
              <select style={{
                padding: '4px 24px 4px 10px', borderRadius: 7,
                border: '1px solid var(--border)', background: 'var(--bg)',
                fontSize: 12, color: 'var(--text-2)', fontFamily: 'inherit', outline: 'none',
                backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%239AA0B0' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
                backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', appearance: 'none',
              }}>
                <option>Monthly</option><option>Weekly</option>
              </select>
            </div>
            <div>
              {topProducts.length === 0 ? (
                <div style={{ padding: '32px 18px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
                  {loadingStats ? 'Memuat...' : 'Belum ada data'}
                </div>
              ) : topProducts.slice(0,5).map((p: any, i: number) => {
                const maxVal = Math.max(...topProducts.map((x: any) => x.total_sales || 0))
                const pct = maxVal > 0 ? (p.total_sales / maxVal) * 100 : 0
                return (
                  <div key={i} style={{ padding: '10px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                      <div style={{ marginTop: 4, height: 4, background: 'var(--bg-hover)', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: pct + '%', background: i < 2 ? '#2DD4BF' : '#6366F1', borderRadius: 99 }} />
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>{formatRp(p.total_sales)}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{p.total_qty}×</div>
                    </div>
                  </div>
                )
              })}
              {topProducts.length === 0 && !loadingStats && (
                <div style={{ padding: '12px 18px' }}>
                  {['Nasi Goreng', 'Mie Ayam', 'Es Teh', 'Sate Ayam', 'Bakso'].map((name, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>{name}</div>
                        <div style={{ marginTop: 4, height: 4, background: 'var(--bg-hover)', borderRadius: 99 }}>
                          <div style={{ height: '100%', width: (90 - i * 15) + '%', background: i < 2 ? '#2DD4BF' : '#6366F1', borderRadius: 99 }} />
                        </div>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{(30 - i * 5)}×</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                  <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
                </svg>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-1)' }}>Transaksi Terbaru</span>
              </div>
              <a href="/fnb/laporan" style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>Lihat Semua</a>
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ padding: '9px 14px' }}>
                      <input type="checkbox" style={{ width: 13, height: 13, accentColor: 'var(--accent)' }} />
                    </th>
                    <th>No. Order</th>
                    <th>Status</th>
                    <th>Metode</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr><td colSpan={5}>
                      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
                        {loadingStats ? 'Memuat...' : 'Belum ada transaksi hari ini'}
                      </div>
                    </td></tr>
                  ) : orders.map((o: any) => (
                    <tr key={o.id}>
                      <td style={{ padding: '10px 14px' }}>
                        <input type="checkbox" style={{ width: 13, height: 13, accentColor: 'var(--accent)' }} />
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: 12.5, color: 'var(--text-2)' }}>{o.order_number}</td>
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