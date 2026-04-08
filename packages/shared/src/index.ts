// packages/shared/src/index.ts
// Shared types, constants, dan utilities untuk frontend + backend

// ============================================================
// MODULE TYPES
// ============================================================

export type ModuleType = 
  | 'fnb' | 'retail' | 'klinik' | 'laundry' 
  | 'apotek' | 'salon' | 'properti'

export const MODULE_LABELS: Record<ModuleType, string> = {
  fnb: 'FnB & Restoran',
  retail: 'Retail & Toko',
  klinik: 'Klinik & Praktik',
  laundry: 'Laundry',
  apotek: 'Apotek',
  salon: 'Salon & Barbershop',
  properti: 'Properti & Kos',
}

export const ALL_MODULES: ModuleType[] = [
  'fnb', 'retail', 'klinik', 'laundry', 'apotek', 'salon', 'properti'
]

// ============================================================
// TENANT TYPES
// ============================================================

export type TenantStatus = 'trial' | 'active' | 'suspended' | 'cancelled'
export type PlanSlug = 'basic' | 'pro' | 'enterprise'

export interface Tenant {
  id: string
  name: string
  slug: string
  business_type: ModuleType
  owner_name: string
  owner_email: string
  owner_phone?: string
  plan_id?: string
  plan_name?: string
  status: TenantStatus
  trial_ends_at?: string
  modules: ModuleType[]
  logo_url?: string
  address?: string
  city?: string
  created_at: string
}

export interface Plan {
  id: string
  name: string
  slug: PlanSlug
  price_monthly: number
  price_yearly: number
  max_users: number
  max_modules: number
  max_branches: number
  features: string[]
  modules: ModuleType[]
  is_active: boolean
  sort_order: number
}

// ============================================================
// USER TYPES
// ============================================================

export type UserRole = 'owner' | 'manager' | 'kasir' | 'staff'

export interface TenantUser {
  id: string
  name: string
  email: string
  role: UserRole
  phone?: string
  is_active: boolean
  last_login?: string
}

export interface AdminUser {
  id: string
  name: string
  email: string
  role: 'superadmin' | 'staff'
  is_active: boolean
}

// ============================================================
// SESSION TYPES
// ============================================================

export interface TenantSession {
  user: {
    id: string
    name: string
    email: string
    role: UserRole
    permissions: string[]
    tenantId: string
    tenantSlug: string
    tenantName: string
  }
  tenant: {
    id: string
    slug: string
    name: string
    status: TenantStatus
    modules: ModuleType[]
    plan_name?: string
  }
}

export interface AdminSession {
  admin: {
    id: string
    name: string
    email: string
    role: 'superadmin' | 'staff'
  }
}

// ============================================================
// ORDER TYPES
// ============================================================

export type OrderStatus = 'draft' | 'confirmed' | 'processing' | 'done' | 'cancelled' | 'refunded'
export type PaymentStatus = 'unpaid' | 'partial' | 'paid' | 'refunded'
export type PaymentMethod = 'cash' | 'qris' | 'transfer' | 'kartu' | 'midtrans'

export interface Order {
  id: string
  order_number: string
  branch_id?: string
  customer_id?: string
  customer_name?: string
  module: ModuleType
  status: OrderStatus
  subtotal: number
  discount: number
  tax: number
  service_charge: number
  total: number
  paid_amount: number
  change_amount: number
  payment_method?: PaymentMethod
  payment_status: PaymentStatus
  cashier_id?: string
  notes?: string
  meta: Record<string, unknown>
  printed_at?: string
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id?: string
  name: string
  qty: number
  unit: string
  price: number
  discount: number
  subtotal: number
  notes?: string
  meta: Record<string, unknown>
}

// ============================================================
// PRODUCT TYPES
// ============================================================

export interface Product {
  id: string
  category_id?: string
  category_name?: string
  branch_id?: string
  module: ModuleType
  name: string
  sku?: string
  barcode?: string
  description?: string
  price: number
  cost_price: number
  stock: number
  unit: string
  min_stock: number
  image_url?: string
  is_active: boolean
  meta: Record<string, unknown>
}

export interface Category {
  id: string
  name: string
  slug: string
  module: ModuleType
  parent_id?: string
  sort_order: number
}

// ============================================================
// CUSTOMER TYPES
// ============================================================

export interface Customer {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  city?: string
  dob?: string
  gender?: 'M' | 'F'
  notes?: string
  loyalty_point: number
  meta: Record<string, unknown>
}

// ============================================================
// API RESPONSE TYPES
// ============================================================

export interface ApiResponse<T = unknown> {
  ok: boolean
  data?: T
  error?: string
  code?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// ============================================================
// BILLING TYPES
// ============================================================

export type InvoiceStatus = 'unpaid' | 'paid' | 'void'

export interface Invoice {
  id: string
  invoice_number: string
  tenant_id: string
  tenant_name?: string
  amount: number
  tax: number
  total: number
  status: InvoiceStatus
  due_date: string
  paid_at?: string
  payment_method?: string
  midtrans_order_id?: string
  midtrans_url?: string
  notes?: string
  created_at: string
}

// ============================================================
// PERMISSIONS
// ============================================================

export const DEFAULT_PERMISSIONS: Record<UserRole, string[]> = {
  owner: ['*'],
  manager: [
    'dashboard.view', 'products.*', 'categories.*', 'customers.*',
    'orders.*', 'suppliers.*', 'purchases.*', 'reports.*',
    'users.view', 'branches.view',
    'fnb.*', 'retail.*', 'klinik.*', 'laundry.*',
    'apotek.*', 'salon.*', 'properti.*',
  ],
  kasir: [
    'dashboard.view', 'products.view', 'customers.view', 'customers.create',
    'orders.*', 'fnb.*', 'retail.*', 'klinik.*', 'laundry.*',
    'apotek.*', 'salon.*', 'properti.*',
  ],
  staff: ['dashboard.view', 'products.view', 'customers.view', 'orders.view'],
}

export function hasPermission(permissions: string[], required: string): boolean {
  if (!permissions?.length) return false
  if (permissions.includes('*')) return true
  if (permissions.includes(required)) return true
  const parts = required.split('.')
  for (let i = 1; i < parts.length; i++) {
    if (permissions.includes(parts.slice(0, i).join('.') + '.*')) return true
  }
  return false
}

// ============================================================
// UTILITIES
// ============================================================

export function formatRupiah(n: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n || 0)
}

export function generateOrderNumber(prefix: string, date: string, seq: number): string {
  return `${prefix}-${date.replace(/-/g, '')}-${String(seq).padStart(4, '0')}`
}

export function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
}
