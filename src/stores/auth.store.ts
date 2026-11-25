import { create } from 'zustand'
import type { User, AuthResponse } from '../types/auth'

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null

  setSession: (session: AuthResponse) => void

  setTokens: (
    accessToken: string,
    refreshToken: string,
  ) => void

  setUser: (user: User) => void
  clearSession: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,

  setSession: (session) => set({
    user: session.user,
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
  }),

  setTokens: (accessToken, refreshToken) => set({
    accessToken,
    refreshToken,
  }),

  setUser: (user) => set({ user }),

  clearSession: () => set({
    user: null,
    accessToken: null,
    refreshToken: null,
  }),
}))
