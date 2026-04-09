'use client'
import { useEffect, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { apiFetch } from '@/lib/utils'
import toast from 'react-hot-toast'

const COLS = [
  { status: 'waiting',     label: 'Menunggu',  color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A' },
  { status: 'in_progress', label: 'Diperiksa', color: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE' },
  { status: 'done',        label: 'Selesai',   color: '#10B981', bg: '#F0FDF4', border: '#A7F3D0' },
]

export default function KlinikAntrianPage() {
  const [queues, setQueues] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))

  const fetchQueues = () => {
    setLoading(true)
    apiFetch(`/api/modules/klinik?action=queues&date=${date}`)
      .then(d => setQueues(d.queues || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchQueues() }, [date])

  async function updateStatus(id: string, status: string) {
    try {
      await apiFetch('/api/modules/klinik', {
        method: 'POST',
        body: JSON.stringify({ action: 'update_queue', queue_id: id, status }),
      })
      fetchQueues()
    } catch (err: any) { toast.error(err.message) }
  }

  const totalWaiting = queues.filter(q => q.status === 'waiting').length

  return (
    <AppLayout title="Antrian Pasien" subtitle="Manajemen antrian klinik hari ini"
      actions={
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="date" className="form-input" value={date}
            onChange={e => setDate(e.target.value)}
            style={{ padding: '6px 10px', fontSize: 13, width: 150 }} />
          <button onClick={fetchQueues} className="btn btn-secondary btn-sm">Refresh</button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          {COLS.map(col => {
            const count = queues.filter(q => q.status === col.status).length
            return (
              <div key={col.status} className="stat" style={{ padding: '14px 16px', borderLeft: `3px solid ${col.color}` }}>
                <div className="stat-label">{col.label}</div>
                <div className="stat-value" style={{ fontSize: 28, color: col.color }}>{count}</div>
              </div>
            )
          })}
        </div>

        {/* Kanban */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 300, borderRadius: 12 }} />)}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            {COLS.map(col => (
              <div key={col.status} style={{
                background: col.bg, border: `1px solid ${col.border}`,
                borderRadius: 14, overflow: 'hidden',
              }}>
                <div style={{ padding: '12px 14px', borderBottom: `1px solid ${col.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: col.color }}>{col.label}</span>
                  <span style={{ background: col.color, color: 'white', fontSize: 11, fontWeight: 700, padding: '1px 8px', borderRadius: 99 }}>
                    {queues.filter(q => q.status === col.status).length}
                  </span>
                </div>
                <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 6, minHeight: 120 }}>
                  {queues.filter(q => q.status === col.status).length === 0 ? (
                    <div style={{ padding: '20px 8px', textAlign: 'center', color: col.color, opacity: .5, fontSize: 12 }}>Tidak ada</div>
                  ) : queues.filter(q => q.status === col.status).map((q: any) => (
                    <div key={q.id} style={{
                      background: 'var(--bg-card)', border: '1px solid var(--border)',
                      borderRadius: 10, padding: '10px 12px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                        <span style={{
                          width: 24, height: 24, borderRadius: '50%',
                          background: col.color + '20', color: col.color,
                          fontSize: 11, fontWeight: 800,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>{q.queue_number}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>{q.customer_name || 'Pasien'}</span>
                      </div>
                      {q.doctor_name && <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginBottom: 5 }}>dr. {q.doctor_name}</div>}
                      {q.complaint && <div style={{ fontSize: 11, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 7 }}>{q.complaint}</div>}
                      <div style={{ display: 'flex', gap: 5 }}>
                        {col.status === 'waiting' && (
                          <>
                            <button onClick={() => updateStatus(q.id, 'in_progress')}
                              className="btn btn-sm" style={{ flex: 1, background: col.color, color: 'white', fontSize: 11 }}>Periksa</button>
                            <button onClick={() => updateStatus(q.id, 'skip')}
                              className="btn btn-sm btn-secondary" style={{ fontSize: 11 }}>Skip</button>
                          </>
                        )}
                        {col.status === 'in_progress' && (
                          <button onClick={() => updateStatus(q.id, 'done')}
                            className="btn btn-sm" style={{ flex: 1, background: '#10B981', color: 'white', fontSize: 11 }}>Selesai</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}