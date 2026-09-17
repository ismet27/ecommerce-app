import { apiClient } from './client'
import type { LoginResponse, User } from './types'

export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/login', { email, password })
  return data
}

export async function fetchMe(): Promise<User> {
  const { data } = await apiClient.get<User>('/me')
  return data
}

export async function logout(): Promise<void> {
  await apiClient.post('/logout')
}
