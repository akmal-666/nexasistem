'use client'
import AppLayout from '@/components/layout/AppLayout'
import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/utils'
import toast from 'react-hot-toast'

const STATUS_CFG: Record<string, { label: string; bg: string; dot: string }> = {
  available:  { label: 'Kosong',    bg: 'bg-green-50 border-green-200',   dot: 'bg-green-400' },
  occupied:   { label: 'Terisi',    bg: 'bg-blue-50 border-blue-200',     dot: 'bg-blue-400' },
  reserved:   { label: 'Reservasi', bg: 'bg-purple-50 border-purple-200', dot: 'bg-purple-400' },
  closed:     { label: 'Tutup',     bg: 'bg-gray-50 border-gray-200',     dot: 'bg-gray-300' },
}

export default function FnbMejaPage() {
  const [tables, setTables] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)

  const fetch = () => apiFetch('/api/modules/fnb?action=tables').then(d => setTables(d.tables || [])).finally(() => setLoading(false))

  useEffect(() => { fetch() }, [])

  async function addTable(e: React.FormEvent) {
    e.preventDefault()
    if (!newName) return
    setAdding(true)
    try {
      await apiFetch('/api/modules/fnb', { method: 'POST', body: JSON.stringify({ action: 'add_table', name: newName }) })
      toast.success('Meja ditambahkan')
      setNewName('')
      fetch()
    } catch (err: any) { toast.error(err.message) }
    finally { setAdding(false) }
  }

  async function kosongkan(id: string) {
    try {
      await apiFetch('/api/modules/fnb', { method: 'POST', body: JSON.stringify({ action: 'update_table_status', table_id: id, status: 'available' }) })
      fetch()
    } catch (err: any) { toast.error(err.message) }
  }

  return (
    <AppLayout title="Manajemen Meja" subtitle="Status meja restoran">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Manajemen Meja</h1>
            <p className="text-sm text-gray-500">{tables.filter(t => t.status === 'occupied').length} terisi · {tables.filter(t => t.status === 'available').length} kosong</p>
          </div>
          <a href="/fnb/kasir" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">+ Transaksi</a>
        </div>

        <form onSubmit={addTable} className="flex gap-3">
          <input className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Nama meja baru (contoh: Meja 5)" value={newName} onChange={e => setNewName(e.target.value)} />
          <button type="submit" disabled={adding} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">Tambah</button>
        </form>

        {loading ? <div className="text-center py-12 text-gray-400">Memuat...</div> : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {tables.map((t: any) => {
              const cfg = STATUS_CFG[t.status] || STATUS_CFG.available
              return (
                <div key={t.id} className={`rounded-xl border-2 p-4 ${cfg.bg}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                    <span className="text-xs text-gray-500">{t.capacity}×</span>
                  </div>
                  <div className="font-semibold text-gray-900">{t.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{cfg.label}</div>
                  {t.status === 'occupied' && (
                    <button onClick={() => kosongkan(t.id)} className="mt-3 w-full py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50">
                      Kosongkan
                    </button>
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