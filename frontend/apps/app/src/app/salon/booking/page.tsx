'use client'
import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/utils'
import toast from 'react-hot-toast'

const STATUS_CFG: Record<string, { label: string; next: string | null; color: string }> = {
  pending:     { label: 'Pending',       next: 'confirmed',   color: 'bg-yellow-100 text-yellow-700' },
  confirmed:   { label: 'Dikonfirmasi',  next: 'in_progress', color: 'bg-blue-100 text-blue-700' },
  in_progress: { label: 'Proses',        next: 'done',        color: 'bg-purple-100 text-purple-700' },
  done:        { label: 'Selesai',       next: null,          color: 'bg-green-100 text-green-700' },
  cancelled:   { label: 'Batal',         next: null,          color: 'bg-gray-100 text-gray-600' },
}

export default function SalonBookingPage() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [data, setData] = useState<any>({ bookings: [], staff: [], services: [] })
  const [loading, setLoading] = useState(true)

  const fetchData = () => {
    setLoading(true)
    apiFetch(`/api/modules/salon?action=bookings&date=${date}`).then(setData).finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [date])

  async function updateStatus(id: string, status: string) {
    try {
      await apiFetch('/api/modules/salon', { method: 'POST', body: JSON.stringify({ action: 'update_booking_status', booking_id: id, status }) })
      toast.success('Status diperbarui')
      fetchData()
    } catch (err: any) { toast.error(err.message) }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Booking Salon</h1>
            <p className="text-sm text-gray-500">{data.bookings.length} booking</p>
          </div>
          <input type="date" className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
            value={date} onChange={e => setDate(e.target.value)} />
        </div>

        {loading ? <div className="text-center py-12 text-gray-400">Memuat...</div> : (
          <div className="space-y-3">
            {data.bookings.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-100 text-gray-400">Tidak ada booking hari ini</div>
            ) : data.bookings.map((b: any) => {
              const cfg = STATUS_CFG[b.status] || STATUS_CFG.pending
              return (
                <div key={b.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4 flex-wrap">
                  <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-pink-700 font-bold">{(b.customer_name || 'P').charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900">{b.customer_name || 'Pelanggan'}</div>
                    <div className="text-sm text-gray-500">{b.booking_time} · {b.staff_name || 'Siapa saja'} · {b.duration_min} mnt</div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                  {cfg.next && (
                    <button onClick={() => updateStatus(b.id, cfg.next!)}
                      className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-medium hover:bg-indigo-100">
                      → {STATUS_CFG[cfg.next]?.label}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
