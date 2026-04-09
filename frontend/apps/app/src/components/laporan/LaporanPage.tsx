'use client'
import { useEffect, useState } from 'react'
import { formatRp, apiFetch } from '@/lib/utils'

const PRESETS = [
  { label: 'Hari ini', days: 0 },
  { label: '7 hari', days: 6 },
  { label: '30 hari', days: 29 },
]

function getDate(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString().slice(0, 10)
}

interface Props { module: string; title: string }

export default function LaporanPage({ module, title }: Props) {
  const today = new Date().toISOString().slice(0, 10)
  const [from, setFrom] = useState(today)
  const [to, setTo] = useState(today)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    apiFetch(`/api/laporan?type=summary&from=${from}&to=${to}&module=${module}`)
      .then(setData).catch(() => {}).finally(() => setLoading(false))
  }, [from, to, module])

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-500">Analisis penjualan dan pendapatan</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-wrap gap-3 items-center">
          <div className="flex gap-2">
            {PRESETS.map(p => (
              <button key={p.label} onClick={() => { setFrom(getDate(p.days)); setTo(today) }}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input type="date" className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
              value={from} onChange={e => setFrom(e.target.value)} />
            <span className="text-gray-400">—</span>
            <input type="date" className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
              value={to} onChange={e => setTo(e.target.value)} />
          </div>
        </div>

        {loading && <div className="text-center py-12 text-gray-400">Memuat...</div>}

        {!loading && data && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Transaksi', value: String(data.summary?.total_transactions ?? 0) },
                { label: 'Gross Revenue', value: formatRp(data.summary?.gross_revenue ?? 0) },
                { label: 'Total Diskon', value: formatRp(data.summary?.total_discount ?? 0) },
                { label: 'Net Revenue', value: formatRp(data.summary?.net_revenue ?? 0) },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4">
                  <div className="text-xs text-gray-500 mb-1">{s.label}</div>
                  <div className="text-2xl font-bold text-gray-900">{s.value}</div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl border border-gray-100">
              <div className="px-5 py-4 border-b border-gray-50 font-semibold text-gray-900">Produk Terlaris</div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="px-5 py-3 text-left text-xs text-gray-500 font-medium">#</th>
                    <th className="px-5 py-3 text-left text-xs text-gray-500 font-medium">Produk</th>
                    <th className="px-5 py-3 text-left text-xs text-gray-500 font-medium">Qty</th>
                    <th className="px-5 py-3 text-left text-xs text-gray-500 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.topProducts || []).length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-8 text-gray-400">Tidak ada data</td></tr>
                  ) : (data.topProducts || []).map((p: any, i: number) => (
                    <tr key={p.name} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-5 py-3 text-gray-500">{i + 1}</td>
                      <td className="px-5 py-3 font-medium">{p.name}</td>
                      <td className="px-5 py-3">{p.total_qty}x</td>
                      <td className="px-5 py-3 font-medium">{formatRp(p.total_sales)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}