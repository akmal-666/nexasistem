'use client'
import { useEffect, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { apiFetch, formatRp } from '@/lib/utils'

const QUICK = [
  { href: '/fnb/kasir',      label: 'Kasir FnB',   emoji: '🍜', bg: '#FFF7ED', dark: '#2A1500' },
  { href: '/retail/kasir',   label: 'Kasir Retail', emoji: '🏪', bg: '#EFF6FF', dark: '#0A1628' },
  { href: '/klinik/antrian', label: 'Antrian',      emoji: '🏥', bg: '#F0FDF4', dark: '#031A0A' },
  { href: '/laundry/order',  label: 'Laundry',      emoji: '👕', bg: '#F5F3FF', dark: '#120A28' },
  { href: '/apotek/kasir',   label: 'Apotek',       emoji: '💊', bg: '#FFF1F2', dark: '#1F0507' },
  { href: '/salon/booking',  label: 'Booking',      emoji: '✂️', bg: '#FDF4FF', dark: '#1A0520' },
  { href: '/properti/unit',  label: 'Properti',     emoji: '🏠', bg: '#F0FDFA', dark: '#031610' },
  { href: '/fnb/laporan',    label: 'Laporan',      emoji: '📊', bg: '#F8FAFC', dark: '#0A0F18' },
]

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  useEffect(() => {
    apiFetch('/api/modules/fnb?action=stats')
      .then(d => setStats(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const STATS = [
    {
      label: 'Transaksi Hari Ini',
      value: loading ? '–' : String(stats?.stats?.total_orders ?? 0),
      color: 'var(--accent)', emoji: '🛒',
      meta: 'Total order hari ini',
    },
    {
      label: 'Pendapatan',
      value: loading ? '–' : formatRp(stats?.stats?.total_revenue ?? 0),
      color: 'var(--green)', emoji: '💰',
      meta: 'Total penjualan hari ini',
    },
    {
      label: 'Meja Terisi',
      value: loading ? '–' : (stats?.tableStats ? `${stats.tableStats.occupied}/${stats.tableStats.total}` : '0/0'),
      color: 'var(--yellow)', emoji: '🍽️',
      meta: 'Meja aktif sekarang',
    },
    {
      label: 'Selesai',
      value: loading ? '–' : String(stats?.stats?.done_orders ?? 0),
      color: 'var(--blue)', emoji: '✅',
      meta: 'Order selesai hari ini',
    },
  ]

  return (
    <AppLayout title="Dashboard" subtitle={today}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Stats */}
        <div className="grid-4">
          {STATS.map(s => (
            <div key={s.label} className="stat">
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div className="stat-label">{s.label}</div>
                <span style={{ fontSize: 22 }}>{s.emoji}</span>
              </div>
              <div className="stat-value" style={{ color: s.color }}>
                {loading ? <span className="skeleton" style={{ display: 'inline-block', width: 80, height: 28 }} /> : s.value}
              </div>
              <div className="stat-meta">{s.meta}</div>
            </div>
          ))}
        </div>

        {/* Quick access */}
        <div className="card">
          <div className="card-hd">
            <span className="card-hd-title">Akses Cepat</span>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Pintasan ke fitur utama</span>
          </div>
          <div className="card-bd">
            <div className="grid-auto-sm">
              {QUICK.map(item => (
                <a key={item.href} href={item.href}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                    padding: '18px 12px', borderRadius: 12,
                    background: item.bg,
                    border: '1px solid var(--border)',
                    textDecoration: 'none', color: 'var(--text-1)',
                    fontSize: 13, fontWeight: 600, textAlign: 'center',
                    transition: 'transform .15s, box-shadow .15s',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.transform = 'translateY(-3px)'
                    el.style.boxShadow = 'var(--shadow-md)'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.transform = ''
                    el.style.boxShadow = ''
                  }}
                >
                  <span style={{ fontSize: 32, lineHeight: 1 }}>{item.emoji}</span>
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}