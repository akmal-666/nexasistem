'use client'
import { useEffect, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { apiFetch, formatRp } from '@/lib/utils'

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    // Load stats dari semua modul
    Promise.allSettled([
      apiFetch('/api/modules/fnb?action=stats'),
    ]).then(([fnb]) => {
      setStats({
        fnb: fnb.status === 'fulfilled' ? (fnb as any).value : null,
      })
    })
  }, [])

  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <AppLayout title="Dashboard" subtitle={today}>
      <div style={{ display: 'grid', gap: 16 }}>
        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          {[
            { label: 'Transaksi Hari Ini', value: stats?.fnb?.stats?.total_orders ?? '–', icon: '🛒', color: '#6366F1' },
            { label: 'Pendapatan', value: stats?.fnb?.stats?.total_revenue ? formatRp(stats.fnb.stats.total_revenue) : '–', icon: '💰', color: '#10B981' },
            { label: 'Meja Terisi', value: stats?.fnb?.tableStats ? `${stats.fnb.tableStats.occupied}/${stats.fnb.tableStats.total}` : '–', icon: '🍽️', color: '#F59E0B' },
            { label: 'Selesai', value: stats?.fnb?.stats?.done_orders ?? '–', icon: '✅', color: '#3B82F6' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span className="stat-label">{s.label}</span>
                <span style={{ fontSize: 20 }}>{s.icon}</span>
              </div>
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Quick access */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Akses Cepat</span>
          </div>
          <div className="card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
            {[
              { href: '/fnb/kasir', label: 'Kasir FnB', emoji: '🍜', bg: '#FFF7ED' },
              { href: '/retail/kasir', label: 'Kasir Retail', emoji: '🏪', bg: '#EFF6FF' },
              { href: '/klinik/antrian', label: 'Antrian', emoji: '🏥', bg: '#F0FDF4' },
              { href: '/laundry/order', label: 'Laundry', emoji: '👕', bg: '#F5F3FF' },
              { href: '/apotek/kasir', label: 'Apotek', emoji: '💊', bg: '#FFF1F2' },
              { href: '/salon/booking', label: 'Booking', emoji: '✂️', bg: '#FDF4FF' },
              { href: '/properti/unit', label: 'Properti', emoji: '🏠', bg: '#F0FDFA' },
              { href: '/fnb/laporan', label: 'Laporan', emoji: '📊', bg: '#F8FAFC' },
            ].map(item => (
              <a key={item.href} href={item.href} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                padding: '16px 12px', borderRadius: 12,
                background: item.bg, border: '1px solid var(--border)',
                textDecoration: 'none', color: 'var(--text-primary)',
                transition: 'transform .15s, box-shadow .15s',
                fontSize: 13, fontWeight: 600, textAlign: 'center',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '' }}
              >
                <span style={{ fontSize: 28 }}>{item.emoji}</span>
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
