'use client'
import { useEffect, useState, useCallback } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import Modal from '@/components/ui/Modal'
import ProductForm from '@/components/ui/ProductForm'
import { formatRp, apiFetch } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function FnbProdukPage() {
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [modal, setModal] = useState<{ open: boolean; item?: any }>({ open: false })
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [pd, cd] = await Promise.all([
        apiFetch('/api/products?module=fnb&limit=200'),
        apiFetch('/api/categories?module=fnb'),
      ])
      setProducts(pd.products || [])
      setCategories(cd.categories || [])
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function deleteProduct(id: string) {
    if (!confirm('Hapus produk ini?')) return
    setDeleting(id)
    try {
      await apiFetch(`/api/products/${id}`, { method: 'DELETE' })
      toast.success('Produk dihapus')
      fetchData()
    } catch (err: any) { toast.error(err.message) }
    finally { setDeleting(null) }
  }

  const filtered = products.filter(p => {
    const mQ = !q || p.name.toLowerCase().includes(q.toLowerCase()) || (p.sku || '').includes(q)
    const mC = !catFilter || p.category_id === catFilter
    return mQ && mC
  })

  return (
    <AppLayout title="Produk FnB" subtitle={`${products.length} produk`}
      actions={<button onClick={() => setModal({ open: true })} className="btn btn-primary btn-sm">+ Tambah Produk</button>}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Filter */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input className="form-input" placeholder="Cari produk atau SKU..." value={q}
            onChange={e => setQ(e.target.value)} style={{ flex: 1, minWidth: 200 }} />
          <select className="form-input form-select" value={catFilter}
            onChange={e => setCatFilter(e.target.value)} style={{ width: 180 }}>
            <option value="">Semua Kategori</option>
            {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="card">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>SKU</th>
                  <th>Kategori</th>
                  <th>Harga Jual</th>
                  <th>Modal</th>
                  <th>Stok</th>
                  <th>Status</th>
                  <th style={{ width: 100 }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? [...Array(5)].map((_, i) => (
                  <tr key={i}><td colSpan={8}><div className="skeleton" style={{ height: 18, borderRadius: 4 }} /></td></tr>
                )) : filtered.length === 0 ? (
                  <tr><td colSpan={8}>
                    <div className="empty"><div className="empty-icon">🍜</div><div className="empty-title">Belum ada produk</div></div>
                  </td></tr>
                ) : filtered.map((p: any) => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.name}</div>
                      {p.description && <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>{p.description.slice(0, 40)}</div>}
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-3)' }}>{p.sku || '–'}</td>
                    <td style={{ color: 'var(--text-3)' }}>{p.category_name || '–'}</td>
                    <td style={{ fontWeight: 700, color: 'var(--accent)' }}>{formatRp(p.price)}</td>
                    <td style={{ color: 'var(--text-3)' }}>{formatRp(p.cost_price)}</td>
                    <td>
                      <span style={{ fontWeight: 600, color: p.stock <= p.min_stock ? '#EF4444' : 'var(--text-1)' }}>
                        {p.stock} {p.unit}
                      </span>
                    </td>
                    <td><span className={`badge ${p.is_active ? 'badge-green' : 'badge-gray'}`}>{p.is_active ? 'Aktif' : 'Nonaktif'}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => setModal({ open: true, item: p })}
                          className="btn btn-secondary btn-sm">Edit</button>
                        <button onClick={() => deleteProduct(p.id)} disabled={deleting === p.id}
                          className="btn btn-sm" style={{ background: 'var(--red-bg)', color: 'var(--red)', border: 'none' }}>
                          {deleting === p.id ? '...' : 'Hapus'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal open={modal.open} onClose={() => setModal({ open: false })}
        title={modal.item ? 'Edit Produk' : 'Tambah Produk FnB'}>
        <ProductForm module="fnb" initial={modal.item} categories={categories}
          onSave={() => { setModal({ open: false }); fetchData() }}
          onClose={() => setModal({ open: false })} />
      </Modal>
    </AppLayout>
  )
}