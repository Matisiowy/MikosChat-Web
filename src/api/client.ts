import axios from 'axios'
import { useAuthStore } from '../stores/auth.store'

import type {
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios'

interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

export const publicApi = axios.create({
  baseURL: '/api/v1',
  timeout: 15000,
})

export const api = axios.create({
  baseURL: '/api/v1',
  timeout: 15000,
})

let refreshPromise: Promise<string> | null = null

api.interceptors.request.use(config => {
  const token = useAuthStore.getState().accessToken

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

async function refreshSession(): Promise<string> {
  const store = useAuthStore.getState()
  const refreshToken = store.refreshToken

  if (!refreshToken) {
    throw new Error('No active session')
  }

  const { data } = await publicApi.post('/auth/refresh', {
    refreshToken,
  })

  if (useAuthStore.getState().refreshToken !== refreshToken) {
    throw new Error('Session changed')
  }

  useAuthStore.getState().setTokens(
    data.accessToken,
    data.refreshToken,
  )

  return data.accessToken
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

    if (!current.refreshToken) {
      return Promise.reject(error)
    }

    const originalRefreshToken = current.refreshToken

    try {
      if (
        current.accessToken &&
        config.headers.Authorization !==
          `Bearer ${current.accessToken}`
      ) {
        return api(config)
      }

      if (!refreshPromise) {
        refreshPromise = refreshSession().finally(() => {
          refreshPromise = null
        })
      }

      await refreshPromise

      return api(config)
    } catch (refreshError) {
      if (
        useAuthStore.getState().refreshToken ===
        originalRefreshToken
      ) {
        useAuthStore.getState().clearSession()
      }

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
      return 'Nieprawidłowy login lub hasło.'
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
