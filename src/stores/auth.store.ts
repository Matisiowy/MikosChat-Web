import { create } from 'zustand'
import type { User, AuthResponse } from '../types/auth'

interface AuthState {
  user: User | null
  accessToken: string | null
  sessionId: string | null
  initialized: boolean

  setSession: (session: AuthResponse) => void
  setInitialized: (initialized: boolean) => void
  setUser: (user: User) => void
  clearSession: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  sessionId: null,
  initialized: false,

  setSession: session => set({
    user: session.user,
    accessToken: session.accessToken,
    sessionId: session.sessionId,
    initialized: true,
  }),

  setInitialized: initialized => set({ initialized }),

  setUser: user => set({ user }),

  clearSession: () => set({
    user: null,
    accessToken: null,
    sessionId: null,
    initialized: true,
  }),
}))
