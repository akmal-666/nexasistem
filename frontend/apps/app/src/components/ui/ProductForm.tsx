'use client'
import { useState } from 'react'
import { apiFetch } from '@/lib/utils'
import toast from 'react-hot-toast'

interface Props {
  module: string
  initial?: any
  categories: any[]
  onSave: () => void
  onClose: () => void
}

export default function ProductForm({ module, initial, categories, onSave, onClose }: Props) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    sku: initial?.sku || '',
    barcode: initial?.barcode || '',
    category_id: initial?.category_id || '',
    price: initial?.price || '',
    cost_price: initial?.cost_price || '',
    stock: initial?.stock || '',
    unit: initial?.unit || 'pcs',
    min_stock: initial?.min_stock || '0',
    description: initial?.description || '',
  })
  const [saving, setSaving] = useState(false)

  const UNITS = ['pcs', 'kg', 'gram', 'liter', 'ml', 'box', 'lusin', 'strip', 'tablet', 'botol', 'sachet', 'meter', 'porsi']

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.price) return toast.error('Nama dan harga wajib diisi')
    setSaving(true)
    try {
      const payload = {
        ...form,
        module,
        price: parseInt(form.price),
        cost_price: parseInt(form.cost_price || '0'),
        stock: parseFloat(form.stock || '0'),
        min_stock: parseFloat(form.min_stock || '0'),
        category_id: form.category_id || null,
      }
      if (initial?.id) {
        await apiFetch(`/api/products/${initial.id}`, { method: 'PATCH', body: JSON.stringify(payload) })
        toast.success('Produk diperbarui')
      } else {
        await apiFetch('/api/products', { method: 'POST', body: JSON.stringify(payload) })
        toast.success('Produk ditambahkan')
      }
      onSave()
    } catch (err: any) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  const F = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>{label}</label>
      {children}
    </div>
  )

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <F label="Nama Produk *">
        <input className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Nama produk" required autoFocus />
      </F>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <F label="SKU">
          <input className="form-input" value={form.sku} onChange={e => setForm(p => ({ ...p, sku: e.target.value }))} placeholder="SKU-001" />
        </F>
        <F label="Barcode">
          <input className="form-input" value={form.barcode} onChange={e => setForm(p => ({ ...p, barcode: e.target.value }))} placeholder="123456789" />
        </F>
      </div>
      <F label="Kategori">
        <select className="form-input form-select" value={form.category_id} onChange={e => setForm(p => ({ ...p, category_id: e.target.value }))}>
          <option value="">-- Pilih Kategori --</option>
          {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </F>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <F label="Harga Jual *">
          <input className="form-input" type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} placeholder="0" required />
        </F>
        <F label="Harga Modal">
          <input className="form-input" type="number" value={form.cost_price} onChange={e => setForm(p => ({ ...p, cost_price: e.target.value }))} placeholder="0" />
        </F>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <F label="Stok">
          <input className="form-input" type="number" value={form.stock} onChange={e => setForm(p => ({ ...p, stock: e.target.value }))} placeholder="0" />
        </F>
        <F label="Min. Stok">
          <input className="form-input" type="number" value={form.min_stock} onChange={e => setForm(p => ({ ...p, min_stock: e.target.value }))} placeholder="0" />
        </F>
        <F label="Satuan">
          <select className="form-input form-select" value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}>
            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </F>
      </div>
      <F label="Deskripsi">
        <textarea className="form-input" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Deskripsi produk (opsional)" rows={2} style={{ resize: 'vertical' }} />
      </F>
      <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
        <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>Batal</button>
        <button type="submit" disabled={saving} className="btn btn-primary" style={{ flex: 2 }}>
          {saving ? 'Menyimpan...' : initial?.id ? 'Simpan Perubahan' : 'Tambah Produk'}
        </button>
      </div>
    </form>
  )
}