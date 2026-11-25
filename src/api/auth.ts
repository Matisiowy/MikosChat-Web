import {
  api,
  publicApi,
  refreshSession,
} from './client'

import {
  withSessionLock,
  announceSessionChange,
} from './session-lock'

import { useAuthStore } from '../stores/auth.store'

import type {
  AuthResponse,
  LoginData,
  RegisterData,
  User,
} from '../types/auth'

export async function login(input: LoginData) {
  return withSessionLock(async () => {
    const { data } = await publicApi.post<AuthResponse>(
      '/auth/web/login',
      input,
    )

    useAuthStore.getState().setSession(data)
    announceSessionChange()

    return data
  })
}

export async function register(input: RegisterData) {
  return withSessionLock(async () => {
    const { data } = await publicApi.post<AuthResponse>(
      '/auth/web/register',
      input,
    )

    useAuthStore.getState().setSession(data)
    announceSessionChange()

    return data
  })
}

export async function restoreSession() {
  await refreshSession()
}

export async function getMe() {
  const sessionId = useAuthStore.getState().sessionId

  const { data } = await api.get<User>('/auth/me')

  if (
    useAuthStore.getState().sessionId === sessionId
  ) {
    useAuthStore.getState().setUser(data)
  }

  return data
}

export async function logout() {
  await withSessionLock(async () => {
    await publicApi.post('/auth/web/logout')

    useAuthStore.getState().clearSession()
    announceSessionChange()
  })
}
