'use client'
import AppLayout from '@/components/layout/AppLayout'
import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/utils'

export default function Page() {
  return (
    <AppLayout title="Staf Salon" subtitle="Manajemen staf">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-xl font-bold text-gray-900 mb-2">Staf Salon</h1>
        <p className="text-gray-500 text-sm mb-6">Daftar staf salon</p>
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400">
          Halaman ini sedang dalam pengembangan
        </div>
      </div>
    </AppLayout>
  )
}