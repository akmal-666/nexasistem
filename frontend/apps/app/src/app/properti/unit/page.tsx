'use client'
import AppLayout from '@/components/layout/AppLayout'
import { useEffect, useState } from 'react'
import { formatRp, apiFetch } from '@/lib/utils'
import toast from 'react-hot-toast'

const STATUS_CFG: Record<string, { label: string; bg: string }> = {
  available:   { label: 'Tersedia',  bg: 'bg-green-50 border-green-200' },
  occupied:    { label: 'Dihuni',    bg: 'bg-blue-50 border-blue-200' },
  maintenance: { label: 'Perbaikan', bg: 'bg-yellow-50 border-yellow-200' },
}

export default function PropertiUnitPage() {
  const [data, setData] = useState<any>({ units: [], summary: {} })
  const [loading, setLoading] = useState(true)

  const fetchData = () => apiFetch('/api/modules/properti?action=units').then(setData).finally(() => setLoading(false))

  useEffect(() => { fetchData() }, [])

  return (
    <AppLayout title="Unit & Kamar" subtitle="Manajemen unit properti">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Unit & Kamar</h1>
            <p className="text-sm text-gray-500">{data.summary.total || 0} unit · {data.summary.occupied || 0} dihuni · {data.summary.available || 0} tersedia</p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Unit', value: data.summary.total || 0 },
            { label: 'Dihuni', value: data.summary.occupied || 0 },
            { label: 'Tersedia', value: data.summary.available || 0 },
            { label: 'Tingkat Hunian', value: data.summary.total ? `${Math.round((data.summary.occupied / data.summary.total) * 100)}%` : '0%' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="text-xs text-gray-500 mb-1">{s.label}</div>
              <div className="text-2xl font-bold text-gray-900">{s.value}</div>
            </div>
          ))}
        </div>

        {loading ? <div className="text-center py-12 text-gray-400">Memuat...</div> : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.units.map((u: any) => {
              const cfg = STATUS_CFG[u.status] || STATUS_CFG.available
              return (
                <div key={u.id} className={`rounded-xl border-2 p-5 ${cfg.bg}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-bold text-gray-900">{u.name}</div>
                      <div className="text-xs text-gray-500 capitalize">{u.type}{u.floor ? ` · Lt.${u.floor}` : ''}{u.size_m2 ? ` · ${u.size_m2}m²` : ''}</div>
                    </div>
                    <span className="text-xs px-2 py-0.5 bg-white rounded-full text-gray-600 border border-gray-200">{cfg.label}</span>
                  </div>
                  <div className="text-xl font-bold text-indigo-600 mb-2">{formatRp(u.price)}<span className="text-sm font-normal text-gray-400">/bln</span></div>
                  {u.tenant_name && (
                    <div className="text-sm bg-white rounded-lg px-3 py-2 border border-gray-100">
                      <div className="font-medium text-gray-900">{u.tenant_name}</div>
                      <div className="text-xs text-gray-400">{u.tenant_phone || '-'}</div>
                    </div>
                  )}
                  {u.facilities?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {u.facilities.slice(0, 3).map((f: string) => (
                        <span key={f} className="text-xs bg-white px-2 py-0.5 rounded border border-gray-100 text-gray-600">{f}</span>
                      ))}
                      {u.facilities.length > 3 && <span className="text-xs text-gray-400">+{u.facilities.length - 3}</span>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AppLayout>
  )
}