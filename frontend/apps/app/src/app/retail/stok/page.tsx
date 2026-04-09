'use client'
import AppLayout from '@/components/layout/AppLayout'
import { useEffect, useState } from 'react'
import { formatRp, apiFetch } from '@/lib/utils'

export default function RetailStokPage() {
  const [products, setProducts] = useState<any[]>([])
  const [summary, setSummary] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    apiFetch('/api/laporan?type=stock&module=retail').then(d => {
      setProducts(d.products || [])
      setSummary(d.summary || {})
    }).finally(() => setLoading(false))
  }, [])

  const filtered = products.filter(p => filter === 'low' ? p.stock <= p.min_stock : true)

  return (
    <AppLayout title="Manajemen Stok" subtitle="Monitor stok produk">
      <div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Manajemen Stok</h1>
          <p className="text-sm text-gray-500">{summary.total_products || 0} produk</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Produk', value: summary.total_products || 0 },
            { label: 'Stok Menipis', value: summary.low_stock || 0 },
            { label: 'Nilai Stok', value: formatRp(summary.total_stock_value || 0) },
            { label: 'Normal', value: (summary.total_products || 0) - (summary.low_stock || 0) },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="text-xs text-gray-500 mb-1">{s.label}</div>
              <div className="text-2xl font-bold text-gray-900">{s.value}</div>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          {[{ v: '', l: 'Semua' }, { v: 'low', l: 'Stok Menipis' }].map(f => (
            <button key={f.v} onClick={() => setFilter(f.v)}
              className={`px-3 py-1.5 text-sm rounded-lg border font-medium ${filter === f.v ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-gray-200 text-gray-600'}`}>
              {f.l}
            </button>
          ))}
        </div>
        {loading ? <div className="text-center py-12 text-gray-400">Memuat...</div> : (
          <div className="bg-white rounded-xl border border-gray-100">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-50">
                <th className="px-5 py-3 text-left text-xs text-gray-500 font-medium">Produk</th>
                <th className="px-5 py-3 text-left text-xs text-gray-500 font-medium">Stok</th>
                <th className="px-5 py-3 text-left text-xs text-gray-500 font-medium">Min. Stok</th>
                <th className="px-5 py-3 text-left text-xs text-gray-500 font-medium">Nilai</th>
                <th className="px-5 py-3 text-left text-xs text-gray-500 font-medium">Status</th>
              </tr></thead>
              <tbody>
                {filtered.map((p: any) => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium">{p.name}</td>
                    <td className={`px-5 py-3 font-medium ${p.stock <= 0 ? 'text-red-600' : p.stock <= p.min_stock ? 'text-yellow-600' : 'text-gray-900'}`}>{p.stock} {p.unit}</td>
                    <td className="px-5 py-3 text-gray-400">{p.min_stock}</td>
                    <td className="px-5 py-3">{formatRp(p.stock_value || 0)}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.stock <= 0 ? 'bg-red-100 text-red-700' : p.stock <= p.min_stock ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                        {p.stock <= 0 ? 'Habis' : p.stock <= p.min_stock ? 'Menipis' : 'Normal'}
                      </span>
                    </td>
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