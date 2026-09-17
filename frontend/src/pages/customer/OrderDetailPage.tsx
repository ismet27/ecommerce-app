import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { fetchMyOrder } from '../../api/customerOrders'
import type { Order } from '../../api/types'
import { getErrorMessage } from '../../api/client'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { ErrorAlert } from '../../components/ErrorAlert'
import { StatusBadge } from '../../components/StatusBadge'
import { formatMoney } from '../../utils/money'
import { formatDate } from '../../utils/labels'

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    fetchMyOrder(Number(id))
      .then(setOrder)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <LoadingSpinner label="Sipariş yükleniyor…" />
  if (error) return <ErrorAlert message={error} />
  if (!order) return null

  return (
    <div className="order-detail">
      <Link to="/orders" className="btn btn--ghost btn--small">
        <ArrowLeft size={16} aria-hidden="true" /> Siparişlerime Dön
      </Link>

      <div className="order-detail__header">
        <div>
          <h1>Sipariş #{order.id}</h1>
          <p className="order-detail__date">{formatDate(order.created_at)}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="order-detail__success">
        Sipariş alındı. Bu projede ödeme ve kargo entegrasyonu bulunmamaktadır.
      </div>

      {order.customer_note && (
        <div className="order-detail__note">
          <strong>Sipariş Notu:</strong> {order.customer_note}
        </div>
      )}

      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Ürün</th>
              <th>İş Yeri</th>
              <th>Adet</th>
              <th>Birim Fiyat</th>
              <th>Ara Toplam</th>
              <th>Durum</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id}>
                <td>{item.product_name_snapshot}</td>
                <td>{item.business?.name ?? '—'}</td>
                <td>{item.quantity}</td>
                <td>{formatMoney(item.unit_price_snapshot)}</td>
                <td>{formatMoney(item.line_total)}</td>
                <td>
                  <StatusBadge status={item.status} />
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} className="data-table__total-label">
                Genel Toplam
              </td>
              <td colSpan={2} className="data-table__total-value">
                {formatMoney(order.total_amount)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
