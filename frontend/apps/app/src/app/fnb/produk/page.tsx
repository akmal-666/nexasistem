'use client'
import AppLayout from '@/components/layout/AppLayout'
import { useEffect, useState } from 'react'
import { formatRp, apiFetch } from '@/lib/utils'

export default function ProdukPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

  useEffect(() => {
    apiFetch('/api/products?module=fnb&limit=100')
      .then(d => setProducts(d.products || []))
      .finally(() => setLoading(false))
  }, [])

  const filtered = products.filter(p => !q || p.name.toLowerCase().includes(q.toLowerCase()))

  return (
    <AppLayout title="Produk FnB" subtitle="Daftar menu dan produk">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Menu & Produk FnB</h1>
            <p className="text-sm text-gray-500">{filtered.length} produk</p>
          </div>
        </div>
        <input
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Cari produk..." value={q} onChange={e => setQ(e.target.value)} />
        {loading ? (
          <div className="text-center py-12 text-gray-400">Memuat...</div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="px-5 py-3 text-left text-xs text-gray-500 font-medium">Produk</th>
                  <th className="px-5 py-3 text-left text-xs text-gray-500 font-medium">Harga</th>
                  <th className="px-5 py-3 text-left text-xs text-gray-500 font-medium">Stok</th>
                  <th className="px-5 py-3 text-left text-xs text-gray-500 font-medium">Kategori</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-12 text-gray-400">Belum ada produk</td></tr>
                ) : filtered.map((p: any) => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <div className="font-medium text-gray-900">{p.name}</div>
                      {p.sku && <div className="text-xs text-gray-400">SKU: {p.sku}</div>}
                    </td>
                    <td className="px-5 py-3 font-medium text-indigo-600">{formatRp(p.price)}</td>
                    <td className="px-5 py-3">
                      <span className={`font-medium ${p.stock <= p.min_stock ? 'text-red-600' : 'text-gray-900'}`}>
                        {p.stock} {p.unit}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500">{p.category_name || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  )
}