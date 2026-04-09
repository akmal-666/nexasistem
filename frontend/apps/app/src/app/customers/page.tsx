'use client'
import { useEffect, useState, useCallback } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import Modal from '@/components/ui/Modal'
import { apiFetch } from '@/lib/utils'
import toast from 'react-hot-toast'

interface CustomerForm {
  name: string; email: string; phone: string
  address: string; city: string; dob: string; gender: string; notes: string
}

const DEFAULT: CustomerForm = { name:'', email:'', phone:'', address:'', city:'', dob:'', gender:'', notes:'' }

export default function CustomerPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [modal, setModal] = useState<{ open: boolean; item?: any }>({ open: false })
  const [form, setForm] = useState<CustomerForm>(DEFAULT)
  const [saving, setSaving] = useState(false)

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    try {
      const d = await apiFetch('/api/customers?limit=200')
      setCustomers(d.customers || [])
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchCustomers() }, [fetchCustomers])

  function openModal(item?: any) {
    setForm(item ? { name:item.name||'', email:item.email||'', phone:item.phone||'', address:item.address||'', city:item.city||'', dob:item.dob||'', gender:item.gender||'', notes:item.notes||'' } : DEFAULT)
    setModal({ open: true, item })
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name) return toast.error('Nama wajib diisi')
    setSaving(true)
    try {
      if (modal.item?.id) {
        await apiFetch(`/api/customers/${modal.item.id}`, { method: 'PATCH', body: JSON.stringify(form) })
        toast.success('Customer diperbarui')
      } else {
        await apiFetch('/api/customers', { method: 'POST', body: JSON.stringify(form) })
        toast.success('Customer ditambahkan')
      }
      setModal({ open: false })
      fetchCustomers()
    } catch (err: any) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  const set = (k: keyof CustomerForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  const filtered = customers.filter(c => !q ||
    c.name?.toLowerCase().includes(q.toLowerCase()) ||
    c.phone?.includes(q) || c.email?.toLowerCase().includes(q.toLowerCase()))

  return (
    <AppLayout title="Manajemen Customer" subtitle={`${customers.length} customer terdaftar`}
      actions={<button onClick={() => openModal()} className="btn btn-primary btn-sm">+ Tambah Customer</button>}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <input className="form-input" placeholder="Cari nama, telepon, atau email..."
          value={q} onChange={e => setQ(e.target.value)} />

        <div className="card">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Telepon</th>
                  <th>Email</th>
                  <th>Kota</th>
                  <th>Poin</th>
                  <th style={{ width: 80 }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? [...Array(5)].map((_, i) => (
                  <tr key={i}><td colSpan={6}><div className="skeleton" style={{ height: 18, borderRadius: 4 }} /></td></tr>
                )) : filtered.length === 0 ? (
                  <tr><td colSpan={6}>
                    <div className="empty"><div className="empty-icon">👥</div><div className="empty-title">Belum ada customer</div></div>
                  </td></tr>
                ) : filtered.map((c: any) => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 600 }}>{c.name}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-2)' }}>{c.phone || '–'}</td>
                    <td style={{ color: 'var(--text-3)', fontSize: 12 }}>{c.email || '–'}</td>
                    <td style={{ color: 'var(--text-3)' }}>{c.city || '–'}</td>
                    <td><span className="badge badge-accent">{c.loyalty_point || 0} poin</span></td>
                    <td>
                      <button onClick={() => openModal(c)} className="btn btn-secondary btn-sm">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal open={modal.open} onClose={() => setModal({ open: false })}
        title={modal.item ? 'Edit Customer' : 'Tambah Customer'}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'Nama Lengkap *', key: 'name', type: 'text' },
              { label: 'No. Telepon', key: 'phone', type: 'tel' },
              { label: 'Email', key: 'email', type: 'email' },
              { label: 'Kota', key: 'city', type: 'text' },
              { label: 'Tanggal Lahir', key: 'dob', type: 'date' },
            ].map(f => (
              <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>{f.label}</label>
                <input type={f.type} className="form-input" value={(form as any)[f.key]}
                  onChange={set(f.key as keyof CustomerForm)} required={f.label.includes('*')} />
              </div>
            ))}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>Jenis Kelamin</label>
              <select className="form-input form-select" value={form.gender} onChange={set('gender')}>
                <option value="">-- Pilih --</option>
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>Alamat</label>
            <input className="form-input" value={form.address} onChange={set('address')} placeholder="Alamat lengkap" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>Catatan</label>
            <textarea className="form-input" value={form.notes} onChange={set('notes')} rows={2} style={{ resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button type="button" onClick={() => setModal({ open: false })} className="btn btn-secondary" style={{ flex: 1 }}>Batal</button>
            <button type="submit" disabled={saving} className="btn btn-primary" style={{ flex: 2 }}>
              {saving ? 'Menyimpan...' : modal.item ? 'Simpan' : 'Tambah Customer'}
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  )
}