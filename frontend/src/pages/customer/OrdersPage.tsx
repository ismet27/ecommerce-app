import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchMyOrders } from '../../api/customerOrders'
import type { Order, Paginated } from '../../api/types'
import { getErrorMessage } from '../../api/client'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { ErrorAlert } from '../../components/ErrorAlert'
import { EmptyState } from '../../components/EmptyState'
import { Pagination } from '../../components/Pagination'
import { StatusBadge } from '../../components/StatusBadge'
import { PageHeader } from '../../components/PageHeader'
import { formatMoney } from '../../utils/money'
import { formatDate } from '../../utils/labels'

export function OrdersPage() {
  const [result, setResult] = useState<Paginated<Order> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  useEffect(() => {
    setLoading(true)
    fetchMyOrders({ page, per_page: 10 })
      .then(setResult)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [page])

  return (
    <div className="orders-page">
      <PageHeader title="Siparişlerim" />

      {loading && <LoadingSpinner label="Siparişler yükleniyor…" />}
      {error && <ErrorAlert message={error} />}

      {!loading && !error && result && result.data.length === 0 && (
        <EmptyState
          title="Henüz siparişiniz yok"
          description="Ürünlere göz atarak alışverişe başlayabilirsiniz."
          action={
            <Link to="/" className="btn btn--primary">
              Ürünlere Göz At
            </Link>
          }
        />
      )}

      {!loading && !error && result && result.data.length > 0 && (
        <>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Sipariş No</th>
                  <th>Tarih</th>
                  <th>Durum</th>
                  <th>Ürün Adedi</th>
                  <th>Toplam</th>
                  <th aria-label="İşlemler" />
                </tr>
              </thead>
              <tbody>
                {result.data.map((order) => (
                  <tr key={order.id}>
                    <td>#{order.id}</td>
                    <td>{formatDate(order.created_at)}</td>
                    <td>
                      <StatusBadge status={order.status} />
                    </td>
                    <td>{order.items.length}</td>
                    <td>{formatMoney(order.total_amount)}</td>
                    <td>
                      <Link to={`/orders/${order.id}`} className="btn btn--ghost btn--small">
                        Detay
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination meta={result.meta} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}
