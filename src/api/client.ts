import axios from 'axios'
import { useAuthStore } from '../stores/auth.store'
import { withSessionLock } from './session-lock'

import type { AuthResponse } from '../types/auth'

import type {
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios'

interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
  _sessionId?: string | null
}

export const publicApi = axios.create({
  baseURL: '/api/v1',
  timeout: 15000,
  withCredentials: true,
})

export const api = axios.create({
  baseURL: '/api/v1',
  timeout: 15000,
  withCredentials: true,
})

let refreshPromise: Promise<string> | null = null

api.interceptors.request.use(config => {
  const state = useAuthStore.getState()

  if (state.accessToken) {
    config.headers.Authorization =
      `Bearer ${state.accessToken}`
  }

  const request = config as RetryConfig
  request._sessionId = state.sessionId

  return config
})

export function refreshSession(): Promise<string> {
  if (refreshPromise) {
    return refreshPromise
  }

  refreshPromise = withSessionLock(async () => {
    const previous = useAuthStore.getState()

    try {
      const { data } =
        await publicApi.post<AuthResponse>(
          '/auth/web/refresh',
        )

      useAuthStore.getState().setSession(data)

      return data.accessToken
    } catch (error) {
      if (
        axios.isAxiosError(error) &&
        error.response?.status === 401 &&
        useAuthStore.getState().sessionId ===
          previous.sessionId
      ) {
        useAuthStore.getState().clearSession()
      }

      throw error
    }
  }).finally(() => {
    refreshPromise = null
  })

  return refreshPromise
}

api.interceptors.response.use(
  response => response,

  async (error: AxiosError) => {
    const config = error.config as RetryConfig | undefined

    if (
      error.response?.status !== 401 ||
      !config ||
      config._retry
    ) {
      return Promise.reject(error)
    }

    config._retry = true

    const current = useAuthStore.getState()

    if (
      !current.sessionId ||
      config._sessionId !== current.sessionId
    ) {
      return Promise.reject(error)
    }

    const originalSessionId = current.sessionId

    try {
      if (
        !current.accessToken ||
        config.headers.Authorization ===
          `Bearer ${current.accessToken}`
      ) {
        await refreshSession()
      }

      if (
        useAuthStore.getState().sessionId !==
          originalSessionId
      ) {
        throw new Error('Session changed')
      }

      return api(config)
    } catch (refreshError) {
      return Promise.reject(refreshError)
    }
  },
)

export function getApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 429) {
      return 'Zbyt wiele prób. Spróbuj ponownie za chwilę.'
    }

    if (error.response?.status === 401) {
      return 'Nieprawidłowe dane logowania lub wygasła sesja.'
    }

    const message = error.response?.data?.message

    if (Array.isArray(message)) {
      return message.join('. ')
    }

    if (typeof message === 'string') {
      return message
    }

    if (!error.response) {
      return 'Nie można połączyć się z serwerem.'
    }
  }

  return 'Wystąpił nieoczekiwany błąd.'
}
