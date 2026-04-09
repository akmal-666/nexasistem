'use client'
import { useEffect, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { apiFetch } from '@/lib/utils'
import toast from 'react-hot-toast'

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; next: string | null; nextLabel: string }> = {
  pending:     { label: 'Pending',       color: '#F59E0B', bg: '#FEF3C7', next: 'confirmed',   nextLabel: 'Konfirmasi' },
  confirmed:   { label: 'Dikonfirmasi',  color: '#3B82F6', bg: '#DBEAFE', next: 'in_progress', nextLabel: 'Mulai' },
  in_progress: { label: 'Proses',        color: '#8B5CF6', bg: '#EDE9FE', next: 'done',        nextLabel: 'Selesai' },
  done:        { label: 'Selesai',       color: '#10B981', bg: '#D1FAE5', next: null,           nextLabel: '' },
  cancelled:   { label: 'Batal',         color: '#6B7280', bg: '#F3F4F6', next: null,           nextLabel: '' },
}

export default function SalonBookingPage() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [data, setData] = useState<any>({ bookings: [], staff: [] })
  const [loading, setLoading] = useState(true)

  const fetchData = () => {
    setLoading(true)
    apiFetch(`/api/modules/salon?action=bookings&date=${date}`)
      .then(setData).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [date])

  async function updateStatus(id: string, status: string) {
    try {
      await apiFetch('/api/modules/salon', {
        method: 'POST',
        body: JSON.stringify({ action: 'update_booking_status', booking_id: id, status }),
      })
      toast.success('Status diperbarui')
      fetchData()
    } catch (err: any) { toast.error(err.message) }
  }

  const counts = { total: data.bookings.length, done: data.bookings.filter((b: any) => b.status === 'done').length }

  return (
    <AppLayout title="Booking Salon" subtitle={`${counts.total} booking · ${counts.done} selesai`}
      actions={
        <div style={{ display: 'flex', gap: 8 }}>
          <input type="date" className="form-input" value={date}
            onChange={e => setDate(e.target.value)}
            style={{ padding: '6px 10px', fontSize: 13, width: 150 }} />
          <button className="btn btn-primary btn-sm">+ Booking Baru</button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12 }} />)}
          </div>
        ) : data.bookings.length === 0 ? (
          <div className="card"><div className="empty"><div className="empty-icon">✂️</div><div className="empty-title">Tidak ada booking</div><div className="empty-desc">Belum ada booking untuk {date}</div></div></div>
        ) : (
          data.bookings.map((b: any) => {
            const s = STATUS_CFG[b.status] || STATUS_CFG.pending
            return (
              <div key={b.id} className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: s.color }}>{(b.customer_name || 'P').charAt(0)}</span>
                </div>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 2 }}>{b.customer_name || 'Pelanggan'}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                    {b.booking_time} · {b.staff_name || 'Siapa saja'} · {b.duration_min} mnt
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  <span style={{ background: s.bg, color: s.color, fontSize: 11.5, fontWeight: 600, padding: '3px 10px', borderRadius: 99 }}>{s.label}</span>
                  {s.next && (
                    <button onClick={() => updateStatus(b.id, s.next!)}
                      className="btn btn-sm" style={{ background: s.color, color: 'white' }}>
                      {s.nextLabel}
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </AppLayout>
  )
}