// src/lib/utils.ts
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.nexasistem.com'

export function formatRp(n: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0)
}

export function getToken(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem('nx_token') || ''
}

export function getUser(): any {
  if (typeof window === 'undefined') return null
  try { return JSON.parse(localStorage.getItem('nx_user') || 'null') } catch { return null }
}

export function getTenant(): any {
  if (typeof window === 'undefined') return null
  try { return JSON.parse(localStorage.getItem('nx_tenant') || 'null') } catch { return null }
}

export function logout() {
  localStorage.removeItem('nx_token')
  localStorage.removeItem('nx_user')
  localStorage.removeItem('nx_tenant')
  window.location.href = '/login'
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken()

  if (!token && !path.includes('/setup') && !path.includes('/cms')) {
    window.location.href = '/login'
    throw new Error('Tidak terautentikasi')
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  const data = await res.json() as any

  if (res.status === 401) {
    logout()
    throw new Error('Sesi habis, silakan login kembali')
  }

  if (!data.ok) throw new Error(data.error || 'Terjadi kesalahan')
  return data
}