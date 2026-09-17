import type { OrderStatus } from '../api/types'
import { ORDER_STATUS_LABELS, ORDER_STATUS_TONES } from '../utils/labels'

export function StatusBadge({ status }: { status: OrderStatus }) {
  const tone = ORDER_STATUS_TONES[status]
  return <span className={`badge badge--${tone}`}>{ORDER_STATUS_LABELS[status]}</span>
}

export function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span className={`badge ${active ? 'badge--success' : 'badge--neutral'}`}>
      {active ? 'Aktif' : 'Pasif'}
    </span>
  )
}
