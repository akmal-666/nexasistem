// frontend/apps/app/src/store/useSession.ts
import { create } from 'zustand'
import type { TenantSession } from '@nexasistem/shared'

interface SessionState extends Partial<TenantSession> {
  isLoading: boolean
  isAuthenticated: boolean
  set: (data: TenantSession) => void
  clear: () => void
  setLoading: (v: boolean) => void
}

export const useSession = create<SessionState>((setState) => ({
  isLoading: true,
  isAuthenticated: false,
  user: undefined,
  tenant: undefined,
  set: (data) => setState({ ...data, isAuthenticated: true, isLoading: false }),
  clear: () => setState({ isAuthenticated: false, isLoading: false, user: undefined, tenant: undefined }),
  setLoading: (v) => setState({ isLoading: v }),
}))
