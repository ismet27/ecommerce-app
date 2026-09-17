import { apiClient } from './client'
import type { Order, OrderStatus, Paginated } from './types'

export interface CreateOrderItemInput {
  product_id: number
  quantity: number
}

export interface CreateOrderInput {
  items: CreateOrderItemInput[]
  customer_note?: string
}

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const { data } = await apiClient.post<Order>('/orders', input)
  return data
}

export async function fetchMyOrders(params: {
  status?: OrderStatus
  page?: number
  per_page?: number
} = {}): Promise<Paginated<Order>> {
  const { data } = await apiClient.get<Paginated<Order>>('/orders', { params })
  return data
}

export async function fetchMyOrder(id: number): Promise<Order> {
  const { data } = await apiClient.get<Order>(`/orders/${id}`)
  return data
}
