'use client'
import { useEffect, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { apiFetch } from '@/lib/utils'
import toast from 'react-hot-toast'

const STATUS: Record<string, { label: string; bg: string; dot: string; text: string }> = {
  available:  { label: 'Tersedia',   bg: '#F0FDF4', dot: '#22C55E', text: '#15803D' },
  occupied:   { label: 'Terisi',     bg: '#EFF6FF', dot: '#3B82F6', text: '#1D4ED8' },
  reserved:   { label: 'Reservasi',  bg: '#F5F3FF', dot: '#8B5CF6', text: '#6D28D9' },
  closed:     { label: 'Tutup',      bg: 'var(--bg)', dot: 'var(--text-3)', text: 'var(--text-3)' },
}

export default function FnbMejaPage() {
  const [tables, setTables] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [filter, setFilter] = useState('all')

  const fetchTables = () => {
    apiFetch('/api/modules/fnb?action=tables')
      .then(d => setTables(d.tables || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchTables() }, [])

  async function addTable(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setAdding(true)
    try {
      await apiFetch('/api/modules/fnb', {
        method: 'POST',
        body: JSON.stringify({ action: 'add_table', name: newName }),
      })
      toast.success('Meja ditambahkan')
      setNewName('')
      fetchTables()
    } catch (err: any) { toast.error(err.message) }
    finally { setAdding(false) }
  }

  async function kosongkan(id: string) {
    try {
      await apiFetch('/api/modules/fnb', {
        method: 'POST',
        body: JSON.stringify({ action: 'update_table_status', table_id: id, status: 'available' }),
      })
      fetchTables()
    } catch (err: any) { toast.error(err.message) }
  }

  const filtered = filter === 'all' ? tables : tables.filter(t => t.status === filter)
  const counts = { all: tables.length, available: tables.filter(t => t.status === 'available').length, occupied: tables.filter(t => t.status === 'occupied').length }

  return (
    <AppLayout title="Manajemen Meja" subtitle="Status dan pengelolaan meja restoran"
      actions={
        <a href="/fnb/kasir" className="btn btn-primary btn-sm">+ Transaksi Baru</a>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          {[
            { label: 'Total Meja', value: counts.all, color: 'var(--accent)' },
            { label: 'Tersedia', value: counts.available, color: '#22C55E' },
            { label: 'Terisi', value: counts.occupied, color: '#3B82F6' },
          ].map(s => (
            <div key={s.label} className="stat" style={{ padding: '14px 16px' }}>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value" style={{ fontSize: 28, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Add + Filter */}
        <div className="card" style={{ padding: '14px 18px' }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <form onSubmit={addTable} style={{ display: 'flex', gap: 8, flex: 1, minWidth: 240 }}>
              <input className="form-input" placeholder="Nama meja baru (contoh: Meja 5)"
                value={newName} onChange={e => setNewName(e.target.value)}
                style={{ flex: 1 }} />
              <button type="submit" disabled={adding} className="btn btn-primary">
                {adding ? '...' : '+ Tambah'}
              </button>
            </form>
            <div style={{ display: 'flex', gap: 6 }}>
              {[{ v: 'all', l: 'Semua' }, { v: 'available', l: 'Tersedia' }, { v: 'occupied', l: 'Terisi' }].map(f => (
                <button key={f.v} onClick={() => setFilter(f.v)}
                  className={`btn btn-sm ${filter === f.v ? 'btn-primary' : 'btn-secondary'}`}>
                  {f.l}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tables grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px,1fr))', gap: 10 }}>
            {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 12 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card"><div className="empty"><div className="empty-icon">🍽️</div><div className="empty-title">Belum ada meja</div><div className="empty-desc">Tambah meja di atas</div></div></div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px,1fr))', gap: 10 }}>
            {filtered.map((t: any) => {
              const s = STATUS[t.status] || STATUS.available
              return (
                <div key={t.id} style={{
                  background: s.bg, border: '1.5px solid var(--border)',
                  borderRadius: 14, padding: '16px 14px',
                  transition: 'box-shadow .15s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: s.text }}>{t.capacity} kursi</span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', marginBottom: 4 }}>{t.name}</div>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: s.text, marginBottom: t.status === 'occupied' ? 10 : 0 }}>{s.label}</div>
                  {t.status === 'occupied' && (
                    <button onClick={() => kosongkan(t.id)} className="btn btn-sm btn-secondary"
                      style={{ width: '100%', marginTop: 4, fontSize: 11 }}>
                      Kosongkan
                    </button>
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