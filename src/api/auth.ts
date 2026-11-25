import { api, publicApi } from './client'
import { useAuthStore } from '../stores/auth.store'

import type {
  AuthResponse,
  LoginData,
  RegisterData,
  User,
} from '../types/auth'

export async function login(input: LoginData) {
  const { data } = await publicApi.post<AuthResponse>(
    '/auth/login',
    input,
  )

  useAuthStore.getState().setSession(data)

  return data
}

export async function register(input: RegisterData) {
  const { data } = await publicApi.post<AuthResponse>(
    '/auth/register',
    input,
  )

  useAuthStore.getState().setSession(data)

  return data
}

export async function getMe() {
  const { data } = await api.get<User>('/auth/me')

  useAuthStore.getState().setUser(data)

  return data
}

export async function logout() {
  try {
    await api.post('/auth/logout')
  } finally {
    useAuthStore.getState().clearSession()
  }
}
