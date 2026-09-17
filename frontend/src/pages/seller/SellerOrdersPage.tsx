import { useEffect, useState } from 'react'
import { fetchSellerOrders, updateOrderItemStatus } from '../../api/seller'
import type { Order, OrderItem, Paginated } from '../../api/types'
import { getErrorMessage } from '../../api/client'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { ErrorAlert } from '../../components/ErrorAlert'
import { EmptyState } from '../../components/EmptyState'
import { Pagination } from '../../components/Pagination'
import { PageHeader } from '../../components/PageHeader'
import { StatusBadge } from '../../components/StatusBadge'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { formatMoney } from '../../utils/money'
import { formatDate } from '../../utils/labels'
import { useToast } from '../../context/ToastContext'

const NEXT_ACTIONS: Record<string, { status: string; label: string; danger?: boolean }[]> = {
  received: [
    { status: 'preparing', label: 'Hazırlanmaya Başla' },
    { status: 'cancelled', label: 'İptal Et', danger: true },
  ],
  preparing: [
    { status: 'completed', label: 'Tamamlandı Olarak İşaretle' },
    { status: 'cancelled', label: 'İptal Et', danger: true },
  ],
}

export function SellerOrdersPage() {
  const { showToast } = useToast()
  const [result, setResult] = useState<Paginated<Order> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pendingCancel, setPendingCancel] = useState<OrderItem | null>(null)
  const [updatingItemId, setUpdatingItemId] = useState<number | null>(null)

  function load() {
    setLoading(true)
    setError(null)
    fetchSellerOrders({ page, per_page: 10 })
      .then(setResult)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }

  useEffect(load, [page])

  async function applyStatus(item: OrderItem, status: string) {
    setUpdatingItemId(item.id)
    try {
      await updateOrderItemStatus(item.id, status)
      showToast('Sipariş kalemi güncellendi.', 'success')
      load()
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
    } finally {
      setUpdatingItemId(null)
      setPendingCancel(null)
    }
  }

  return (
    <div className="seller-orders-page">
      <PageHeader
        title="Siparişler"
        description="İş yerinize ait ürünleri içeren siparişler."
      />

      {loading && <LoadingSpinner label="Siparişler yükleniyor…" />}
      {error && <ErrorAlert message={error} />}

      {!loading && !error && result && result.data.length === 0 && (
        <EmptyState title="Henüz sipariş yok" description="Ürünleriniz satıldığında burada görünecek." />
      )}

      {!loading && !error && result && result.data.length > 0 && (
        <>
          <div className="order-cards">
            {result.data.map((order) => (
              <div key={order.id} className="order-card">
                <div className="order-card__header">
                  <div>
                    <strong>Sipariş #{order.id}</strong>
                    <p className="order-card__meta">
                      {order.customer?.name} · {order.customer?.email} · {formatDate(order.created_at)}
                    </p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>

                <div className="table-scroll">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Ürün</th>
                        <th>Adet</th>
                        <th>Ara Toplam</th>
                        <th>Durum</th>
                        <th aria-label="İşlemler" />
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item) => (
                        <tr key={item.id}>
                          <td>{item.product_name_snapshot}</td>
                          <td>{item.quantity}</td>
                          <td>{formatMoney(item.line_total)}</td>
                          <td>
                            <StatusBadge status={item.status} />
                          </td>
                          <td className="data-table__actions">
                            {(NEXT_ACTIONS[item.status] ?? []).map((action) => (
                              <button
                                key={action.status}
                                type="button"
                                className={`btn btn--small ${
                                  action.danger ? 'btn--danger' : 'btn--primary'
                                }`}
                                disabled={updatingItemId === item.id}
                                onClick={() =>
                                  action.status === 'cancelled'
                                    ? setPendingCancel(item)
                                    : applyStatus(item, action.status)
                                }
                              >
                                {action.label}
                              </button>
                            ))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>

          <Pagination meta={result.meta} onPageChange={setPage} />
        </>
      )}

      {pendingCancel && (
        <ConfirmDialog
          title="Sipariş Kalemini İptal Et"
          message={`"${pendingCancel.product_name_snapshot}" kalemini iptal etmek istediğinize emin misiniz? Stok geri yüklenecektir.`}
          confirmLabel="İptal Et"
          danger
          onConfirm={() => applyStatus(pendingCancel, 'cancelled')}
          onCancel={() => setPendingCancel(null)}
        />
      )}
    </div>
  )
}
