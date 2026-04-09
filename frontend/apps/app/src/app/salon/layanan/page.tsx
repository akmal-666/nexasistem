'use client'
import { useEffect, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { formatRp, apiFetch } from '@/lib/utils'

export default function ProdukPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

  useEffect(() => {
    apiFetch('/api/products?module=salon&limit=200')
      .then(d => setProducts(d.products || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = products.filter(p => !q || p.name.toLowerCase().includes(q.toLowerCase()))

  return (
    <AppLayout title="Layanan Salon">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <input className="form-input" placeholder="Cari..." value={q} onChange={e => setQ(e.target.value)} style={{ flex: 1 }} />
          <button className="btn btn-primary btn-sm">+ Tambah</button>
        </div>
        <div className="card">
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Nama</th><th>Kategori</th><th>Harga</th><th>Stok</th><th>Status</th></tr></thead>
              <tbody>
                {loading ? [...Array(5)].map((_,i) => <tr key={i}><td colSpan={5}><div className="skeleton" style={{height:18,borderRadius:4}} /></td></tr>)
                : filtered.length === 0 ? <tr><td colSpan={5}><div className="empty"><div className="empty-icon">📦</div><div className="empty-desc">Belum ada produk</div></div></td></tr>
                : filtered.map((p: any) => (
                  <tr key={p.id}>
                    <td style={{fontWeight:600}}>{p.name}</td>
                    <td style={{color:'var(--text-3)'}}>{p.category_name || '–'}</td>
                    <td style={{fontWeight:700,color:'var(--accent)'}}>{formatRp(p.price)}</td>
                    <td style={{color:p.stock<=p.min_stock?'#EF4444':'var(--text-1)'}}>{p.stock} {p.unit}</td>
                    <td><span className={`badge ${p.is_active?'badge-green':'badge-gray'}`}>{p.is_active?'Aktif':'Nonaktif'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}