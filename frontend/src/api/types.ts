// TypeScript shapes mirroring the real Laravel API responses exactly
// (see backend/app/Http/Resources/*.php). Money fields come back as
// decimal strings (e.g. "199.90"), never as JS numbers, so backend
// totals are never re-derived through float arithmetic on this side.

export type Role = 'admin' | 'seller' | 'customer'

export type OrderStatus = 'received' | 'preparing' | 'completed' | 'cancelled'

export interface User {
  id: number
  business_id: number | null
  name: string
  email: string
  role: Role
  is_active: boolean
}

export interface Business {
  id: number
  name: string
  description: string | null
  phone: string | null
  email: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Category {
  id: number
  name: string
  slug: string
  description: string | null
  is_active: boolean
}

export interface ProductImage {
  id: number
  url: string
  alt_text: string | null
  sort_order: number
  is_primary: boolean
}

/** Management view (seller/admin) — includes ownership fields. */
export interface Product {
  id: number
  business_id: number
  category_id: number
  name: string
  slug: string
  description: string | null
  price: string
  stock: number
  is_active: boolean
  category?: Category
  business?: Business
  images: ProductImage[]
  primary_image: ProductImage | null
  deleted_at: string | null
  created_at: string
  updated_at: string
}

/** Public/customer catalog view — deliberately omits ownership fields. */
export interface CatalogProduct {
  id: number
  name: string
  slug: string
  description: string | null
  price: string
  stock: number
  category?: { id: number; name: string; slug: string }
  business?: { id: number; name: string }
  images: ProductImage[]
  primary_image: ProductImage | null
  created_at: string
}

export interface OrderItem {
  id: number
  product_id: number
  product_name_snapshot: string
  unit_price_snapshot: string
  quantity: number
  line_total: string
  status: OrderStatus
  business?: { id: number; name: string }
}

export interface Order {
  id: number
  status: OrderStatus
  total_amount: string
  customer_note: string | null
  // Only present when the backend eager-loaded the "user" relation
  // (admin/seller views); absent on the customer's own order responses.
  customer?: { name: string; email: string }
  items: OrderItem[]
  created_at: string
}

export interface PaginationLinks {
  first: string | null
  last: string | null
  prev: string | null
  next: string | null
}

export interface PaginationMeta {
  current_page: number
  from: number | null
  last_page: number
  path: string
  per_page: number
  to: number | null
  total: number
}

export interface Paginated<T> {
  data: T[]
  links: PaginationLinks
  meta: PaginationMeta
}

export interface LoginResponse {
  token: string
  token_type: string
  user: User
}

export interface ApiErrorBody {
  message: string
  errors?: Record<string, string[]>
}
