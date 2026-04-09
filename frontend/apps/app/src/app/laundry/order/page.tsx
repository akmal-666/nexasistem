'use client'
import { useEffect, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { formatRp, apiFetch } from '@/lib/utils'
import toast from 'react-hot-toast'

const STATUSES: Record<string, { label: string; color: string; bg: string; next: string | null; nextLabel: string }> = {
  received:   { label: 'Diterima',    color: '#3B82F6', bg: '#DBEAFE', next: 'washing',  nextLabel: 'Mulai Cuci' },
  washing:    { label: 'Mencuci',     color: '#F59E0B', bg: '#FEF3C7', next: 'drying',   nextLabel: 'Keringkan' },
  drying:     { label: 'Pengeringan', color: '#F59E0B', bg: '#FEF3C7', next: 'ironing',  nextLabel: 'Setrika' },
  ironing:    { label: 'Setrika',     color: '#8B5CF6', bg: '#EDE9FE', next: 'folding',  nextLabel: 'Lipat' },
  folding:    { label: 'Melipat',     color: '#8B5CF6', bg: '#EDE9FE', next: 'ready',    nextLabel: 'Siap Ambil' },
  ready:      { label: 'Siap',        color: '#10B981', bg: '#D1FAE5', next: 'delivered', nextLabel: 'Selesai' },
  delivered:  { label: 'Selesai',     color: '#6B7280', bg: '#F3F4F6', next: null,       nextLabel: '' },
}

export default function LaundryOrderPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  const fetchOrders = () => {
    setLoading(true)
    apiFetch(`/api/modules/laundry?action=orders${filter ? '&status=' + filter : ''}`)
      .then(d => setOrders(d.orders || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchOrders() }, [filter])

  async function updateStatus(id: string, status: string) {
    try {
      await apiFetch('/api/modules/laundry', {
        method: 'POST',
        body: JSON.stringify({ action: 'update_status', laundry_id: id, status }),
      })
      toast.success('Status diperbarui')
      fetchOrders()
    } catch (err: any) { toast.error(err.message) }
  }

  return (
    <AppLayout title="Order Laundry" subtitle={`${orders.length} order aktif`}
      actions={<button className="btn btn-primary btn-sm">+ Order Baru</button>}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Filter */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={() => setFilter('')} className={`btn btn-sm ${filter === '' ? 'btn-primary' : 'btn-secondary'}`}>Semua</button>
          {Object.entries(STATUSES).map(([v, s]) => (
            <button key={v} onClick={() => setFilter(v)}
              className={`btn btn-sm ${filter === v ? 'btn-primary' : 'btn-secondary'}`}>
              {s.label}
            </button>
          ))}
        </div>

        {/* Orders */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 76, borderRadius: 12 }} />)}
          </div>
        ) : orders.length === 0 ? (
          <div className="card"><div className="empty"><div className="empty-icon">👕</div><div className="empty-title">Tidak ada order</div><div className="empty-desc">Belum ada order laundry</div></div></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {orders.map((o: any) => {
              const s = STATUSES[o.status] || STATUSES.received
              return (
                <div key={o.id} className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>{o.customer_name || 'Pelanggan'}</span>
                      <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-3)' }}>{o.order_number}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{o.customer_phone || '–'}{o.notes ? ' · ' + o.notes : ''}</div>
                  </div>
                  <div style={{ display: 'flex', align: 'center', gap: 10, flexShrink: 0 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>{formatRp(o.total)}</div>
                      <span style={{ background: s.bg, color: s.color, fontSize: 11.5, fontWeight: 600, padding: '2px 8px', borderRadius: 99 }}>{s.label}</span>
                    </div>
                    {s.next && (
                      <button onClick={() => updateStatus(o.id, s.next!)}
                        className="btn btn-sm" style={{ background: s.color, color: 'white', flexShrink: 0 }}>
                        {s.nextLabel}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AppLayout>
  )
}