'use client'
import { useEffect, useState } from 'react'
import { Users, Building2, CreditCard, TrendingUp } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.nexasistem.com'

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    fetch(`${API_URL}/api/admin/dashboard`, { credentials: 'include' })
      .then(r => r.json()).then(d => setStats(d.stats)).catch(() => {})
  }, [])

  const cards = [
    { label: 'Total Tenant', value: stats?.total_tenants ?? '–', icon: Building2, color: 'text-blue-600 bg-blue-50' },
    { label: 'Aktif', value: stats?.active_tenants ?? '–', icon: Users, color: 'text-green-600 bg-green-50' },
    { label: 'Invoice Unpaid', value: stats?.unpaid_invoices ?? '–', icon: CreditCard, color: 'text-yellow-600 bg-yellow-50' },
    { label: 'MRR', value: stats?.mrr ? `Rp ${Number(stats.mrr).toLocaleString('id-ID')}` : '–', icon: TrendingUp, color: 'text-purple-600 bg-purple-50' },
  ]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Overview platform Nexasistem</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(c => (
          <div key={c.label} className="bg-white rounded-xl border border-gray-100 p-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${c.color}`}>
              <c.icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{c.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{c.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
