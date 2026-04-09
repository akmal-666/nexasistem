'use client'
import { useEffect, useState } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.nexasistem.com'

const MODULE_LINKS = [
  { mod: 'fnb',      label: 'FnB',      icon: '🍜', links: [{ href: '/fnb/kasir', label: 'Kasir' }, { href: '/fnb/meja', label: 'Meja' }, { href: '/fnb/produk', label: 'Produk' }, { href: '/fnb/laporan', label: 'Laporan' }] },
  { mod: 'retail',   label: 'Retail',   icon: '🏪', links: [{ href: '/retail/kasir', label: 'Kasir' }, { href: '/retail/produk', label: 'Produk' }, { href: '/retail/stok', label: 'Stok' }, { href: '/retail/laporan', label: 'Laporan' }] },
  { mod: 'klinik',   label: 'Klinik',   icon: '🏥', links: [{ href: '/klinik/antrian', label: 'Antrian' }, { href: '/klinik/kasir', label: 'Kasir' }, { href: '/klinik/dokter', label: 'Dokter' }, { href: '/klinik/laporan', label: 'Laporan' }] },
  { mod: 'laundry',  label: 'Laundry',  icon: '👕', links: [{ href: '/laundry/order', label: 'Order' }, { href: '/laundry/laporan', label: 'Laporan' }] },
  { mod: 'apotek',   label: 'Apotek',   icon: '💊', links: [{ href: '/apotek/kasir', label: 'Kasir' }, { href: '/apotek/produk', label: 'Stok Obat' }, { href: '/apotek/laporan', label: 'Laporan' }] },
  { mod: 'salon',    label: 'Salon',    icon: '✂️', links: [{ href: '/salon/booking', label: 'Booking' }, { href: '/salon/layanan', label: 'Layanan' }, { href: '/salon/staf', label: 'Staf' }, { href: '/salon/laporan', label: 'Laporan' }] },
  { mod: 'properti', label: 'Properti', icon: '🏠', links: [{ href: '/properti/unit', label: 'Unit' }, { href: '/properti/tagihan', label: 'Tagihan' }, { href: '/properti/laporan', label: 'Laporan' }] },
]

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [tenant, setTenant] = useState<any>(null)

  useEffect(() => {
    // Ambil dari localStorage
    const token = localStorage.getItem('nx_token')
    const userData = localStorage.getItem('nx_user')
    const tenantData = localStorage.getItem('nx_tenant')

    if (!token || !userData) {
      window.location.href = '/login'
      return
    }

    try {
      setUser(JSON.parse(userData))
      setTenant(tenantData ? JSON.parse(tenantData) : null)
    } catch {
      window.location.href = '/login'
    }
  }, [])

  function logout() {
    localStorage.removeItem('nx_token')
    localStorage.removeItem('nx_user')
    localStorage.removeItem('nx_tenant')
    window.location.href = '/login'
  }

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">NX</span>
          </div>
          <div>
            <span className="font-bold text-gray-900">{tenant?.name || 'Nexasistem'}</span>
            {tenant?.business_type && (
              <span className="ml-2 text-xs text-gray-400 capitalize">{tenant.business_type}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">{user.name}</span>
          <button onClick={logout} className="text-sm text-red-500 hover:underline">Keluar</button>
        </div>
      </div>

      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Selamat datang, {user.name}! 👋</h1>
          <p className="text-gray-500 text-sm mt-0.5">Pilih modul untuk memulai</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MODULE_LINKS.map(m => (
            <div key={m.mod} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
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