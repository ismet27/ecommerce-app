import axios, { type AxiosError } from 'axios'
import type { ApiErrorBody } from './types'

export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000/api'

const TOKEN_KEY = 'ecommerce_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { Accept: 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Anything mounted here is notified when a request comes back 401 so the
// AuthProvider can clear its in-memory session and redirect — without this
// interceptor having to know about React Router itself.
type UnauthorizedListener = () => void
let unauthorizedListeners: UnauthorizedListener[] = []

export function onUnauthorized(listener: UnauthorizedListener): () => void {
  unauthorizedListeners.push(listener)
  return () => {
    unauthorizedListeners = unauthorizedListeners.filter((l) => l !== listener)
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const isLoginRequest = error.config?.url?.includes('/login')

    if (error.response?.status === 401 && !isLoginRequest) {
      clearToken()
      unauthorizedListeners.forEach((listener) => listener())
    }

    return Promise.reject(error)
  },
)

/** Extracts a friendly Turkish message from any API/network error. */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    const body = error.response?.data as ApiErrorBody | undefined

    if (!error.response) {
      return 'Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin.'
    }

    if (status === 401) {
      return 'Oturumunuzun süresi doldu. Lütfen tekrar giriş yapın.'
    }

    if (status === 403) {
      return body?.message ?? 'Bu işlem için yetkiniz yok veya hesabınız pasif durumda.'
    }

    if (status === 404) {
      return 'Kayıt bulunamadı.'
    }

    if (status === 409) {
      return body?.message ?? 'Bu işlem şu anki durumla çakışıyor.'
    }

    if (status === 422) {
      const firstError = body?.errors ? Object.values(body.errors)[0]?.[0] : undefined
      return firstError ?? body?.message ?? 'Girdiğiniz bilgilerde hata var.'
    }

    return body?.message ?? 'Beklenmeyen bir sunucu hatası oluştu.'
  }

  return 'Beklenmeyen bir hata oluştu.'
}

/** Extracts per-field validation messages from a 422 response, if any. */
export function getFieldErrors(error: unknown): Record<string, string> {
  if (axios.isAxiosError(error) && error.response?.status === 422) {
    const body = error.response.data as ApiErrorBody
    const fieldErrors: Record<string, string> = {}
    for (const [field, messages] of Object.entries(body.errors ?? {})) {
      fieldErrors[field] = messages[0]
    }
    return fieldErrors
  }
  return {}
}
