// frontend/apps/app/src/lib/api.ts
// API client - semua request ke backend Workers di api.nexasistem.com

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.nexasistem.com'

export class ApiError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_URL}${path}`

  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  const data = await res.json() as { ok: boolean; error?: string; code?: string } & T

  if (!res.ok || !data.ok) {
    throw new ApiError(res.status, data.error || 'Terjadi kesalahan', data.code)
  }

  return data
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) => request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}

// ─── Auth ──────────────────────────────────────────────────────
export const authApi = {
  login: (slug: string, email: string, password: string) =>
    api.post<{ user: any; tenant: any; token: string }>('/api/auth/login', { slug, email, password }),
  logout: () => api.post('/api/auth/logout', {}),
  me: () => api.get<{ user: any; tenant: any }>('/api/auth/me'),
}

// ─── Setup ─────────────────────────────────────────────────────
export const setupApi = {
  check: (slug: string) =>
    api.get<{ exists: boolean; has_users: boolean; tenant_name: string; status: string }>(`/api/setup/check?slug=${slug}`),
  init: (slug: string, name: string, email: string, password: string) =>
    api.post<{ user_id: string }>('/api/setup/init', { slug, name, email, password }),
}

// ─── Products ──────────────────────────────────────────────────
export const productApi = {
  list: (params: Record<string, string | number> = {}) => {
    const qs = new URLSearchParams(params as any).toString()
    return api.get<{ products: any[]; total: number }>(`/api/products${qs ? '?' + qs : ''}`)
  },
  create: (data: any) => api.post<{ id: string }>('/api/products', data),
  update: (id: string, data: any) => api.patch<{ ok: boolean }>(`/api/products/${id}`, data),
  delete: (id: string) => api.delete<{ ok: boolean }>(`/api/products/${id}`),
}

// ─── Customers ─────────────────────────────────────────────────
export const customerApi = {
  list: (params: Record<string, string | number> = {}) => {
    const qs = new URLSearchParams(params as any).toString()
    return api.get<{ customers: any[]; total: number }>(`/api/customers${qs ? '?' + qs : ''}`)
  },
  create: (data: any) => api.post<{ id: string }>('/api/customers', data),
  update: (id: string, data: any) => api.patch<{ ok: boolean }>(`/api/customers/${id}`, data),
}

// ─── Categories ────────────────────────────────────────────────
export const categoryApi = {
  list: (module?: string) =>
    api.get<{ categories: any[] }>(`/api/categories${module ? '?module=' + module : ''}`),
  create: (data: any) => api.post<{ id: string }>('/api/categories', data),
  delete: (id: string) => api.delete<{ ok: boolean }>(`/api/categories/${id}`),
}

// ─── Orders ────────────────────────────────────────────────────
export const orderApi = {
  list: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString()
    return api.get<{ orders: any[] }>(`/api/orders${qs ? '?' + qs : ''}`)
  },
  create: (data: any) => api.post<{ id: string; order_number: string; change: number }>('/api/orders', data),
}

// ─── Laporan ───────────────────────────────────────────────────
export const laporanApi = {
  summary: (params: { from: string; to: string; module?: string; type?: string }) => {
    const qs = new URLSearchParams({ type: 'summary', ...params }).toString()
    return api.get<{ summary: any; byDay: any[]; byPaymentMethod: any[]; topProducts: any[] }>(`/api/laporan?${qs}`)
  },
  stock: (module?: string) =>
    api.get<{ products: any[]; summary: any }>(`/api/laporan?type=stock${module ? '&module=' + module : ''}`),
  exportUrl: (type: string, from: string, to: string, module?: string) =>
    `${API_URL}/api/laporan/export?type=${type}&from=${from}&to=${to}${module ? '&module=' + module : ''}`,
}

// ─── Settings ──────────────────────────────────────────────────
export const settingsApi = {
  getProfil: () => api.get<{ profil: Record<string, string> }>('/api/settings/profil'),
  saveProfil: (data: Record<string, string>) => api.post<{ ok: boolean }>('/api/settings/profil', data),
  getBranches: () => api.get<{ branches: any[] }>('/api/settings/branches'),
  createBranch: (data: any) => api.post<{ id: string }>('/api/settings/branches', data),
}

// ─── WA ────────────────────────────────────────────────────────
export const waApi = {
  status: () => api.get<{ configured: boolean }>('/api/wa'),
  send: (type: string, data: any) => api.post<{ ok: boolean }>('/api/wa', { type, data }),
}

// ─── Suppliers & Purchases ─────────────────────────────────────
export const supplierApi = {
  list: () => api.get<{ suppliers: any[] }>('/api/suppliers'),
  create: (data: any) => api.post<{ id: string }>('/api/suppliers', data),
}

export const purchaseApi = {
  list: () => api.get<{ purchases: any[] }>('/api/purchases'),
  create: (data: any) => api.post<{ id: string; purchase_number: string }>('/api/purchases', data),
}

// ─── Module-specific ───────────────────────────────────────────
export const moduleApi = {
  get: (module: string, action: string, params: Record<string, string> = {}) => {
    const qs = new URLSearchParams({ action, ...params }).toString()
    return api.get<any>(`/api/modules/${module}?${qs}`)
  },
  post: (module: string, action: string, data: any) =>
    api.post<any>(`/api/modules/${module}`, { action, ...data }),
}
