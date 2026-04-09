'use client'
import AppLayout from '@/components/layout/AppLayout'
import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/utils'
import toast from 'react-hot-toast'

const STATUS_COLS = [
  { status: 'waiting', label: 'Menunggu', color: 'bg-yellow-50 border-yellow-200' },
  { status: 'in_progress', label: 'Diperiksa', color: 'bg-blue-50 border-blue-200' },
  { status: 'done', label: 'Selesai', color: 'bg-green-50 border-green-200' },
]

export default function KlinikAntrianPage() {
  const [queues, setQueues] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))

  const fetchQueues = () => apiFetch(`/api/modules/klinik?action=queues&date=${date}`).then(d => setQueues(d.queues || [])).finally(() => setLoading(false))
  useEffect(() => { fetchQueues() }, [date])

  async function updateStatus(id: string, status: string) {
    try {
      await apiFetch('/api/modules/klinik', { method: 'POST', body: JSON.stringify({ action: 'update_queue', queue_id: id, status }) })
      fetchQueues()
    } catch (err: any) { toast.error(err.message) }
  }

  return (
    <AppLayout title="Antrian Pasien" subtitle="Manajemen antrian klinik">
      <div>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Antrian Pasien</h1>
            <p className="text-sm text-gray-500">{queues.length} pasien</p>
          </div>
          <div className="flex items-center gap-3">
            <input type="date" className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
              value={date} onChange={e => setDate(e.target.value)} />
          </div>
        </div>

        {loading ? <div className="text-center py-12 text-gray-400">Memuat...</div> : (
          <div className="grid md:grid-cols-3 gap-4">
            {STATUS_COLS.map(col => (
              <div key={col.status} className={`rounded-xl border-2 p-4 ${col.color}`}>
                <div className="font-semibold text-gray-900 mb-3">{col.label} ({queues.filter(q => q.status === col.status).length})</div>
                <div className="space-y-2">
                  {queues.filter(q => q.status === col.status).map((q: any) => (
                    <div key={q.id} className="bg-white rounded-lg p-3 border border-gray-100">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center flex-shrink-0">{q.queue_number}</span>
                        <span className="font-medium text-sm text-gray-900">{q.customer_name || 'Pasien'}</span>
                      </div>
                      {q.doctor_name && <div className="text-xs text-gray-500">dr. {q.doctor_name}</div>}
                      {q.complaint && <div className="text-xs text-gray-400 mt-0.5 truncate">{q.complaint}</div>}
                      <div className="flex gap-1 mt-2">
                        {col.status === 'waiting' && (
                          <button onClick={() => updateStatus(q.id, 'called')}
                            className="flex-1 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium hover:bg-blue-100">Panggil</button>
                        )}
                        {col.status === 'waiting' && (
                          <button onClick={() => updateStatus(q.id, 'in_progress')}
                            className="flex-1 py-1 bg-indigo-50 text-indigo-700 rounded text-xs font-medium hover:bg-indigo-100">Periksa</button>
                        )}
                        {col.status === 'in_progress' && (
                          <button onClick={() => updateStatus(q.id, 'done')}
                            className="flex-1 py-1 bg-green-50 text-green-700 rounded text-xs font-medium hover:bg-green-100">Selesai</button>
                        )}
                        {col.status === 'waiting' && (
                          <button onClick={() => updateStatus(q.id, 'skip')}
                            className="px-2 py-1 bg-gray-50 text-gray-500 rounded text-xs hover:bg-gray-100">Skip</button>
                        )}
                      </div>
                    </div>
                  ))}
                  {queues.filter(q => q.status === col.status).length === 0 && (
                    <div className="text-center py-6 text-gray-400 text-xs">Tidak ada</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}