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
    price: initial?.price ? String(initial.price) : '',
    cost_price: initial?.cost_price ? String(initial.cost_price) : '',
    stock: initial?.stock != null ? String(initial.stock) : '',
    unit: initial?.unit || 'pcs',
    min_stock: initial?.min_stock != null ? String(initial.min_stock) : '0',
    description: initial?.description || '',
  })
  const [saving, setSaving] = useState(false)

  const UNITS = ['pcs','kg','gram','liter','ml','box','lusin','strip','tablet','botol','sachet','meter','porsi']
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const price = parseFloat(form.price)
    if (!form.name.trim()) return toast.error('Nama produk wajib diisi')
    if (!form.price || isNaN(price) || price < 0) return toast.error('Harga jual tidak valid')
    setSaving(true)
    try {
      const payload = {
        module,
        name: form.name.trim(),
        sku: form.sku.trim() || undefined,
        barcode: form.barcode.trim() || undefined,
        category_id: form.category_id || undefined,
        price,
        cost_price: parseFloat(form.cost_price || '0') || 0,
        stock: parseFloat(form.stock || '0') || 0,
        unit: form.unit,
        min_stock: parseFloat(form.min_stock || '0') || 0,
        description: form.description.trim() || undefined,
      }
      if (initial?.id) {
        await apiFetch(`/api/products/${initial.id}`, { method: 'PATCH', body: JSON.stringify(payload) })
        toast.success('Produk berhasil diperbarui')
      } else {
        await apiFetch('/api/products', { method: 'POST', body: JSON.stringify(payload) })
        toast.success('Produk berhasil ditambahkan')
      }
      onSave()
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan produk')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Nama */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>Nama Produk <span style={{ color: '#EF4444' }}>*</span></label>
        <input className="form-input" value={form.name} onChange={set('name')}
          placeholder="Nama produk" required autoFocus />
      </div>

      {/* SKU + Barcode */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>SKU</label>
          <input className="form-input" value={form.sku} onChange={set('sku')} placeholder="SKU-001" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>Barcode</label>
          <input className="form-input" value={form.barcode} onChange={set('barcode')} placeholder="123456789" />
        </div>
      </div>

      {/* Kategori */}
      {categories.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>Kategori</label>
          <select className="form-input form-select" value={form.category_id} onChange={set('category_id')}>
            <option value="">-- Tanpa Kategori --</option>
            {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      )}

      {/* Harga */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>Harga Jual <span style={{ color: '#EF4444' }}>*</span></label>
          <input className="form-input" type="number" min="0" value={form.price} onChange={set('price')}
            placeholder="0" required />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>Harga Modal</label>
          <input className="form-input" type="number" min="0" value={form.cost_price} onChange={set('cost_price')}
            placeholder="0" />
        </div>
      </div>

      {/* Stok */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>Stok</label>
          <input className="form-input" type="number" min="0" value={form.stock} onChange={set('stock')}
            placeholder="0" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>Min. Stok</label>
          <input className="form-input" type="number" min="0" value={form.min_stock} onChange={set('min_stock')}
            placeholder="0" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>Satuan</label>
          <select className="form-input form-select" value={form.unit} onChange={set('unit')}>
            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      </div>

      {/* Deskripsi */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>Deskripsi</label>
        <textarea className="form-input" value={form.description} onChange={set('description')}
          placeholder="Deskripsi produk (opsional)" rows={2} style={{ resize: 'vertical' }} />
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 8, paddingTop: 4, borderTop: '1px solid var(--border)', marginTop: 4 }}>
        <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }} disabled={saving}>
          Batal
        </button>
        <button type="submit" disabled={saving} className="btn btn-primary" style={{ flex: 2 }}>
          {saving
            ? <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="spinner" style={{ width: 14, height: 14 }} />
                Menyimpan...
              </span>
            : initial?.id ? '✓ Simpan Perubahan' : '+ Tambah Produk'
          }
        </button>
      </div>
    </form>
  )
}