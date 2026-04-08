'use client'
import { useEffect, useState } from 'react'
import { formatRp, apiFetch } from '@/lib/utils'
import toast from 'react-hot-toast'

const STATUS_LABELS: Record<string, string> = {
  received: 'Diterima', washing: 'Mencuci', drying: 'Pengeringan',
  ironing: 'Setrika', folding: 'Melipat', ready: 'Siap', delivered: 'Selesai'
}
const STATUS_COLORS: Record<string, string> = {
  received:'badge-blue', washing:'badge-yellow', drying:'badge-yellow',
  ironing:'badge-purple', folding:'badge-purple', ready:'badge-green', delivered:'badge-gray'
}
const NEXT_STATUS: Record<string, string> = {
  received:'washing', washing:'drying', drying:'ironing',
  ironing:'folding', folding:'ready', ready:'delivered'
}

export default function LaundryOrderPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  const fetchOrders = () => apiFetch(`/api/modules/laundry?action=orders${filter ? '&status='+filter : ''}`).then(d => setOrders(d.orders || [])).finally(() => setLoading(false))

  useEffect(() => { fetchOrders() }, [filter])

  async function updateStatus(id: string, status: string) {
    try {
      await apiFetch('/api/modules/laundry', { method: 'POST', body: JSON.stringify({ action: 'update_status', laundry_id: id, status }) })
      toast.success(`Status: ${STATUS_LABELS[status]}`)
      fetchOrders()
    } catch (err: any) { toast.error(err.message) }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Order Laundry</h1>
            <p className="text-sm text-gray-500">{orders.length} order</p>
          </div>
          <a href="/laundry/order/baru" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">+ Order Baru</a>
        </div>

        <div className="flex gap-2 flex-wrap">
          {[{ v: '', l: 'Semua' }, ...Object.entries(STATUS_LABELS).map(([v, l]) => ({ v, l }))].map(s => (
            <button key={s.v} onClick={() => setFilter(s.v)}
              className={`px-3 py-1.5 text-xs rounded-lg border font-medium transition-colors ${filter === s.v ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-gray-200 text-gray-600'}`}>
              {s.l}
            </button>
          ))}
        </div>

        {loading ? <div className="text-center py-12 text-gray-400">Memuat...</div> : (
          <div className="space-y-3">
            {orders.length === 0 ? <div className="text-center py-12 bg-white rounded-xl border border-gray-100 text-gray-400">Tidak ada order</div> : (
              orders.map((o: any) => (
                <div key={o.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900">{o.customer_name || 'Pelanggan'}</div>
                    <div className="text-sm text-gray-500">{o.order_number} · {o.customer_phone || '-'}</div>
                    {o.notes && <div className="text-xs text-gray-400 mt-0.5">{o.notes}</div>}
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-indigo-600">{formatRp(o.total)}</div>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      STATUS_COLORS[o.status] === 'badge-blue' ? 'bg-blue-100 text-blue-700' :
                      STATUS_COLORS[o.status] === 'badge-yellow' ? 'bg-yellow-100 text-yellow-700' :
                      STATUS_COLORS[o.status] === 'badge-green' ? 'bg-green-100 text-green-700' :
                      STATUS_COLORS[o.status] === 'badge-purple' ? 'bg-purple-100 text-purple-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>{STATUS_LABELS[o.status]}</span>
                  </div>
                  {NEXT_STATUS[o.status] && (
                    <button onClick={() => updateStatus(o.id, NEXT_STATUS[o.status])}
                      className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-medium hover:bg-indigo-100">
                      → {STATUS_LABELS[NEXT_STATUS[o.status]]}
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
