import { apiClient } from './client'
import type { Order, OrderItem, Paginated, Product, ProductImage } from './types'

export interface SellerProductFilters {
  search?: string
  category_id?: number
  is_active?: boolean
  stock_status?: 'in_stock' | 'out_of_stock'
  page?: number
  per_page?: number
}

export async function fetchSellerProducts(
  filters: SellerProductFilters = {},
): Promise<Paginated<Product>> {
  const { data } = await apiClient.get<Paginated<Product>>('/seller/products', {
    params: filters,
  })
  return data
}

export async function fetchSellerProduct(id: number): Promise<Product> {
  const { data } = await apiClient.get<Product>(`/seller/products/${id}`)
  return data
}

export interface SellerProductInput {
  category_id: number
  name: string
  description?: string | null
  price: number
  stock: number
  is_active?: boolean
}

export async function createSellerProduct(input: SellerProductInput): Promise<Product> {
  const { data } = await apiClient.post<Product>('/seller/products', input)
  return data
}

export async function updateSellerProduct(
  id: number,
  input: Partial<SellerProductInput>,
): Promise<Product> {
  const { data } = await apiClient.put<Product>(`/seller/products/${id}`, input)
  return data
}

export async function deleteSellerProduct(id: number): Promise<void> {
  await apiClient.delete(`/seller/products/${id}`)
}

export async function uploadProductImage(
  productId: number,
  file: File,
  altText?: string,
): Promise<ProductImage> {
  const formData = new FormData()
  formData.append('image', file)
  if (altText) {
    formData.append('alt_text', altText)
  }

  const { data } = await apiClient.post<ProductImage>(
    `/seller/products/${productId}/images`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )
  return data
}

export async function updateProductImage(
  productId: number,
  imageId: number,
  input: { is_primary?: boolean; sort_order?: number; alt_text?: string | null },
): Promise<ProductImage> {
  const { data } = await apiClient.patch<ProductImage>(
    `/seller/products/${productId}/images/${imageId}`,
    input,
  )
  return data
}

export async function deleteProductImage(productId: number, imageId: number): Promise<void> {
  await apiClient.delete(`/seller/products/${productId}/images/${imageId}`)
}

export async function fetchSellerOrders(params: {
  status?: string
  page?: number
  per_page?: number
} = {}): Promise<Paginated<Order>> {
  const { data } = await apiClient.get<Paginated<Order>>('/seller/orders', { params })
  return data
}

export async function fetchSellerOrder(id: number): Promise<Order> {
  const { data } = await apiClient.get<Order>(`/seller/orders/${id}`)
  return data
}

export async function updateOrderItemStatus(
  orderItemId: number,
  status: string,
): Promise<OrderItem> {
  const { data } = await apiClient.patch<OrderItem>(
    `/seller/order-items/${orderItemId}/status`,
    { status },
  )
  return data
}
