'use client'
import { useEffect, useState } from 'react'
import { formatRp, apiFetch } from '@/lib/utils'

const MODULE_LINKS = [
  { mod: 'fnb', label: 'FnB', icon: '🍜', links: [{ href: '/fnb/kasir', label: 'Kasir' }, { href: '/fnb/meja', label: 'Meja' }, { href: '/fnb/laporan', label: 'Laporan' }] },
  { mod: 'retail', label: 'Retail', icon: '🏪', links: [{ href: '/retail/kasir', label: 'Kasir' }, { href: '/retail/stok', label: 'Stok' }, { href: '/retail/laporan', label: 'Laporan' }] },
  { mod: 'klinik', label: 'Klinik', icon: '🏥', links: [{ href: '/klinik/antrian', label: 'Antrian' }, { href: '/klinik/kasir', label: 'Kasir' }, { href: '/klinik/laporan', label: 'Laporan' }] },
  { mod: 'laundry', label: 'Laundry', icon: '👕', links: [{ href: '/laundry/order', label: 'Order' }, { href: '/laundry/laporan', label: 'Laporan' }] },
  { mod: 'apotek', label: 'Apotek', icon: '💊', links: [{ href: '/apotek/kasir', label: 'Kasir' }, { href: '/apotek/produk', label: 'Stok Obat' }, { href: '/apotek/laporan', label: 'Laporan' }] },
  { mod: 'salon', label: 'Salon', icon: '✂️', links: [{ href: '/salon/booking', label: 'Booking' }, { href: '/salon/laporan', label: 'Laporan' }] },
  { mod: 'properti', label: 'Properti', icon: '🏠', links: [{ href: '/properti/unit', label: 'Unit' }, { href: '/properti/tagihan', label: 'Tagihan' }, { href: '/properti/laporan', label: 'Laporan' }] },
]

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [modules, setModules] = useState<string[]>([])

  useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.nexasistem.com'
    fetch(`${API_URL}/api/auth/me`, { credentials: 'include' })
      .then(r => r.json())
      .then((d: any) => {
        if (!d.ok) { window.location.href = '/login'; return }
        setUser(d.user)
        setModules(d.tenant?.modules || [])
      })
      .catch(() => { window.location.href = '/login' })
  }, [])

  const activeModules = MODULE_LINKS.filter(m => modules.length === 0 || modules.includes(m.mod))

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">NX</span>
          </div>
          <span className="font-bold text-gray-900">Nexasistem</span>
        </div>
        {user && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">{user.name}</span>
            <button onClick={async () => {
              const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.nexasistem.com'
              await fetch(`${API_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' })
              window.location.href = '/login'
            }} className="text-sm text-red-500 hover:underline">Keluar</button>
          </div>
        )}
      </div>

      <div className="p-6 max-w-5xl mx-auto">
        {user && (
          <div className="mb-6">
            <h1 className="text-xl font-bold text-gray-900">Selamat datang, {user.name}! 👋</h1>
            <p className="text-gray-500 text-sm mt-0.5">Pilih modul untuk memulai</p>
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeModules.map(m => (
            <div key={m.mod} className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{m.icon}</span>
                <span className="font-bold text-gray-900">{m.label}</span>
              </div>
              <div className="space-y-1">
                {m.links.map(link => (
                  <a key={link.href} href={link.href}
                    className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 text-sm text-gray-600 transition-colors group">
                    <span>{link.label}</span>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
