
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.nexasistem.com'

export function formatRp(n: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0)
}

export function formatDate(s: string): string {
  if (!s) return '-'
  try {
    return new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch { return s }
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
  })
  const data = await res.json() as any
  if (!data.ok) throw new Error(data.error || 'Terjadi kesalahan')
  return data
}
