import { apiClient } from './client'
import type { Business, Category, Order, Paginated, Product, Role, User } from './types'

// ---------- Businesses ----------

export interface BusinessFilters {
  search?: string
  is_active?: boolean
  page?: number
  per_page?: number
}

export async function fetchBusinesses(filters: BusinessFilters = {}): Promise<Paginated<Business>> {
  const { data } = await apiClient.get<Paginated<Business>>('/admin/businesses', { params: filters })
  return data
}

export interface BusinessInput {
  name: string
  description?: string | null
  phone?: string | null
  email?: string | null
  is_active?: boolean
}

export async function createBusiness(input: BusinessInput): Promise<Business> {
  const { data } = await apiClient.post<Business>('/admin/businesses', input)
  return data
}

export async function updateBusiness(id: number, input: Partial<BusinessInput>): Promise<Business> {
  const { data } = await apiClient.put<Business>(`/admin/businesses/${id}`, input)
  return data
}

// ---------- Categories ----------

export interface CategoryFilters {
  search?: string
  is_active?: boolean
  page?: number
  per_page?: number
}

export async function fetchAdminCategories(
  filters: CategoryFilters = {},
): Promise<Paginated<Category>> {
  const { data } = await apiClient.get<Paginated<Category>>('/admin/categories', { params: filters })
  return data
}

export interface CategoryInput {
  name: string
  slug?: string | null
  description?: string | null
  is_active?: boolean
}

export async function createCategory(input: CategoryInput): Promise<Category> {
  const { data } = await apiClient.post<Category>('/admin/categories', input)
  return data
}

export async function updateCategory(id: number, input: Partial<CategoryInput>): Promise<Category> {
  const { data } = await apiClient.put<Category>(`/admin/categories/${id}`, input)
  return data
}

// ---------- Users ----------

export interface UserFilters {
  search?: string
  role?: Role
  is_active?: boolean
  business_id?: number
  page?: number
  per_page?: number
}

export async function fetchUsers(filters: UserFilters = {}): Promise<Paginated<User>> {
  const { data } = await apiClient.get<Paginated<User>>('/admin/users', { params: filters })
  return data
}

export interface CreateUserInput {
  name: string
  email: string
  password: string
  password_confirmation: string
  role: Role
  business_id?: number | null
  is_active?: boolean
}

export async function createUser(input: CreateUserInput): Promise<User> {
  const { data } = await apiClient.post<User>('/admin/users', input)
  return data
}

export interface UpdateUserInput {
  name?: string
  email?: string
  password?: string
  password_confirmation?: string
  role?: Role
  business_id?: number | null
  is_active?: boolean
}

export async function updateUser(id: number, input: UpdateUserInput): Promise<User> {
  const { data } = await apiClient.patch<User>(`/admin/users/${id}`, input)
  return data
}

// ---------- Products (read-only inspection) ----------

export interface AdminProductFilters {
  search?: string
  business_id?: number
  category_id?: number
  is_active?: boolean
  with_trashed?: boolean
  page?: number
  per_page?: number
}

export async function fetchAdminProducts(
  filters: AdminProductFilters = {},
): Promise<Paginated<Product>> {
  const { data } = await apiClient.get<Paginated<Product>>('/admin/products', { params: filters })
  return data
}

export async function fetchAdminProduct(id: number): Promise<Product> {
  const { data } = await apiClient.get<Product>(`/admin/products/${id}`)
  return data
}

// ---------- Orders (read-only inspection) ----------

export interface AdminOrderFilters {
  search?: string
  status?: string
  business_id?: number
  min_total?: number
  max_total?: number
  date_from?: string
  date_to?: string
  page?: number
  per_page?: number
}

export async function fetchAdminOrders(filters: AdminOrderFilters = {}): Promise<Paginated<Order>> {
  const { data } = await apiClient.get<Paginated<Order>>('/admin/orders', { params: filters })
  return data
}

export async function fetchAdminOrder(id: number): Promise<Order> {
  const { data } = await apiClient.get<Order>(`/admin/orders/${id}`)
  return data
}
