import type { OrderStatus, Role } from '../api/types'

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  received: 'Sipariş Alındı',
  preparing: 'Hazırlanıyor',
  completed: 'Tamamlandı',
  cancelled: 'İptal Edildi',
}

export const ORDER_STATUS_TONES: Record<OrderStatus, 'neutral' | 'info' | 'success' | 'danger'> = {
  received: 'neutral',
  preparing: 'info',
  completed: 'success',
  cancelled: 'danger',
}

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Yönetici',
  seller: 'İş Yeri / Satıcı',
  customer: 'Müşteri',
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat('tr-TR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}
