import { apiClient } from './client'
import type { CatalogProduct, Category, Paginated } from './types'

export interface CatalogFilters {
  search?: string
  category_id?: number
  min_price?: number
  max_price?: number
  in_stock?: boolean
  page?: number
  per_page?: number
}

export async function fetchCatalogProducts(
  filters: CatalogFilters = {},
): Promise<Paginated<CatalogProduct>> {
  const { data } = await apiClient.get<Paginated<CatalogProduct>>('/catalog/products', {
    params: filters,
  })
  return data
}

export async function fetchCatalogProduct(id: number): Promise<CatalogProduct> {
  const { data } = await apiClient.get<CatalogProduct>(`/catalog/products/${id}`)
  return data
}

/** Not paginated on the backend — returns a plain array of active categories. */
export async function fetchCatalogCategories(): Promise<Category[]> {
  const { data } = await apiClient.get<Category[]>('/catalog/categories')
  return data
}
