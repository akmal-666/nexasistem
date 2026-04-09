'use client'
import { useEffect, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import Modal from '@/components/ui/Modal'
import { formatRp, apiFetch } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function SupplierPage() {
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '' })
  const [saving, setSaving] = useState(false)

  const fetchData = () => {
    setLoading(true)
    apiFetch('/api/suppliers').then(d => setSuppliers(d.suppliers || [])).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name) return toast.error('Nama wajib diisi')
    setSaving(true)
    try {
      if (editing) {
        await apiFetch(`/api/suppliers/${editing.id}`, { method: 'PATCH', body: JSON.stringify(form) })
        toast.success('Supplier diperbarui')
      } else {
        await apiFetch('/api/suppliers', { method: 'POST', body: JSON.stringify(form) })
        toast.success('Supplier ditambahkan')
      }
      setModal(false)
      fetchData()
    } catch (err: any) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  return (
    <AppLayout title="Supplier" subtitle={`${suppliers.length} supplier aktif`}
      actions={
        <div style={{ display: 'flex', gap: 8 }}>
          <a href="/purchases" className="btn btn-secondary btn-sm">📦 Pembelian</a>
          <button onClick={() => { setEditing(null); setForm({ name: '', phone: '', email: '', address: '' }); setModal(true) }} className="btn btn-primary btn-sm">+ Tambah Supplier</button>
        </div>
      }
    >
      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Nama</th><th>Telepon</th><th>Email</th><th>Alamat</th><th>Aksi</th></tr></thead>
            <tbody>
              {loading ? [...Array(3)].map((_,i) => <tr key={i}><td colSpan={5}><div className="skeleton" style={{height:18,borderRadius:4}}/></td></tr>)
              : suppliers.length === 0 ? <tr><td colSpan={5}><div className="empty"><div className="empty-icon">🏭</div><div className="empty-title">Belum ada supplier</div></div></td></tr>
              : suppliers.map((s: any) => (
                <tr key={s.id}>
                  <td style={{fontWeight:600}}>{s.name}</td>
                  <td style={{color:'var(--text-2)'}}>{s.phone || '–'}</td>
                  <td style={{color:'var(--text-2)'}}>{s.email || '–'}</td>
                  <td style={{color:'var(--text-3)'}}>{s.address || '–'}</td>
                  <td>
                    <button onClick={() => { setEditing(s); setForm({name:s.name,phone:s.phone||'',email:s.email||'',address:s.address||''}); setModal(true) }} className="btn btn-secondary btn-sm">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Supplier' : 'Tambah Supplier'}>
        <form onSubmit={handleSave} style={{padding:20,display:'flex',flexDirection:'column',gap:14}}>
          <div className="form-group"><label className="form-label">Nama Supplier *</label><input className="form-input" value={form.name} onChange={e => setForm(p => ({...p, name:e.target.value}))} required autoFocus /></div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div className="form-group"><label className="form-label">Telepon</label><input className="form-input" value={form.phone} onChange={e => setForm(p => ({...p,phone:e.target.value}))} /></div>
            <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={form.email} onChange={e => setForm(p => ({...p,email:e.target.value}))} /></div>
          </div>
          <div className="form-group"><label className="form-label">Alamat</label><textarea className="form-input" rows={2} value={form.address} onChange={e => setForm(p => ({...p,address:e.target.value}))} style={{resize:'vertical'}} /></div>
          <div style={{display:'flex',gap:8}}>
            <button type="button" onClick={() => setModal(false)} className="btn btn-secondary">Batal</button>
            <button type="submit" disabled={saving} className="btn btn-primary" style={{flex:1}}>{saving ? 'Menyimpan...' : editing ? 'Simpan' : 'Tambah'}</button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  )
}