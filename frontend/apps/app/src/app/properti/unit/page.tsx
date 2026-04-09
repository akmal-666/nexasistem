'use client'
import { useEffect, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { formatRp, apiFetch } from '@/lib/utils'

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  available:   { label: 'Tersedia',  color: '#10B981', bg: '#F0FDF4', border: '#A7F3D0' },
  occupied:    { label: 'Dihuni',    color: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE' },
  maintenance: { label: 'Perbaikan', color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A' },
}

export default function PropertiUnitPage() {
  const [data, setData] = useState<any>({ units: [], summary: {} })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    apiFetch('/api/modules/properti?action=units')
      .then(setData).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? data.units : data.units.filter((u: any) => u.status === filter)

  return (
    <AppLayout title="Unit & Kamar" subtitle="Manajemen unit properti"
      actions={<button className="btn btn-primary btn-sm">+ Tambah Unit</button>}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
          {[
            { label: 'Total Unit', value: data.summary.total ?? 0, color: 'var(--accent)' },
            { label: 'Dihuni', value: data.summary.occupied ?? 0, color: '#3B82F6' },
            { label: 'Tersedia', value: data.summary.available ?? 0, color: '#10B981' },
            { label: 'Tingkat Hunian', value: data.summary.total ? Math.round((data.summary.occupied / data.summary.total) * 100) + '%' : '0%', color: '#F59E0B' },
          ].map(s => (
            <div key={s.label} className="stat" style={{ padding: '14px 16px' }}>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value" style={{ fontSize: 24, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div style={{ display: 'flex', gap: 6 }}>
          {[{ v: 'all', l: 'Semua' }, { v: 'available', l: 'Tersedia' }, { v: 'occupied', l: 'Dihuni' }, { v: 'maintenance', l: 'Perbaikan' }].map(f => (
            <button key={f.v} onClick={() => setFilter(f.v)}
              className={`btn btn-sm ${filter === f.v ? 'btn-primary' : 'btn-secondary'}`}>{f.l}</button>
          ))}
        </div>

        {/* Units */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px,1fr))', gap: 10 }}>
            {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 150, borderRadius: 12 }} />)}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px,1fr))', gap: 10 }}>
            {filtered.map((u: any) => {
              const s = STATUS_CFG[u.status] || STATUS_CFG.available
              return (
                <div key={u.id} style={{
                  background: s.bg, border: `1.5px solid ${s.border}`,
                  borderRadius: 14, padding: '16px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)' }}>{u.name}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-3)', textTransform: 'capitalize', marginTop: 1 }}>
                        {u.type}{u.floor ? ` · Lt.${u.floor}` : ''}{u.size_m2 ? ` · ${u.size_m2}m²` : ''}
                      </div>
                    </div>
                    <span style={{ background: 'white', color: s.color, border: `1px solid ${s.border}`, fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99 }}>{s.label}</span>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: s.color, marginBottom: 8 }}>
                    {formatRp(u.price)}<span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-3)' }}>/bln</span>
                  </div>
                  {u.tenant_name && (
                    <div style={{ background: 'white', borderRadius: 8, padding: '7px 10px', border: `1px solid ${s.border}` }}>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-1)' }}>{u.tenant_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{u.tenant_phone || '–'}</div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AppLayout>
  )
}