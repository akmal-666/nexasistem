'use client'
import { useEffect, useState, useCallback } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import Modal from '@/components/ui/Modal'
import { formatRp, apiFetch } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function SupplierPage() {
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [purchases, setPurchases] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'supplier'|'purchase'>('supplier')
  const [modal, setModal] = useState<{ open: boolean; type: string; item?: any }>({ open: false, type: '' })
  const [form, setForm] = useState<any>({})
  const [saving, setSaving] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [s, p] = await Promise.all([
        apiFetch('/api/suppliers'),
        apiFetch('/api/purchases'),
      ])
      setSuppliers(s.suppliers || [])
      setPurchases(p.purchases || [])
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function saveSupplier(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name) return toast.error('Nama wajib diisi')
    setSaving(true)
    try {
      await apiFetch('/api/suppliers', { method: 'POST', body: JSON.stringify(form) })
      toast.success('Supplier ditambahkan')
      setModal({ open: false, type: '' })
      fetchData()
    } catch (err: any) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  return (
    <AppLayout title="Supplier & Pembelian"
      actions={
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => { setForm({}); setModal({ open: true, type: 'supplier' }) }}
            className="btn btn-secondary btn-sm">+ Supplier</button>
          <button onClick={() => { setForm({ items: [{ name: '', qty: 1, cost_price: 0 }] }); setModal({ open: true, type: 'purchase' }) }}
            className="btn btn-primary btn-sm">+ Pembelian</button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Tab */}
        <div style={{ display: 'flex', gap: 0, background: 'var(--bg-hover)', borderRadius: 10, padding: 3, width: 'fit-content' }}>
          {[{ v: 'supplier', l: 'Supplier' }, { v: 'purchase', l: 'Riwayat Pembelian' }].map(t => (
            <button key={t.v} onClick={() => setTab(t.v as any)} style={{
              padding: '6px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: tab === t.v ? 'var(--bg-card)' : 'transparent',
              color: tab === t.v ? 'var(--text-1)' : 'var(--text-3)',
              border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: tab === t.v ? 'var(--shadow-sm)' : 'none',
              transition: 'all .15s',
            }}>{t.l}</button>
          ))}
        </div>

        {tab === 'supplier' ? (
          <div className="card">
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Nama</th><th>Telepon</th><th>Email</th><th>Alamat</th><th>Status</th></tr></thead>
                <tbody>
                  {loading ? [...Array(4)].map((_, i) => <tr key={i}><td colSpan={5}><div className="skeleton" style={{ height: 18, borderRadius: 4 }} /></td></tr>)
                  : suppliers.length === 0 ? (
                    <tr><td colSpan={5}><div className="empty"><div className="empty-icon">🏭</div><div className="empty-title">Belum ada supplier</div></div></td></tr>
                  ) : suppliers.map((s: any) => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 600 }}>{s.name}</td>
                      <td style={{ color: 'var(--text-2)' }}>{s.phone || '–'}</td>
                      <td style={{ color: 'var(--text-3)', fontSize: 12 }}>{s.email || '–'}</td>
                      <td style={{ color: 'var(--text-3)' }}>{s.address || '–'}</td>
                      <td><span className={`badge ${s.is_active ? 'badge-green' : 'badge-gray'}`}>{s.is_active ? 'Aktif' : 'Nonaktif'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>No. PO</th><th>Supplier</th><th>Total</th><th>Status</th><th>Tanggal</th></tr></thead>
                <tbody>
                  {loading ? [...Array(4)].map((_, i) => <tr key={i}><td colSpan={5}><div className="skeleton" style={{ height: 18, borderRadius: 4 }} /></td></tr>)
                  : purchases.length === 0 ? (
                    <tr><td colSpan={5}><div className="empty"><div className="empty-icon">📋</div><div className="empty-title">Belum ada pembelian</div></div></td></tr>
                  ) : purchases.map((p: any) => (
                    <tr key={p.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{p.purchase_number}</td>
                      <td>{p.supplier_name || '–'}</td>
                      <td style={{ fontWeight: 700, color: 'var(--accent)' }}>{formatRp(p.total)}</td>
                      <td><span className={`badge ${p.status === 'received' ? 'badge-green' : p.status === 'ordered' ? 'badge-blue' : 'badge-gray'}`}>{p.status}</span></td>
                      <td style={{ color: 'var(--text-3)', fontSize: 12 }}>{new Date(p.created_at).toLocaleDateString('id-ID')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add Supplier Modal */}
      <Modal open={modal.open && modal.type === 'supplier'} onClose={() => setModal({ open: false, type: '' })} title="Tambah Supplier" size="sm">
        <form onSubmit={saveSupplier} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { label: 'Nama Supplier *', key: 'name', type: 'text' },
            { label: 'No. Telepon', key: 'phone', type: 'tel' },
            { label: 'Email', key: 'email', type: 'email' },
          ].map(f => (
            <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>{f.label}</label>
              <input type={f.type} className="form-input" value={form[f.key] || ''}
                onChange={e => setForm((p: any) => ({ ...p, [f.key]: e.target.value }))}
                required={f.label.includes('*')} />
            </div>
          ))}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>Alamat</label>
            <input className="form-input" value={form.address || ''}
              onChange={e => setForm((p: any) => ({ ...p, address: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button type="button" onClick={() => setModal({ open: false, type: '' })} className="btn btn-secondary" style={{ flex: 1 }}>Batal</button>
            <button type="submit" disabled={saving} className="btn btn-primary" style={{ flex: 2 }}>
              {saving ? 'Menyimpan...' : 'Tambah Supplier'}
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  )
}