// packages/db/src/index.ts
// D1 database helpers untuk Cloudflare Workers environment

export type D1Database = {
  prepare(query: string): D1PreparedStatement
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>
  exec(query: string): Promise<D1ExecResult>
}

export type D1PreparedStatement = {
  bind(...values: unknown[]): D1PreparedStatement
  first<T = unknown>(colName?: string): Promise<T | null>
  run<T = unknown>(): Promise<D1Result<T>>
  all<T = unknown>(): Promise<D1Result<T>>
  raw<T = unknown[]>(): Promise<T[]>
}

export type D1Result<T = unknown> = {
  results: T[]
  success: boolean
  error?: string
  meta: { duration: number; changes?: number; last_row_id?: number }
}

export type D1ExecResult = { count: number; duration: number }

// ─── Helper: generate UUID ─────────────────────────────────────
export function uid(): string {
  return crypto.randomUUID()
}

// ─── Helper: safe JSON parse ───────────────────────────────────
export function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback
  try { return JSON.parse(raw) as T } catch { return fallback }
}

// ─── Helper: query builder utilities ──────────────────────────
export function buildSetClause(fields: Record<string, unknown>): { clause: string; values: unknown[] } {
  const entries = Object.entries(fields).filter(([, v]) => v !== undefined)
  const clause = entries.map(([k]) => `${k} = ?`).join(', ')
  const values = entries.map(([, v]) => v)
  return { clause, values }
}

// ─── Pagination helper ─────────────────────────────────────────
export function paginate(page: number, limit: number): { limit: number; offset: number } {
  const p = Math.max(1, page)
  const l = Math.min(100, Math.max(1, limit))
  return { limit: l, offset: (p - 1) * l }
}
